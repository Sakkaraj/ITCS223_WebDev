/**
 * seed.js — Populates the BoonSunClon database with:
 *   - 1 Admin account
 *   - 6 Categories
 *   - 12 Products with images
 *
 * Run once after importing DataBase.sql:
 *   node server/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

const SALT_ROUNDS = 10;

async function seed() {
      // ── 3.1. Colors ──────────────────────────────────────
      console.log('\n🎨 Seeding colors...');
      const colorDefs = [
        { name: 'Blue', hex: '#3b82f6' },
        { name: 'Brown', hex: '#a6866a' },
        { name: 'Green', hex: '#4ade80' },
        { name: 'Grey', hex: '#6b7280' },
        { name: 'White', hex: '#f3f4f6' },
        { name: 'Black', hex: '#222' },
      ];
      const colorIds = {};
      for (const c of colorDefs) {
        const [existing] = await db.execute('SELECT ColorId FROM Color WHERE ColorName = ?', [c.name]);
        if (existing.length > 0) {
          colorIds[c.name] = existing[0].ColorId;
        } else {
          const [result] = await db.execute('INSERT INTO Color (ColorName, HexCode) VALUES (?, ?)', [c.name, c.hex]);
          colorIds[c.name] = result.insertId;
        }
      }

      // ── 3.2. Materials ──────────────────────────────────
      console.log('\n🪵 Seeding materials...');
      const materials = [
        { name: 'Solid Wood', type: 'Natural' },
        { name: 'Metal', type: 'Industrial' },
        { name: 'Fabric', type: 'Soft' },
        { name: 'Glass', type: 'Hard' },
        { name: 'MDF', type: 'Engineered' },
      ];
      const materialIds = {};
      for (const m of materials) {
        const [existing] = await db.execute('SELECT MaterialId FROM Material WHERE MaterialName = ?', [m.name]);
        if (existing.length > 0) {
          materialIds[m.name] = existing[0].MaterialId;
        } else {
          const [result] = await db.execute('INSERT INTO Material (MaterialName, MaterialType) VALUES (?, ?)', [m.name, m.type]);
          materialIds[m.name] = result.insertId;
        }
      }
  console.log('\n🌱 Starting database seed...\n');

  try {
    console.log('🏗️ Initializing SQLite Schema...');
    const fs = require('fs');
    const path = require('path');
    const { open } = require('sqlite');
    const sqlite3 = require('sqlite3');
    
    const dbPath = path.resolve(__dirname, '../database.sqlite');
    const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });
    const schemaSql = fs.readFileSync(path.resolve(__dirname, './schema.sqlite.sql'), 'utf-8');
    await sqliteDb.exec(schemaSql);
    console.log('✅ Schema initialized');

    // ── 1. Categories ──────────────────────────────────────
    console.log('📦 Seeding categories...');
    const categories = ['Chairs', 'Sofas', 'Tables', 'Beds', 'Cabinets', 'Decor'];
    const categoryIds = {};

    for (const cat of categories) {
      const [existing] = await db.execute('SELECT CategoryId FROM Category WHERE Category = ?', [cat]);
      if (existing.length > 0) {
        categoryIds[cat] = existing[0].CategoryId;
        console.log(`   ↳ Category "${cat}" already exists (id=${categoryIds[cat]})`);
      } else {
        const [result] = await db.execute('INSERT INTO Category (Category) VALUES (?)', [cat]);
        categoryIds[cat] = result.insertId;
        console.log(`   ✅ Created category "${cat}" (id=${categoryIds[cat]})`);
      }
    }

    // ── 2. Admin account ──────────────────────────────────
    console.log('\n👤 Seeding admin account...');
    const adminEmail = 'admin@boonsonclon.com';
    const adminPass  = 'Admin@1234';

    const [existingAdmin] = await db.execute('SELECT AdminId FROM AdminInformation WHERE Email = ?', [adminEmail]);
    if (existingAdmin.length > 0) {
      console.log(`   ↳ Admin already exists: ${adminEmail}`);
    } else {
      const hashedPass = await bcrypt.hash(adminPass, SALT_ROUNDS);

      const [adminInfo] = await db.execute(
        `INSERT INTO AdminInformation (FirstName, LastName, Address, Age, Email, TelephoneNumber)
         VALUES ('Admin', 'BoonSon', '999 Phutthamonthon 4 Road, Nakhon Pathom', 30, ?, '0696304272')`,
        [adminEmail]
      );
      const adminId = adminInfo.insertId;

      await db.execute(
        `INSERT INTO AdminLoginInformation (AdminId, AdminUserName, AdminPassword, Role)
         VALUES (?, 'admin', ?, 'admin')`,
        [adminId, hashedPass]
      );

      console.log(`   ✅ Admin created`);
      console.log(`      Email:    ${adminEmail}`);
      console.log(`      Password: ${adminPass}`);
    }

    // ── 3. Products ───────────────────────────────────────
    console.log('\n🛋️  Seeding products...');

    const products = [
      {
        name: 'Classic Oak Chair',
        categoryId: categoryIds['Chairs'],
        price: 119.00,
        qty: 20,
        desc: 'A beautiful handcrafted oak chair designed for maximum comfort.',
        detail: 'Made from solid oak wood with a smooth finish. Assembly required.',
        width: 55, height: 90, length: 55, weight: 8,
        featured: true,
        materialId: materialIds['Solid Wood'],
        image: 'assets/images/chair.avif',
      },
      {
        name: 'Modern Armchair',
        categoryId: categoryIds['Chairs'],
        price: 249.99,
        qty: 15,
        desc: 'Sleek modern armchair upholstered in premium fabric.',
        detail: 'Available in multiple colors. Solid wood legs. Easy assembly.',
        width: 80, height: 85, length: 82, weight: 14,
        featured: true,
        image: 'assets/images/chair1.avif',
      },
      {
        name: 'Grey Comfort Sofa',
        categoryId: categoryIds['Sofas'],
        price: 799.00,
        qty: 8,
        desc: 'A plush, deep-seated sofa perfect for modern interiors.',
        detail: 'High-density foam cushions. Removable covers. 3-seater.',
        width: 220, height: 85, length: 95, weight: 65,
        featured: true,
        image: 'assets/images/sofa.avif',
      },
      {
        name: 'L-Shape Corner Sofa',
        categoryId: categoryIds['Sofas'],
        price: 1299.00,
        qty: 5,
        desc: 'Spacious L-shaped corner sofa for the whole family.',
        detail: 'Premium microfibre. Chaise lounge section. 5-year frame warranty.',
        width: 280, height: 85, length: 200, weight: 90,
        featured: false,
        image: 'assets/images/sofa.avif',
      },
      {
        name: 'Coffee Table',
        categoryId: categoryIds['Tables'],
        price: 150.00,
        qty: 25,
        desc: 'Minimalist coffee table with tempered glass top.',
        detail: 'Tempered glass top, iron legs. Wipe clean. Flat-pack delivery.',
        width: 110, height: 45, length: 60, weight: 18,
        featured: false,
        image: 'assets/images/table.avif',
      },
      {
        name: 'Dining Table Set',
        categoryId: categoryIds['Tables'],
        price: 450.00,
        qty: 10,
        desc: '6-person dining table with matching chairs.',
        detail: 'Solid pine wood. Includes 6 chairs. Easy assembly.',
        width: 180, height: 75, length: 90, weight: 55,
        featured: true,
        image: 'assets/images/best-seller/img.avif',
      },
      {
        name: 'King Size Bed Frame',
        categoryId: categoryIds['Beds'],
        price: 599.00,
        qty: 12,
        desc: 'Sturdy king size bed frame with slatted base.',
        detail: 'Solid oak construction. Fits 180x200cm mattress. Assembly required.',
        width: 200, height: 100, length: 215, weight: 80,
        featured: false,
        image: 'assets/images/best-seller/img1.avif',
      },
      {
        name: 'Storage Bed with Drawers',
        categoryId: categoryIds['Beds'],
        price: 849.00,
        qty: 6,
        desc: 'Double bed with 4 integrated storage drawers.',
        detail: 'Upholstered headboard. Hydraulic lift storage. Fits 160x200cm mattress.',
        width: 185, height: 120, length: 215, weight: 95,
        featured: true,
        image: 'assets/images/best-seller/img3.avif',
      },
      {
        name: 'Wardrobe Cabinet',
        categoryId: categoryIds['Cabinets'],
        price: 399.00,
        qty: 9,
        desc: '3-door wardrobe with hanging rail and shelves.',
        detail: 'MDF construction with oak veneer. Mirror door option available.',
        width: 150, height: 200, length: 58, weight: 70,
        featured: false,
        image: 'assets/images/best-seller/img4.avif',
      },
      {
        name: 'Bookshelf Cabinet',
        categoryId: categoryIds['Cabinets'],
        price: 199.00,
        qty: 18,
        desc: '5-Tier open bookshelf for your study or office.',
        detail: 'Engineered wood. Adjustable shelves. Easy self-assembly.',
        width: 80, height: 180, length: 30, weight: 25,
        featured: false,
        image: 'assets/images/best-seller/img5.avif',
      },
      {
        name: 'Table Lamp',
        categoryId: categoryIds['Decor'],
        price: 49.99,
        qty: 50,
        desc: 'Elegant ceramic table lamp with linen shade.',
        detail: 'E27 bulb (not included). 1.5m fabric cord. Height: 45cm.',
        width: 20, height: 45, length: 20, weight: 1.5,
        featured: false,
        image: 'assets/images/best-seller/img6.avif',
      },
      {
        name: 'Decorative Vase Set',
        categoryId: categoryIds['Decor'],
        price: 35.00,
        qty: 35,
        desc: 'Set of 3 ceramic vases in complementary sizes.',
        detail: 'Handcrafted ceramic. Waterproof interior. Sizes: Small, Medium, Large.',
        width: 15, height: 30, length: 15, weight: 0.8,
        featured: false,
        image: 'assets/images/best-seller/img7.avif',
      },
    ];

    for (const p of products) {
      const [existing] = await db.execute('SELECT ProductId FROM Product WHERE ProductName = ?', [p.name]);
      if (existing.length > 0) {
        console.log(`   ↳ Product "${p.name}" already exists — skipping`);
        continue;
      }

      const [result] = await db.execute(
        `INSERT INTO Product
           (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail,
            WidthDimension, HeightDimension, LengthDimension, Weight, Featured, MaterialId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.categoryId, p.name, p.price, p.qty, p.desc, p.detail,
         p.width, p.height, p.length, p.weight, p.featured ? 1 : 0, p.materialId || null]
      );

      await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, p.image]);
      // ── Add new-product images and color links for 3 main products ──
      if (p.name === 'Modern Armchair') {
        // Images for Modern Armchair
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/chair1.avif']);
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/chair-blue.jpeg']);
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/chair-brown.jpeg']);
        // Color links
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Blue']]);
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Brown']]);
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Grey']]);
      }
      if (p.name === 'Grey Comfort Sofa') {
        // Images for Grey Comfort Sofa
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/sofa-grey.jpeg']);
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/sofa-green.jpg']);
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/sofa-brown.png']);
        // Color links
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Grey']]);
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Green']]);
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Brown']]);
      }
      if (p.name === 'Dining Table Set') {
        // Images for Dining Table Set
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/table.jpg']);
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/table1.jpeg']);
        await db.execute('INSERT INTO Image (ProductId, ImageUrl) VALUES (?, ?)', [result.insertId, 'assets/images/new-product/table2.jpeg']);
        // Color links
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Brown']]);
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['White']]);
        await db.execute('INSERT OR IGNORE INTO ProductColor (ProductId, ColorId) VALUES (?, ?)', [result.insertId, colorIds['Black']]);
      }
      console.log(`   ✅ Created: ${p.name} @ $${p.price}`);
    }

    console.log('\n✨ Seed complete!\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Admin Login Credentials                    │');
    console.log('│  Email:    admin@boonsonclon.com            │');
    console.log('│  Password: Admin@1234                       │');
    console.log('└─────────────────────────────────────────────┘\n');

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.message.includes('Access denied')) {
      console.error('   → Check your .env file: DB_PASSWORD is incorrect.');
    } else if (err.message.includes('Unknown database')) {
      console.error('   → Database not found. Run: mysql -u root -p < DataBase.sql');
    }
  } finally {
    process.exit(0);
  }
}

seed();
