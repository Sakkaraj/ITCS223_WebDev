const db = require('./server/db');
async function test() {
  const productId = 2; // Modern Armchair
  const colorIds = [3, 2]; // White (3), Black (2) in specific order
  
  console.log('Testing update for product 2...');
  
  // Replace colors with sort order
  await db.execute('DELETE FROM ProductColor WHERE ProductId = ?', [productId]);
  for (let i = 0; i < colorIds.length; i++) {
    await db.execute('INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (?, ?, ?)', [productId, colorIds[i], i]);
  }
  
  // Verify
  const [rows] = await db.execute('SELECT ColorId FROM ProductColor WHERE ProductId = ? ORDER BY SortOrder ASC', [productId]);
  console.log('Resulting Order:', rows);
  
  process.exit();
}
test();
