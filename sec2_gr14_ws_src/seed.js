/**
 * seed.js — Populates the BoonSonClon database.
 * Supports both SQLite (local) and PostgreSQL (Production).
 * 
 * DESIGN: We use a SINGLE sec2_gr14_database.sql (Postgres format) 
 * and translate it for SQLite on-the-fly if needed.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const databaseUrl = process.env.DATABASE_URL || 
                    process.env.INTERNAL_DATABASE_URL || 
                    process.env.DATABASE_PATH;
const isPostgres = !!databaseUrl && databaseUrl.startsWith('postgres');

/**
 * Translates PostgreSQL specific syntax to SQLite syntax
 * So we only need ONE master SQL file.
 */
function translatePostgresToSqlite(sql) {
  return sql
    .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    .replace(/TIMESTAMP/gi, 'DATETIME')
    .replace(/SMALLINT/gi, 'TINYINT')
    .replace(/BOOLEAN DEFAULT TRUE/gi, 'BOOLEAN DEFAULT 1')
    .replace(/BOOLEAN DEFAULT FALSE/gi, 'BOOLEAN DEFAULT 0')
    .replace(/TRUE/g, '1')
    .replace(/FALSE/g, '0')
    .replace(/COLLATE "default"/gi, '')
    .replace(/json/gi, 'TEXT')
    .replace(/TIMESTAMP\(\d+\)/gi, 'DATETIME')
    .replace(/DROP TABLE IF EXISTS ([a-z0-9_]+) CASCADE/gi, 'DROP TABLE IF EXISTS $1')
    .replace(/DROP TABLE IF EXISTS "([a-z0-9_]+)"/gi, 'DROP TABLE IF EXISTS $1')
    .replace(/CREATE TABLE "([a-z0-9_]+)"/gi, 'CREATE TABLE $1');
}

async function seed() {
  console.log(`\n🌱 Starting unified database seed (${isPostgres ? 'PostgreSQL' : 'SQLite'})...\n`);

  try {
    const sqlPath = path.resolve(__dirname, '../sec2_gr14_database.sql');
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`Master SQL file not found at ${sqlPath}`);
    }
    const masterSql = fs.readFileSync(sqlPath, 'utf8');

    if (isPostgres) {
      /**
       * PostgreSQL Seeding
       */
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('render.com') ? { rejectUnauthorized: false } : false
      });

      console.log('🏗️  Executing Master SQL on PostgreSQL...');
      await pool.query(masterSql);
      console.log('✅ PostgreSQL database initialized successfully');
      await pool.end();

    } else {
      /**
       * SQLite Seeding (with Translation)
       */
      const dbPath = path.resolve(__dirname, './data/sec2_gr14_database.sqlite');
      
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (fs.existsSync(dbPath)) {
        console.log('🗑️  Removing existing SQLite database...');
        fs.unlinkSync(dbPath);
      }

      const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });
      
      console.log('🏗️  Translating Master SQL for SQLite...');
      const localSql = translatePostgresToSqlite(masterSql);
      
      // DEBUG: console.log(localSql);
      
      console.log('🏗️  Executing Translated SQL on SQLite...');
      await sqliteDb.exec(localSql);
      console.log('✅ SQLite database initialized successfully');
      
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
