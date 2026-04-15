const db = require('./server/db');
async function checkSchema() {
  try {
    const [colorInfo] = await db.execute("PRAGMA table_info(ProductColor);");
    console.log('ProductColor columns:', colorInfo.map(c => c.name));
    
    const [imageInfo] = await db.execute("PRAGMA table_info(Image);");
    console.log('Image columns:', imageInfo.map(c => c.name));
    
    const [products] = await db.execute("SELECT * FROM Product LIMIT 1;");
    console.log('Product sample:', products[0] ? 'Found' : 'NONE');
  } catch (err) {
    console.error('Schema check failed:', err.message);
  }
  process.exit();
}
checkSchema();
