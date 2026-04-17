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
    // Fetch product details for cart items
    const productIds = cart.map(item => item.productId);
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await db.execute(
      `SELECT ProductId, Price FROM Product WHERE ProductId IN (${placeholders})`,
      productIds
    );

    const productMap = {};
    products.forEach(p => { productMap[p.ProductId] = p; });

    // Calculate totals
    let subTotal = 0;
    for (const item of cart) {
      const product = productMap[item.productId];
      if (!product) throw new Error(`Product ${item.productId} not found`);
      subTotal += product.Price * item.quantity;
    }
    const vatRate = 0.07;
    const vatAmount = parseFloat((subTotal * vatRate).toFixed(2));
    const totalAmount = parseFloat((subTotal + vatAmount).toFixed(2));

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
      `INSERT INTO Orders (MemberId, TrackingId, ContactEmail, TotalAmount, VatAmount)
       VALUES (?, ?, ?, ?, ?)`,
      [memberId, trackingId, contactEmail || req.user.email, totalAmount, vatAmount]
    );
    const orderId = orderResult.insertId;

    // Create order items
    for (const item of cart) {
      await db.execute(
        'INSERT INTO OrderItem (ProductId, OrderId, ItemQuantity) VALUES (?, ?, ?)',
        [item.productId, orderId, item.quantity]
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
    });
  } catch (err) {
    console.error('[POST /orders]', err);
    return res.status(500).json({ error: 'Failed to place order. Please try again.' });
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

module.exports = router;
