const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

function formatImageUrl(url) {
  if (!url) return '/assets/images/placeholder.avif';
  if (url.startsWith('http') || url.startsWith('/')) return url;
  if (url.startsWith('../')) return url.substring(2);
  return '/' + url;
}

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
      const categoryList = Array.isArray(category) ? category : category.split(',').filter(Boolean);
      if (categoryList.length > 0) {
        const placeholders = categoryList.map(() => '?').join(',');
        whereClauses.push(`c.Category IN (${placeholders})`);
        params.push(...categoryList);
      }
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
      whereClauses.push('p.Featured = true');
    }
    if (req.query.colors || req.query.colorId) {
      const colorVal = req.query.colors || req.query.colorId;
      const colorList = Array.isArray(colorVal) ? colorVal : colorVal.toString().split(',').filter(Boolean);
      if (colorList.length > 0) {
        const placeholders = colorList.map(() => '?').join(',');
        whereClauses.push(`EXISTS (SELECT 1 FROM ProductColor pc WHERE pc.ProductId = p.ProductId AND pc.ColorId IN (${placeholders}))`);
        params.push(...colorList.map(id => parseInt(id)));
      }
    }
    if (req.query.materialId) {
      whereClauses.push('p.MaterialId = ?');
      params.push(parseInt(req.query.materialId));
    }
    if (req.query.maxWidth) {
      whereClauses.push('p.WidthDimension <= ?');
      params.push(parseFloat(req.query.maxWidth));
    }
    if (req.query.maxHeight) {
      whereClauses.push('p.HeightDimension <= ?');
      params.push(parseFloat(req.query.maxHeight));
    }
    if (req.query.maxLength) {
      whereClauses.push('p.LengthDimension <= ?');
      params.push(parseFloat(req.query.maxLength));
    }
    if (req.query.maxWeight) {
      whereClauses.push('p.Weight <= ?');
      params.push(parseFloat(req.query.maxWeight));
    }
    if (req.query.search) {
      const searchTerm = `%${req.query.search}%`;
      whereClauses.push('(p.ProductName LIKE ? OR p.ProductDescription LIKE ?)');
      params.push(searchTerm, searchTerm);
    }

    // Filter Out-of-Stock by default (unless showAll=true for admin)
    if (req.query.showAll !== 'true') {
      whereClauses.push('p.QuantityLeft > 0');
    }

    const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    let orderSQL = 'ORDER BY p.CreatedAt DESC, p.ProductId DESC';
    let additionalSelect = '';

    if (sort === 'price_asc') orderSQL = 'ORDER BY p.Price ASC';
    else if (sort === 'price_desc') orderSQL = 'ORDER BY p.Price DESC';
    else if (sort === 'bestsellers') {
      additionalSelect = ', COALESCE((SELECT SUM(ItemQuantity) FROM OrderItem WHERE ProductId = p.ProductId), 0) AS TotalSold';
      orderSQL = 'ORDER BY TotalSold DESC, p.ProductId DESC';
    }

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

    // Fetch paginated products with first image and material
    const [products] = await db.execute(
      `SELECT p.ProductId, p.ProductName, p.Price, p.QuantityLeft,
              p.ProductDescription, p.Featured, p.Status, c.Category, m.MaterialName,
              p.WidthDimension, p.HeightDimension, p.LengthDimension, p.Weight,
              (SELECT ImageUrl FROM Image WHERE ProductId = p.ProductId ORDER BY SortOrder ASC LIMIT 1) AS ImageUrl,
              (SELECT COUNT(*) FROM Image WHERE ProductId = p.ProductId) AS ImageCount
              ${additionalSelect}
       FROM Product p
       JOIN Category c ON p.CategoryId = c.CategoryId
       LEFT JOIN Material m ON p.MaterialId = m.MaterialId
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // For each product, fetch its colors and images
    for (const product of products) {
      if (product.ImageUrl) {
        product.ImageUrl = formatImageUrl(product.ImageUrl);
      }

      // Colors
      const [colors] = await db.execute(
        `SELECT col.ColorId, col.ColorName, col.HexCode, pc.SortOrder
         FROM Color col
         JOIN ProductColor pc ON col.ColorId = pc.ColorId
         WHERE pc.ProductId = ?
         ORDER BY pc.SortOrder ASC`,
        [product.ProductId]
      );
      product.colors = colors;

      // Images
      const [images] = await db.execute(
        'SELECT ImageUrl, SortOrder FROM Image WHERE ProductId = ? ORDER BY SortOrder ASC',
        [product.ProductId]
      );
      product.images = images.map(img => ({
        ...img,
        ImageUrl: formatImageUrl(img.ImageUrl)
      }));
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
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products', message: err.message });
  }
});

// ─────────────────────────────────────────────
//  GET FILTER METADATA (Categories, Colors, Price Range)
// ─────────────────────────────────────────────
router.get('/filter-meta', async (req, res) => {
  try {
    // Categories with counts
    const [categories] = await db.execute(`
      SELECT c.CategoryId, c.Category, COUNT(p.ProductId) as ProductCount
      FROM Category c
      LEFT JOIN Product p ON c.CategoryId = p.CategoryId
      GROUP BY c.CategoryId
    `);

    // Colors with counts
    const [colors] = await db.execute(`
      SELECT col.ColorId, col.ColorName, col.HexCode, COUNT(pc.ProductId) as ProductCount
      FROM Color col
      LEFT JOIN ProductColor pc ON col.ColorId = pc.ColorId
      GROUP BY col.ColorId
    `);

    // Price Range
    const [priceRange] = await db.execute(`
      SELECT MIN(Price) as MinPrice, MAX(Price) as MaxPrice FROM Product
    `);

    res.json({
      categories,
      colors,
      priceRange: priceRange[0] || { MinPrice: 0, MaxPrice: 1000 }
    });
  } catch (err) {
    console.error('Error fetching filter meta:', err);
    res.status(500).json({ error: 'Failed to fetch filter metadata' });
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
//  GET ALL COLORS
// ─────────────────────────────────────────────
// GET /api/products/meta/colors

router.get('/meta/colors', async (req, res) => {
  try {
    const [colors] = await db.execute('SELECT ColorId, ColorName, HexCode FROM Color ORDER BY ColorName');
    return res.json(colors);
  } catch (err) {
    console.error('[GET /colors]', err);
    return res.status(500).json({ error: 'Failed to fetch colors.' });
  }
});

// ─────────────────────────────────────────────
//  GET ALL MATERIALS
// ─────────────────────────────────────────────
// GET /api/products/meta/materials

router.get('/meta/materials', async (req, res) => {
  try {
    const [materials] = await db.execute('SELECT MaterialId, MaterialName, MaterialType FROM Material ORDER BY MaterialName');
    return res.json(materials);
  } catch (err) {
    console.error('[GET /meta/materials]', err);
    return res.status(500).json({ error: 'Failed to fetch materials.' });
  }
});

// POST /api/products/meta/categories
router.post('/meta/categories', requireAuth, requireAdmin, async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'Category name is required.' });
  try {
    const [existing] = await db.execute('SELECT CategoryId FROM Category WHERE Category = ?', [category]);
    if (existing.length > 0) return res.status(400).json({ error: 'Category already exists.' });
    const [result] = await db.execute('INSERT INTO Category (Category) VALUES (?)', [category]);
    return res.status(201).json({ CategoryId: result.insertId, Category: category });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/products/meta/colors
router.post('/meta/colors', requireAuth, requireAdmin, async (req, res) => {
  const { colorName, hexCode } = req.body;
  if (!colorName || !hexCode) return res.status(400).json({ error: 'Color name and hex code are required.' });
  try {
    const [existing] = await db.execute('SELECT ColorId FROM Color WHERE ColorName = ?', [colorName]);
    if (existing.length > 0) return res.status(400).json({ error: 'Color already exists.' });
    const [result] = await db.execute('INSERT INTO Color (ColorName, HexCode) VALUES (?, ?)', [colorName, hexCode]);
    return res.status(201).json({ ColorId: result.insertId, ColorName: colorName, HexCode: hexCode });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/products/meta/materials
router.post('/meta/materials', requireAuth, requireAdmin, async (req, res) => {
  const { materialName, materialType } = req.body;
  if (!materialName || !materialType) return res.status(400).json({ error: 'Material name and type are required.' });
  try {
    const [existing] = await db.execute('SELECT MaterialId FROM Material WHERE MaterialName = ?', [materialName]);
    if (existing.length > 0) return res.status(400).json({ error: 'Material already exists.' });
    const [result] = await db.execute('INSERT INTO Material (MaterialName, MaterialType) VALUES (?, ?)', [materialName, materialType]);
    return res.status(201).json({ MaterialId: result.insertId, MaterialName: materialName, MaterialType: materialType });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  GET SINGLE PRODUCT
// ─────────────────────────────────────────────
// GET /api/products/:id

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, c.Category, m.MaterialName,
              p.WidthDimension, p.HeightDimension, p.LengthDimension, p.Weight, p.Status
       FROM Product p
       JOIN Category c ON p.CategoryId = c.CategoryId
       LEFT JOIN Material m ON p.MaterialId = m.MaterialId
       WHERE p.ProductId = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = rows[0];

    // Get all images
    const [images] = await db.execute(
      'SELECT ImageUrl, SortOrder FROM Image WHERE ProductId = ? ORDER BY SortOrder ASC',
      [req.params.id]
    );
    const formattedImages = images.map(img => ({
      ...img,
      ImageUrl: formatImageUrl(img.ImageUrl)
    }));

    // Get colors
    const [colors] = await db.execute(
      `SELECT col.ColorId, col.ColorName, col.HexCode, pc.SortOrder
       FROM Color col
       JOIN ProductColor pc ON col.ColorId = pc.ColorId
       WHERE pc.ProductId = ?
       ORDER BY pc.SortOrder ASC`,
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

    return res.json({ ...product, images: formattedImages, colors, reviews });
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
    productName, categoryId, materialId, price, quantityLeft = 0,
    productDescription, productDetail,
    widthDimension = 0, heightDimension = 0, lengthDimension = 0, weight = 0,
    featured = false, status = 'Active', imageUrls = [], colorIds = [],
  } = req.body;

  if (!productName || !categoryId || !price || !productDescription || !productDetail) {
    return res.status(400).json({ error: 'Name, category, price, detail, and description are required.' });
  }

  try {
    const catId = categoryId ? parseInt(categoryId) : null;
    const matId = materialId ? parseInt(materialId) : null;
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : price;
    const numQuantity = parseInt(quantityLeft) || 0;

    const [result] = await db.execute(
      `INSERT INTO Product
         (CategoryId, MaterialId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail,
          WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        catId,
        matId,
        productName,
        !isNaN(numPrice) ? numPrice : 0,
        numQuantity,
        productDescription,
        productDetail,
        parseFloat(widthDimension) || 0,
        parseFloat(heightDimension) || 0,
        parseFloat(lengthDimension) || 0,
        parseFloat(weight) || 0,
        featured ? true : false,
        status || 'Active'
      ]
    );

    const productId = result.insertId;

    // Insert images
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        if (imageUrl && imageUrl.trim()) {
          await db.execute('INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (?, ?, ?)', [productId, imageUrl.trim(), i]);
        }
      }
    }

    // Link colors
    if (Array.isArray(colorIds) && colorIds.length > 0) {
      for (const colorObj of colorIds) {
        const cId = typeof colorObj === 'object' ? colorObj.id : colorObj;
        const cIdx = typeof colorObj === 'object' ? colorObj.index : 0;
        if (cId) {
          await db.execute('INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (?, ?, ?)', [productId, cId, cIdx]);
        }
      }
    }

    return res.status(201).json({ message: 'Product added successfully!', productId });
  } catch (err) {
    console.error('[POST /api/products] Error:', err);
    return res.status(500).json({ 
      error: `Failed to add product: ${err.message}`,
      details: err.stack
    });
  }
});

// ─────────────────────────────────────────────
//  UPDATE PRODUCT (Admin only)
// ─────────────────────────────────────────────
// PUT /api/products/:id

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    const {
      productName, categoryId, materialId, price, quantityLeft,
      productDescription, productDetail,
      widthDimension, heightDimension, lengthDimension, weight,
      featured, status, imageUrls = [], colorIds = [],
    } = req.body;

    const pid = parseInt(req.params.id);
    const catId = categoryId ? parseInt(categoryId) : null;
    const matId = materialId ? parseInt(materialId) : null;
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;

    console.log('[PUT /api/products/:id] Incoming Body:', JSON.stringify(req.body, null, 2));

    try {
      const pid = parseInt(req.params.id);
      if (isNaN(pid)) return res.status(400).json({ error: 'Invalid product ID' });

      // Robust parsing for numbers
      const catId = categoryId ? parseInt(categoryId) : null;
      const matId = materialId ? parseInt(materialId) : null;
      
      // Handle price specifically (strip commas if string, ensure number)
      let numPrice = price;
      if (typeof price === 'string') {
        numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      }
      
      const numQuantity = parseInt(quantityLeft);
      const numWidth = parseFloat(widthDimension);
      const numHeight = parseFloat(heightDimension);
      const numLength = parseFloat(lengthDimension);
      const numWeight = parseFloat(weight);

      const [check] = await db.execute('SELECT ProductId FROM Product WHERE ProductId = ?', [pid]);
      if (check.length === 0) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      await db.execute(
        `UPDATE Product SET
           CategoryId = COALESCE(?, CategoryId),
           MaterialId = ?,
           ProductName = COALESCE(?, ProductName),
           Price = COALESCE(?, Price),
           QuantityLeft = COALESCE(?, QuantityLeft),
           ProductDescription = COALESCE(?, ProductDescription),
           ProductDetail = COALESCE(?, ProductDetail),
           WidthDimension = ?,
           HeightDimension = ?,
           LengthDimension = ?,
           Weight = ?,
           Featured = ?,
           Status = COALESCE(?, Status)
         WHERE ProductId = ?`,
        [
          catId || null,
          matId || null,
          productName || null,
          !isNaN(numPrice) ? numPrice : null,
          !isNaN(numQuantity) ? numQuantity : 0,
          productDescription || null,
          productDetail || null,
          !isNaN(numWidth) ? numWidth : 0,
          !isNaN(numHeight) ? numHeight : 0,
          !isNaN(numLength) ? numLength : 0,
          !isNaN(numWeight) ? numWeight : 0,
          featured ? true : false,
          status || null,
          pid
        ]
      );

      // Update images
      if (req.body.imageUrls && Array.isArray(imageUrls)) {
        await db.execute('DELETE FROM Image WHERE ProductId = ?', [pid]);
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          if (imageUrl && imageUrl.trim()) {
            await db.execute('INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (?, ?, ?)', [pid, imageUrl.trim(), i]);
          }
        }
      }

      // Replace colors
      if (req.body.colorIds && Array.isArray(colorIds)) {
        await db.execute('DELETE FROM ProductColor WHERE ProductId = ?', [pid]);
        for (const colorObj of colorIds) {
          const cId = typeof colorObj === 'object' ? colorObj.id : colorObj;
          const cIdx = typeof colorObj === 'object' ? colorObj.index : 0;
          if (cId) {
            await db.execute('INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (?, ?, ?)', [pid, cId, cIdx]);
          }
        }
      }

      return res.json({ message: 'Product updated successfully!' });
    } catch (err) {
      console.error('[PUT /api/products/:id] Fatal Error:', err);
      // Return the REAL error message so the user can see it on the screen
      return res.status(500).json({ 
        error: `Database Error: ${err.message}`,
        details: err.stack 
      });
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
