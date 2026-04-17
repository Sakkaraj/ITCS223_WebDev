/**
 * seed.js — Populates the BoonSonClon database.
 * Supports both SQLite (local) and PostgreSQL (Production).
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const isPostgres = !!process.env.DATABASE_URL;

async function seed() {
  console.log(`\n🌱 Starting database seed (${isPostgres ? 'PostgreSQL' : 'SQLite'})...\n`);

  try {
    if (isPostgres) {
      /**
       * PostgreSQL Seeding
       */
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
      });

      console.log('🏗️  Reading PostgreSQL schema...');
      const sqlPath = path.resolve(__dirname, '../sec2_gr14_database_pg.sql');
      const pgSql = fs.readFileSync(sqlPath, 'utf8');

      console.log('🏗️  Executing PostgreSQL SQL (Schema + Data)...');
      await pool.query(pgSql);
      console.log('✅ PostgreSQL database initialized and populated successfully');
      
      await pool.end();

    } else {
      /**
       * SQLite Seeding
       */
      const dbPath = path.resolve(__dirname, './data/sec2_gr14_database.sqlite');
      
      // Ensure directory exists
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // Delete existing database for a clean start
      if (fs.existsSync(dbPath)) {
        console.log('🗑️  Removing existing SQLite database...');
        fs.unlinkSync(dbPath);
      }

      const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });
      
      console.log('🏗️  Reading SQLite schema...');
      const sqlPath = path.resolve(__dirname, '../sec2_gr14_database.sql');
      const sqliteSql = fs.readFileSync(sqlPath, 'utf-8');
      
      console.log('🏗️  Executing SQLite SQL (Schema + Data)...');
      await sqliteDb.exec(sqliteSql);
      console.log('✅ SQLite database initialized and populated successfully');
      
      await sqliteDb.close();
    }

    console.log('\n✨ Seed complete!\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Admin Login Credentials                    │');
    console.log('│  Email:    admin@boonsonclon.com            │');
    console.log('│  Password: Admin@1234                       │');
    console.log('└─────────────────────────────────────────────┘\n');

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
