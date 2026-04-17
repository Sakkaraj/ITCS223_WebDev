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

console.log('\n🌱 Starting database seed...\n');

const SALT_ROUNDS = 10;

async function seed() {
  try {
    console.log('🏗️ Initializing SQLite Schema...');
    const fs = require('fs');
    const path = require('path');
    const { open } = require('sqlite');
    const sqlite3 = require('sqlite3');

    const dbPath = path.resolve(__dirname, './data/sec2_gr14_database.sqlite');
    
    // Delete existing database if it exists to ensure a clean start
    if (fs.existsSync(dbPath)) {
      console.log('🗑️  Removing existing database...');
      fs.unlinkSync(dbPath);
    }

    const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });
    
    // Read the consolidated SQL file (contains both Schema and Data)
    const combinedSql = fs.readFileSync(path.resolve(__dirname, '../sec2_gr14_database.sql'), 'utf-8');
    
    console.log('🏗️  Executing consolidated SQL (Schema + Data)...');
    await sqliteDb.exec(combinedSql);
    console.log('✅ Database initialized and populated successfully');

    console.log('\n✨ Reset complete!\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Admin Login Credentials (from SQL)         │');
    console.log('│  Email:    admin@boonsonclon.com            │');
    console.log('│  Password: Admin@1234                       │');
    console.log('└─────────────────────────────────────────────┘\n');

  } catch (err) {
    console.error('\n❌ Reset failed:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
