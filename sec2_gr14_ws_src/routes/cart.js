/**
 * cart.js — BoonSonClon Shopping Cart Management
 * Purpose: Route handler for managing the session-based shopping cart.
 * Supports adding, updating, and removing products with persistence in 
 * the express-session store.
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

// Cart is stored in express-session as:
// req.session.cart = [ { productId, quantity, addedAt }, ... ]

/**
 * getCart — Session Cart Retreival
 * Ensures the session cart exists and returns it.
 * @param {Object} req - The Express request object.
 * @returns {Array} - The current session cart items.
 */
function getCart(req) {
    if (!req.session.cart) req.session.cart = [];
    return req.session.cart;
}

// ─────────────────────────────────────────────
//  GET CART (with product details)
// ─────────────────────────────────────────────
/**
 * GET /api/cart
 * Hydrates the session cart with full product details from the database.
 */
router.get('/', async (req, res) => {
    try {
        const cart = getCart(req);
        if (cart.length === 0) return res.json({ items: [], total: 0 });

        const productIds = cart.map(item => item.productId);
        const placeholders = productIds.map(() => '?').join(',');

        const [products] = await db.execute(
            `SELECT p.ProductId, p.ProductName, p.Price, p.ProductDescription,
                    p.WidthDimension, p.HeightDimension, p.LengthDimension, p.Weight,
                    c.Category, m.MaterialName,
                    (SELECT ImageUrl FROM Image WHERE ProductId = p.ProductId LIMIT 1) AS ImageUrl
             FROM Product p
             JOIN Category c ON p.CategoryId = c.CategoryId
             LEFT JOIN Material m ON p.MaterialId = m.MaterialId
             WHERE p.ProductId IN (${placeholders})`,
            productIds
        );

        // Merge DB data with cart quantities and color info
        const productMap = {};
        products.forEach(p => { productMap[p.ProductId] = p; });

        const items = await Promise.all(cart
            .filter(item => productMap[item.productId]) // skip deleted products
            .map(async item => {
                const productData = { ...productMap[item.productId] };
                
                // If no color selected in session, try to find the first one from DB
                if (!item.colorName || item.colorName === '—') {
                    const [colors] = await db.execute(
                        `SELECT col.ColorName FROM Color col
                         JOIN ProductColor pc ON col.ColorId = pc.ColorId
                         WHERE pc.ProductId = ? LIMIT 1`,
                        [item.productId]
                    );
                    productData.colorName = colors.length > 0 ? colors[0].ColorName : 'Standard';
                } else {
                    productData.colorName = item.colorName;
                }

                return {
                    ...productData,
                    quantity: item.quantity,
                    colorId: item.colorId || null,
                };
            }));

        const total = items.reduce((sum, item) => sum + item.Price * item.quantity, 0);

        return res.json({ items, total: parseFloat(total.toFixed(2)) });
    } catch (err) {
        console.error('[GET /cart]', err);
        return res.status(500).json({ error: 'Failed to fetch cart.' });
    }
});

// ─────────────────────────────────────────────
//  ADD TO CART
// ─────────────────────────────────────────────
/**
 * POST /api/cart
 * Adds an item to the session cart or increments quantity if already exists.
 */
router.post('/', async (req, res) => {
    const { productId, quantity = 1, colorId, colorName } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'productId is required.' });
    }

    try {
        // Verify product exists
        const [rows] = await db.execute(
            'SELECT ProductId, QuantityLeft FROM Product WHERE ProductId = ?',
            [productId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const cart = getCart(req);
        // Check if product with same color already exists in cart
        const existingIndex = cart.findIndex(item => 
            item.productId === parseInt(productId) && 
            (item.colorId === colorId || (!item.colorId && !colorId))
        );

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += parseInt(quantity);
        } else {
            cart.push({
                productId: parseInt(productId),
                quantity: parseInt(quantity),
                colorId: colorId || null,
                colorName: colorName || null,
                addedAt: new Date()
            });
        }

        req.session.cart = cart;
        return res.json({ message: 'Item added to cart.', cartCount: cart.length });
    } catch (err) {
        console.error('[POST /cart]', err);
        return res.status(500).json({ error: 'Failed to add item to cart.' });
    }
});

// ─────────────────────────────────────────────
//  UPDATE QUANTITY
// ─────────────────────────────────────────────
/**
 * PATCH /api/cart/:productId
 * Updates the specific quantity of a product in the session cart.
 */
router.patch('/:productId', (req, res) => {
    const { quantity } = req.body;
    const productId = parseInt(req.params.productId);

    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    const cart = getCart(req);
    const index = cart.findIndex(item => item.productId === productId);

    if (index === -1) {
        return res.status(404).json({ error: 'Item not in cart.' });
    }

    cart[index].quantity = parseInt(quantity);
    req.session.cart = cart;
    return res.json({ message: 'Cart updated.' });
});

// ─────────────────────────────────────────────
//  REMOVE FROM CART
// ─────────────────────────────────────────────
/**
 * DELETE /api/cart/:productId
 * Removes a specific product from the session cart.
 */
router.delete('/:productId', (req, res) => {
    const productId = parseInt(req.params.productId);
    const cart = getCart(req);
    const newCart = cart.filter(item => item.productId !== productId);
    req.session.cart = newCart;
    return res.json({ message: 'Item removed from cart.', cartCount: newCart.length });
});

// ─────────────────────────────────────────────
//  CLEAR CART
// ─────────────────────────────────────────────
/**
 * DELETE /api/cart
 * Completely empties the session cart.
 */
router.delete('/', (req, res) => {
    req.session.cart = [];
    return res.json({ message: 'Cart cleared.' });
});

module.exports = router;
