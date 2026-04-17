const db = require('./db');
async function check() {
  const [products] = await db.execute('SELECT ProductId, ProductName FROM Product WHERE ProductName LIKE "%Armchair%"');
  for (const p of products) {
    const [images] = await db.execute('SELECT * FROM Image WHERE ProductId = ?', [p.ProductId]);
    const [colors] = await db.execute('SELECT col.ColorName FROM Color col JOIN ProductColor pc ON col.ColorId = pc.ColorId WHERE pc.ProductId = ?', [p.ProductId]);
    console.log(`Product: ${p.ProductName} (ID: ${p.ProductId})`);
    console.log(`- Images (${images.length}):`, images.map(i => i.ImageUrl));
    console.log(`- Colors (${colors.length}):`, colors.map(c => c.ColorName));
    console.log('---');
  }
  process.exit();
}
check();
