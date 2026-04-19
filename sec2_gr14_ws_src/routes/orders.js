const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────
//  CHECKOUT (Create Order)
// ─────────────────────────────────────────────
// POST /api/orders
router.post('/', requireAuth, async (req, res) => {
  const { addressDetail, contactEmail } = req.body;
  const memberId = req.user.id;

  if (!addressDetail) {
    return res.status(400).json({ error: 'Delivery address is required.' });
  }

  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  try {
    // Verify member still exists (prevents FK error if DB was cleared)
    const [members] = await db.execute(
      'SELECT MemberId FROM Member WHERE MemberId = ?',
      [memberId]
    );
    if (members.length === 0) {
      return res.status(401).json({ error: 'Your account session is invalid. Please log out and back in.' });
    }

    // Fetch product details for cart items
    const productIds = cart.map(item => item.productId);
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await db.execute(
      `SELECT p.ProductId, p.ProductName, p.Price, p.QuantityLeft, m.MaterialName 
       FROM Product p
       LEFT JOIN Material m ON p.MaterialId = m.MaterialId
       WHERE p.ProductId IN (${placeholders})`,
      productIds
    );

    const productMap = {};
    products.forEach(p => { productMap[p.ProductId] = p; });

    // 1. Validate Stock & Calculate Totals
    let subTotal = 0;
    for (const item of cart) {
      const product = productMap[item.productId];
      if (!product) throw new Error(`Product ${item.productId} not found`);
      
      // Stock Check
      if (product.QuantityLeft < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for "${product.ProductName}". Available: ${product.QuantityLeft}, Requested: ${item.quantity}` 
        });
      }

      subTotal += product.Price * item.quantity;
    }

    const vatRate = 0.07;
    // Tiered Logistic Cost Logic
    let shippingFee = 15.00; 
    if (subTotal >= 1000) {
      shippingFee = 0.00;
    } else if (subTotal >= 500) {
      shippingFee = 10.00;
    }

    const vatAmount = parseFloat((subTotal * vatRate).toFixed(2));
    const totalAmount = parseFloat((subTotal + vatAmount + shippingFee).toFixed(2));
 
     // Create address record for this member
     const [addrResult] = await db.execute(
       'INSERT INTO Address (MemberId, AddressDetail) VALUES (?, ?)',
       [memberId, addressDetail]
     );
     const addressId = addrResult.insertId;
 
     // Create delivery record
     const [deliveryResult] = await db.execute(
       "INSERT INTO Delivery (AddressId, Status) VALUES (?, 'Pending')",
       [addressId]
     );
     const trackingId = deliveryResult.insertId;
 
     // Create order
     const [orderResult] = await db.execute(
       `INSERT INTO Orders (MemberId, TrackingId, ContactEmail, TotalAmount, VatAmount, ShippingAmount)
        VALUES (?, ?, ?, ?, ?, ?)`,
       [memberId, trackingId, contactEmail || req.user.email, totalAmount, vatAmount, shippingFee]
     );
    const orderId = orderResult.insertId;

    // 2. Consolidate Items by ProductId + ColorName
    const groupedItems = []; 
    for (const item of cart) {
      const product = productMap[item.productId];
      groupedItems.push({
        productId: item.productId,
        qty: item.quantity,
        colorName: item.colorName || 'Standard',
        materialName: product.MaterialName || 'Standard'
      });
    }

    // 3. Create order items & Deduct Stock
    for (const item of groupedItems) {
      // Record item with color/material snapshot
      await db.execute(
        'INSERT INTO OrderItem (ProductId, OrderId, ItemQuantity, ColorName, MaterialName) VALUES (?, ?, ?, ?, ?)',
        [item.productId, orderId, item.qty, item.colorName, item.materialName]
      );
      // Deduct stock (Global per product)
      await db.execute(
        'UPDATE Product SET QuantityLeft = QuantityLeft - ? WHERE ProductId = ?',
        [item.qty, item.productId]
      );
    }

    // Clear the cart after successful order
    req.session.cart = [];

    return res.status(201).json({
      message: 'Order placed successfully!',
      orderId,
      trackingId,
      totalAmount,
      vatAmount,
      shippingFee
    });
  } catch (err) {
    console.error('[POST /orders] Error details:', err);
    return res.status(500).json({ error: `Failed to place order: ${err.message}` });
  }
});

// ─────────────────────────────────────────────
//  GET MY ORDERS
// ─────────────────────────────────────────────
// GET /api/orders/my
router.get('/my', requireAuth, async (req, res) => {
  try {
    const [orders] = await db.execute(
      `SELECT o.OrderId, o.TotalAmount, o.VatAmount, o.OrderDate,
              d.Status, a.AddressDetail
       FROM Orders o
       JOIN Delivery d ON o.TrackingId = d.TrackingId
       JOIN Address a ON d.AddressId = a.AddressId
       WHERE o.MemberId = ?
       ORDER BY o.OrderDate DESC`,
      [req.user.id]
    );
    return res.json(orders);
  } catch (err) {
    console.error('[GET /orders/my]', err);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// ─────────────────────────────────────────────
//  GET ORDER DETAILS (OWNER ONLY)
// ─────────────────────────────────────────────
// GET /api/orders/my/:id
router.get('/my/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const memberId = req.user.id;
  
  try {
    // 1. Fetch Order with Delivery Info (Ensure it belongs to this user)
    const [orderRows] = await db.execute(`
      SELECT o.OrderId, o.TotalAmount, o.VatAmount, o.ShippingAmount, 
             o.OrderDate, 
             o.ContactEmail,
             m.FirstName, m.LastName, m.PhoneNumber,
             d.Status as DeliveryStatus,
             a.AddressDetail
      FROM Orders o
      JOIN Member m ON o.MemberId = m.MemberId
      JOIN Delivery d ON o.TrackingId = d.TrackingId
      JOIN Address a ON d.AddressId = a.AddressId
      WHERE o.OrderId = ? AND o.MemberId = ?
    `, [id, memberId]);

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found or access denied.' });
    }

    const order = orderRows[0];

    // 2. Fetch Order Items
    const [items] = await db.execute(`
      SELECT oi.ItemQuantity, oi.ColorName, oi.MaterialName,
             p.ProductId, p.ProductName, p.Price,
             (SELECT ImageUrl FROM Image WHERE ProductId = p.ProductId ORDER BY SortOrder ASC LIMIT 1) as ImageUrl,
             (oi.ItemQuantity * p.Price) as SubTotal
      FROM OrderItem oi
      JOIN Product p ON oi.ProductId = p.ProductId
      WHERE oi.OrderId = ?
    `, [id]);

    return res.json({
      ...order,
      items
    });
  } catch (err) {
    console.error(`[GET /orders/my/${id}]`, err);
    return res.status(500).json({ error: 'Failed to fetch order details.' });
  }
});

module.exports = router;
