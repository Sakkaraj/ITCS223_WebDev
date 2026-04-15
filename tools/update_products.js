const db = require('./server/db');

async function updateProducts() {
  console.log('Fetching color IDs...');
  const [colors] = await db.execute('SELECT ColorId, ColorName FROM Color');
  const colorIds = {};
  for (const c of colors) {
    colorIds[c.ColorName] = c.ColorId;
  }

  const updates = [
    {
      name: 'Modern Armchair',
      images: [
        'assets/images/new-product/chair1.avif',
        'assets/images/new-product/chair-blue.jpeg',
        'assets/images/new-product/chair-brown.jpeg'
      ],
      colors: ['Grey', 'Blue', 'Brown']
    },
    {
      name: 'Grey Comfort Sofa',
      images: [
        'assets/images/new-product/sofa-grey.jpeg',
        'assets/images/new-product/sofa-green.jpg',
        'assets/images/new-product/sofa-brown.png'
      ],
      colors: ['Grey', 'Green', 'Brown']
    },
    {
      name: 'Dining Table Set',
      images: [
        'assets/images/new-product/table.jpg',
        'assets/images/new-product/table1.jpeg',
        'assets/images/new-product/table2.jpeg'
      ],
      colors: ['Brown', 'White', 'Black'] // We'll treat materials as colors here
    }
  ];

  for (const u of updates) {
    const [prod] = await db.execute('SELECT ProductId FROM Product WHERE ProductName = ?', [u.name]);
    if (prod.length === 0) {
       console.log(`Product "${u.name}" not found! Skipping.`);
       continue;
    }
    const id = prod[0].ProductId;
    
    console.log(`\nUpdating ${u.name} (ID: ${id})...`);
    
    // Clear old images and colors
    await db.execute('DELETE FROM Image WHERE ProductId = ?', [id]);
    await db.execute('DELETE FROM ProductColor WHERE ProductId = ?', [id]);
    
    // Insert new images
    for (const imgUrl of u.images) {
      await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [id, imgUrl]);
    }
    
    // Insert new colors
    for (const colorName of u.colors) {
      const cId = colorIds[colorName];
      if (cId) {
        await db.execute('INSERT INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [id, cId]);
      } else {
        console.log(`Color ${colorName} not found in DB!`);
      }
    }
    
    console.log(`Successfully updated ${u.name}`);
  }
  process.exit(0);
}

updateProducts();
