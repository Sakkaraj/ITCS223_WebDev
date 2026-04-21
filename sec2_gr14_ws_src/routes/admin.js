/**
 * admin.js — BoonSonClon Admin Operations
 * Purpose: Route handler for administrative functions, including dashboard statistics, 
 * global order management, member audits, and inquiry handling.
 */

const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/admin/stats
 * Returns top-level business metrics.
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        // 1. Total Revenue
        const [revenueRows] = await db.execute('SELECT SUM(TotalAmount) as TotalRevenue FROM Orders');
        const totalRevenue = revenueRows[0]?.TotalRevenue || 0;

        // 2. Member Count
        const [memberRows] = await db.execute('SELECT COUNT(*) as MemberCount FROM Member');
        const memberCount = memberRows[0]?.MemberCount || 0;

        // 3. Order Count
        const [orderRows] = await db.execute('SELECT COUNT(*) as OrderCount FROM Orders');
        const orderCount = orderRows[0]?.OrderCount || 0;

        // 4. Product Count
        const [productRows] = await db.execute('SELECT COUNT(*) as ProductCount FROM Product');
        const productCount = productRows[0]?.ProductCount || 0;

        return res.json({
            totalRevenue: parseFloat(totalRevenue).toFixed(2),
            memberCount,
            orderCount,
            productCount
        });
    } catch (err) {
        console.error('[GET /admin/stats]', err);
        return res.status(500).json({ error: 'Failed to fetch statistics.' });
    }
});

/**
 * GET /api/admin/orders
 * Returns all orders with customer details.
 */
router.get('/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.execute(`
            SELECT o.OrderId, o.TotalAmount, 
                   o.OrderDate, 
                   o.ContactEmail,
                   m.FirstName, m.LastName,
                   d.Status as DeliveryStatus,
                   a.AddressDetail
            FROM Orders o
            JOIN Member m ON o.MemberId = m.MemberId
            JOIN Delivery d ON o.TrackingId = d.TrackingId
            JOIN Address a ON d.AddressId = a.AddressId
            ORDER BY o.OrderDate DESC
        `);
        return res.json(orders);
    } catch (err) {
        console.error('[GET /admin/orders]', err);
        return res.status(500).json({ error: 'Failed to fetch global orders.' });
    }
});

/**
 * GET /api/admin/orders/:id
 * Returns details for a specific order including items.
 */
router.get('/orders/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Fetch Order with Customer & Delivery Info
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
            WHERE o.OrderId = ?
        `, [id]);

        if (orderRows.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const order = orderRows[0];

        // 2. Fetch Order Items with rich metadata
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
        console.error(`[GET /admin/orders/${id}]`, err);
        return res.status(500).json({ error: 'Failed to fetch order details.' });
    }
});

/**
 * GET /api/admin/members
 * Returns a list of all registered members.
 */
router.get('/members', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [members] = await db.execute(`
            SELECT MemberId, FirstName, LastName, MemberEmail, PhoneNumber
            FROM Member
            ORDER BY MemberId DESC
        `);
        return res.json(members);
    } catch (err) {
        console.error('[GET /admin/members]', err);
        return res.status(500).json({ error: 'Failed to fetch members.' });
    }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Updates the delivery status for a specific order.
 */
router.patch('/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required.' });
    }

    try {
        // 1. Get the associated TrackingId for the order
        const [orders] = await db.execute('SELECT TrackingId FROM Orders WHERE OrderId = ?', [id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Defensive check for case variations (PostgreSQL fallback)
        const trackingId = orders[0].TrackingId || orders[0].trackingid;

        if (!trackingId) {
            return res.status(400).json({ error: 'No delivery record found for this order.' });
        }

        // 2. Update the status in the Delivery table
        await db.execute(
            'UPDATE Delivery SET Status = ? WHERE TrackingId = ?',
            [status, trackingId]
        );

        return res.json({ 
            message: 'Order status updated successfully!',
            orderId: id,
            newStatus: status
        });
    } catch (err) {
        console.error('[PATCH /admin/orders/:id/status]', err);
        return res.status(500).json({ error: 'Failed to update order status.' });
    }
});

/**
 * GET /api/admin/contacts
 * Returns all user inquiries from the contact form.
 */
router.get('/contacts', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Using SELECT * and ordering by ContactorId to be resilient against missing CreatedAt column in some environments
        const [contacts] = await db.execute(`
            SELECT * FROM Contactors
            ORDER BY ContactorId DESC
        `);
        return res.json(contacts);
    } catch (err) {
        console.error('[GET /admin/contacts]', err);
        return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

module.exports = router;
