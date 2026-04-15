/**
 * db-verify.js - Verify that the database is properly set up
 * with correct tables, relationships, and test data.
 * 
 * Run: node server/db-verify.js
 */

const db = require('./db');

async function verify() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║    DATABASE VERIFICATION - Admin & Members    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // ─── 1. Check Admin Structure ────────────────────
    console.log('📋 Checking Admin Tables Structure...\n');
    
    const adminInfoCheck = await db.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='AdminInformation'"
    );
    if (adminInfoCheck[0].length > 0) {
      console.log('✅ AdminInformation table exists');
    }

    const adminLoginCheck = await db.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='AdminLoginInformation'"
    );
    if (adminLoginCheck[0].length > 0) {
      console.log('✅ AdminLoginInformation table exists');
    }

    // ─── 2. Check Member Structure ────────────────────
    console.log('\n📋 Checking Member Tables Structure...\n');
    
    const memberCheck = await db.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='Member'"
    );
    if (memberCheck[0].length > 0) {
      console.log('✅ Member table exists');
    }

    const memberLoginCheck = await db.execute(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='MemberLoginInformation'"
    );
    if (memberLoginCheck[0].length > 0) {
      console.log('✅ MemberLoginInformation table exists');
    }

    // ─── 3. Check Admin Data ────────────────────────
    console.log('\n👤 Checking Admin Data...\n');
    
    const [admins] = await db.execute(
      `SELECT ai.AdminId, ai.FirstName, ai.LastName, ai.Email, ali.Role
       FROM AdminInformation ai
       LEFT JOIN AdminLoginInformation ali ON ai.AdminId = ali.AdminId`
    );

    if (admins.length === 0) {
      console.log('⚠️  No admin accounts found!');
      console.log('   Run: npm run seed');
    } else {
      console.log(`✅ Found ${admins.length} admin account(s):\n`);
      admins.forEach((admin, idx) => {
        console.log(`   [${idx + 1}] Admin ${admin.AdminId}`);
        console.log(`       Name: ${admin.FirstName} ${admin.LastName}`);
        console.log(`       Email: ${admin.Email}`);
        console.log(`       Role: ${admin.Role}`);
      });
    }

    // ─── 4. Check Member Data ────────────────────────
    console.log('\n👥 Checking Member Data...\n');
    
    const [members] = await db.execute(
      `SELECT m.MemberId, m.FirstName, m.LastName, m.MemberEmail, 
              COUNT(mli.MemberId) as hasPassword
       FROM Member m
       LEFT JOIN MemberLoginInformation mli ON m.MemberId = mli.MemberId
       GROUP BY m.MemberId`
    );

    if (members.length === 0) {
      console.log('ℹ️  No member accounts yet (normal for new database)');
    } else {
      console.log(`✅ Found ${members.length} member account(s):\n`);
      members.forEach((member, idx) => {
        console.log(`   [${idx + 1}] Member ${member.MemberId}`);
        console.log(`       Name: ${member.FirstName} ${member.LastName}`);
        console.log(`       Email: ${member.MemberEmail}`);
        console.log(`       Password: ${member.hasPassword > 0 ? '✓ Set' : '✗ Not set'}`);
      });
    }

    // ─── 5. Check Product Data ──────────────────────
    console.log('\n🛋️  Checking Product Data...\n');
    
    const [products] = await db.execute(
      'SELECT COUNT(*) as total FROM Product'
    );
    const productCount = products[0].total;

    if (productCount === 0) {
      console.log('⚠️  No products found!');
      console.log('   Run: npm run seed');
    } else {
      console.log(`✅ Found ${productCount} products in database`);
    }

    // ─── 6. Check Category Data ─────────────────────
    console.log('\n📦 Checking Category Data...\n');
    
    const [categories] = await db.execute(
      'SELECT COUNT(*) as total FROM Category'
    );
    const categoryCount = categories[0].total;

    if (categoryCount === 0) {
      console.log('⚠️  No categories found!');
      console.log('   Run: npm run seed');
    } else {
      console.log(`✅ Found ${categoryCount} categories`);
    }

    // ─── 7. Environmental Check ──────────────────────
    console.log('\n🔐 Checking Environment Variables...\n');
    
    if (process.env.JWT_SECRET) {
      console.log(`✅ JWT_SECRET is set: ${process.env.JWT_SECRET.substring(0, 10)}...`);
    } else {
      console.log('⚠️  JWT_SECRET is not set!');
    }

    if (process.env.SESSION_SECRET) {
      console.log(`✅ SESSION_SECRET is set: ${process.env.SESSION_SECRET.substring(0, 10)}...`);
    } else {
      console.log('⚠️  SESSION_SECRET is not set!');
    }

    // ─── 8. Summary ─────────────────────────────────
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              VERIFICATION SUMMARY              ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📊 Database Status:');
    console.log(`   Admins (required):   ${admins.length > 0 ? '✅' : '❌'}`);
    console.log(`   Members:              ${members.length > 0 ? '✅' : 'ℹ️ (Optional)'}`);
    console.log(`   Products:             ${productCount > 0 ? '✅' : '⚠️ (Recommended to seed)'}`);
    console.log(`   Categories:           ${categoryCount > 0 ? '✅' : '⚠️ (Recommended to seed)'}`);

    console.log('\n✨ Database verification complete!\n');

  } catch (err) {
    console.error('\n❌ Database verification failed:');
    console.error(err.message);
  }

  process.exit(0);
}

verify();
