const db = require('./server/db');
async function test() {
  try {
    const limit = 50;
    const offset = 0;
    const [products] = await db.execute(
      `SELECT p.ProductId, p.ProductName, p.Price, p.QuantityLeft,
              p.ProductDescription, p.Featured, c.Category, m.MaterialName,
              p.WidthDimension, p.HeightDimension, p.LengthDimension, p.Weight,
              (SELECT ImageUrl FROM Image WHERE ProductId = p.ProductId ORDER BY SortOrder ASC LIMIT 1) AS ImageUrl,
              (SELECT COUNT(*) FROM Image WHERE ProductId = p.ProductId) AS ImageCount
       FROM Product p
       JOIN Category c ON p.CategoryId = c.CategoryId
       LEFT JOIN Material m ON p.MaterialId = m.MaterialId
       ORDER BY p.ProductId DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    console.log('Products found:', products.length);
    if (products.length > 0) console.log('First product:', products[0]);
  } catch (err) {
    console.error('Query Failed:', err.message);
  }
  process.exit();
}
test();
