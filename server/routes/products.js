const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────
//  GET ALL PRODUCTS (with optional filters)
// ─────────────────────────────────────────────
// GET /api/products?category=&minPrice=&maxPrice=&featured=&sort=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      featured,
      sort = 'latest',
      page = 1,
      limit = 12,
    } = req.query;

    let whereClauses = [];
    let params = [];

    if (category) {
      whereClauses.push('c.Category = ?');
      params.push(category);
    }
    if (minPrice) {
      whereClauses.push('p.Price >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereClauses.push('p.Price <= ?');
      params.push(parseFloat(maxPrice));
    }
    if (featured === 'true' || featured === '1') {
      whereClauses.push('p.Featured = 1');
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    let orderSQL = 'ORDER BY p.ProductId DESC';
    if (sort === 'price_asc') orderSQL = 'ORDER BY p.Price ASC';
    else if (sort === 'price_desc') orderSQL = 'ORDER BY p.Price DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Count total for pagination
    const [countRows] = await db.execute(
      `SELECT COUNT(*) as total
       FROM Product p
       JOIN Category c ON p.CategoryId = c.CategoryId
       ${whereSQL}`,
      params
    );
    const total = countRows[0].total;

    // Fetch paginated products with first image
    const [products] = await db.execute(
      `SELECT p.ProductId, p.ProductName, p.Price, p.QuantityLeft,
              p.ProductDescription, p.Featured, c.Category,
              (SELECT ImageUrl FROM Image WHERE ProductId = p.ProductId LIMIT 1) AS ImageUrl
       FROM Product p
       JOIN Category c ON p.CategoryId = c.CategoryId
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // For each product, fetch its colors
    for (const product of products) {
      const [colors] = await db.execute(
        `SELECT col.ColorId, col.ColorName, col.HexCode
         FROM Color col
         JOIN ProductColor pc ON col.ColorId = pc.ColorId
         WHERE pc.ProductId = ?`,
        [product.ProductId]
      );
      product.colors = colors;
    }

    return res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[GET /products]', err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ─────────────────────────────────────────────
//  GET ALL CATEGORIES  ← must be before /:id
// ─────────────────────────────────────────────
// GET /api/products/meta/categories
router.get('/meta/categories', async (req, res) => {
  try {
    const [categories] = await db.execute(
      `SELECT c.CategoryId, c.Category,
              COUNT(p.ProductId) AS ProductCount
       FROM Category c
       LEFT JOIN Product p ON c.CategoryId = p.CategoryId
       GROUP BY c.CategoryId, c.Category
       ORDER BY c.Category`
    );
    return res.json(categories);
  } catch (err) {
    console.error('[GET /categories]', err);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// ─────────────────────────────────────────────
//  GET SINGLE PRODUCT
// ─────────────────────────────────────────────
// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, c.Category,
              p.WidthDimension, p.HeightDimension, p.LengthDimension, p.Weight
       FROM Product p
       JOIN Category c ON p.CategoryId = c.CategoryId
       WHERE p.ProductId = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = rows[0];

    // Get all images
    const [images] = await db.execute(
      'SELECT ImageUrl FROM Image WHERE ProductId = ?',
      [req.params.id]
    );

    // Get colors
    const [colors] = await db.execute(
      `SELECT col.ColorId, col.ColorName, col.HexCode
       FROM Color col
       JOIN ProductColor pc ON col.ColorId = pc.ColorId
       WHERE pc.ProductId = ?`,
      [req.params.id]
    );

    // Get reviews
    const [reviews] = await db.execute(
      `SELECT r.Rating, r.ReviewComment,
              m.FirstName, m.LastName
       FROM Review r
       JOIN Member m ON r.MemberId = m.MemberId
       WHERE r.ProductId = ?
       ORDER BY r.ReviewId DESC`,
      [req.params.id]
    );

    return res.json({ ...product, images, colors, reviews });
  } catch (err) {
    console.error('[GET /products/:id]', err);
    return res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// ─────────────────────────────────────────────
//  ADD PRODUCT (Admin only)
// ─────────────────────────────────────────────
// POST /api/products
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const {
    productName, categoryId, price, quantityLeft = 0,
    productDescription, productDetail,
    widthDimension = 0, heightDimension = 0, lengthDimension = 0, weight = 0,
    featured = false, imageUrl, colorId,
  } = req.body;

  if (!productName || !categoryId || !price || !productDescription || !productDetail) {
    return res.status(400).json({ error: 'Name, category, price, and description are required.' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO Product
         (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail,
          WidthDimension, HeightDimension, LengthDimension, Weight, Featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, productName, price, quantityLeft, productDescription, productDetail,
       widthDimension, heightDimension, lengthDimension, weight, featured ? 1 : 0]
    );

    const productId = result.insertId;

    // Insert image if provided
    if (imageUrl) {
      await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [productId, imageUrl]);
    }

    // Link color if provided
    if (colorId) {
      await db.execute('INSERT INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [productId, colorId]);
    }

    return res.status(201).json({ message: 'Product added successfully!', productId });
  } catch (err) {
    console.error('[POST /products]', err);
    return res.status(500).json({ error: 'Failed to add product.' });
  }
});

// ─────────────────────────────────────────────
//  UPDATE PRODUCT (Admin only)
// ─────────────────────────────────────────────
// PUT /api/products/:id
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const {
    productName, categoryId, price, quantityLeft,
    productDescription, productDetail,
    widthDimension, heightDimension, lengthDimension, weight,
    featured, imageUrl,
  } = req.body;

  try {
    const [check] = await db.execute('SELECT ProductId FROM Product WHERE ProductId = ?', [req.params.id]);
    if (check.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await db.execute(
      `UPDATE Product SET
         CategoryId = COALESCE(?, CategoryId),
         ProductName = COALESCE(?, ProductName),
         Price = COALESCE(?, Price),
         QuantityLeft = COALESCE(?, QuantityLeft),
         ProductDescription = COALESCE(?, ProductDescription),
         ProductDetail = COALESCE(?, ProductDetail),
         WidthDimension = COALESCE(?, WidthDimension),
         HeightDimension = COALESCE(?, HeightDimension),
         LengthDimension = COALESCE(?, LengthDimension),
         Weight = COALESCE(?, Weight),
         Featured = COALESCE(?, Featured)
       WHERE ProductId = ?`,
      [categoryId, productName, price, quantityLeft, productDescription, productDetail,
       widthDimension, heightDimension, lengthDimension, weight,
       featured !== undefined ? (featured ? 1 : 0) : null,
       req.params.id]
    );

    // Update image if new one provided
    if (imageUrl) {
      const [imgCheck] = await db.execute('SELECT ImageId FROM Image WHERE ProductId = ? LIMIT 1', [req.params.id]);
      if (imgCheck.length > 0) {
        await db.execute('UPDATE Image SET ImageUrl = ? WHERE ImageId = ?', [imageUrl, imgCheck[0].ImageId]);
      } else {
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [req.params.id, imageUrl]);
      }
    }

    return res.json({ message: 'Product updated successfully!' });
  } catch (err) {
    console.error('[PUT /products/:id]', err);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

// ─────────────────────────────────────────────
//  DELETE PRODUCT (Admin only)
// ─────────────────────────────────────────────
// DELETE /api/products/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [check] = await db.execute('SELECT ProductId FROM Product WHERE ProductId = ?', [req.params.id]);
    if (check.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Delete related data first (cascades not always set)
    await db.execute('DELETE FROM Image WHERE ProductId = ?', [req.params.id]);
    await db.execute('DELETE FROM ProductColor WHERE ProductId = ?', [req.params.id]);
    await db.execute('DELETE FROM Review WHERE ProductId = ?', [req.params.id]);
    await db.execute('DELETE FROM Product WHERE ProductId = ?', [req.params.id]);

    return res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /products/:id]', err);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
