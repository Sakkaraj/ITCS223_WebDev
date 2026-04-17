const db = require('./server/db');

async function check() {
  const names = ['Modern Armchair', 'Grey Comfort Sofa', 'Dining Table Set'];
  
  for (const name of names) {
    const [prod] = await db.execute('SELECT ProductId FROM Product WHERE ProductName = ?', [name]);
    if (prod.length === 0) continue;
    const id = prod[0].ProductId;
    
    console.log(`\n--- ${name} (ID: ${id}) ---`);
    
    const [images] = await db.execute('SELECT ImageUrl FROM Image WHERE ProductId = ?', [id]);
    console.log('Images:', images.map(i => i.ImageUrl));
    
    const [colors] = await db.execute(`
      SELECT c.ColorName FROM Color c
      JOIN ProductColor pc ON pc.ColorId = c.ColorId
      WHERE pc.ProductId = ?
    `, [id]);
    console.log('Colors:', colors.map(c => c.ColorName));
  }
  process.exit(0);
}

check();
