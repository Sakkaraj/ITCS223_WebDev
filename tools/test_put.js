const db = require('./server/db');

async function testUpdate() {
  try {
    const productId = 1; // Assuming product 1 exists
    const mockBody = {
      productName: "Updated Name",
      price: 100,
      colorIds: [
        { id: 1, index: 10 },
        { id: 2, index: 20 }
      ],
      imageUrls: [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg"
      ]
    };

    console.log('Testing DELETE then INSERT pattern...');
    
    // Simulating the PUT logic
    await db.execute('DELETE FROM ProductColor WHERE ProductId = ?', [productId]);
    for (const colorObj of mockBody.colorIds) {
      console.log('Inserting color:', colorObj);
      await db.execute(
        'INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (?, ?, ?)',
        [productId, colorObj.id, colorObj.index]
      );
    }
    
    console.log('Test successful!');
  } catch (err) {
    console.error('Test failed:', err.message);
    if (err.sql) console.log('SQL:', err.sql);
  }
  process.exit();
}
testUpdate();
