const db = require('./server/db');

async function debugPut() {
  const pid = 10; // The ID from the subagent's run
  try {
    const mockBody = {
      productName: "Bookshelf Cabinet Updated",
      categoryId: 1,
      price: 1500,
      colorIds: [{ id: 1, index: 1 }, { id: 2, index: 2 }],
      imageUrls: ["https://example.com/img.jpg"]
    };
    
    // Attempting exactly what products.js does
    console.log('Testing UPDATE Product...');
    await db.execute(
      `UPDATE Product SET
         CategoryId = COALESCE(?, CategoryId),
         ProductName = COALESCE(?, ProductName),
         Price = COALESCE(?, Price)
       WHERE ProductId = ?`,
      [mockBody.categoryId, mockBody.productName, mockBody.price, pid]
    );

    console.log('Testing DELETE colors...');
    await db.execute('DELETE FROM ProductColor WHERE ProductId = ?', [pid]);

    console.log('Testing INSERT colors...');
    for (const colorObj of mockBody.colorIds) {
      await db.execute(
        'INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (?, ?, ?)',
        [pid, colorObj.id, colorObj.index]
      );
    }
    
    console.log('DEBUG SUCCESS: All operations completed.');
  } catch (err) {
    console.error('DEBUG FAILED:', err.message);
    if (err.sql) console.log('SQL:', err.sql);
  }
  process.exit();
}
debugPut();
