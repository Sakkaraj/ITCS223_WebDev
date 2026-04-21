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
 * translatePostgresToSqlite — Syntax Translation Layer
 * Translates PostgreSQL-specific syntax to SQLite-compatible syntax on-the-fly,
 * allowing the project to maintain a single source of truth (master SQL file).
 * @param {string} sql - The raw PostgreSQL SQL string.
 * @returns {string} - The translated SQL string for SQLite.
 */
function translatePostgresToSqlite(sql) {
    return sql
        .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
        .replace(/\bTIMESTAMP\b/gi, 'DATETIME') // Use word boundaries to avoid affecting CURRENT_TIMESTAMP
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
  console.log(`\n🌱 Unified database seed (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);

  try {
    const sqlPath = path.resolve(__dirname, '../sec2_gr14_database.sql');
    if (!fs.existsSync(sqlPath)) {
        throw new Error(`Master SQL file not found at ${sqlPath}`);
    }
    const masterSql = fs.readFileSync(sqlPath, 'utf8');

        if (isPostgres) {
            /**
             * PostgreSQL Seeding Logic
             * Executes the master SQL file directly on the database.
             */
            const pool = new Pool({
                connectionString: databaseUrl,
                ssl: databaseUrl.includes('render.com') ? { rejectUnauthorized: false } : false
            });

            // ─────────────────────────────────────────────
            //  IDEMPOTENT CHECK
            // ─────────────────────────────────────────────
            console.log('🔍 Checking if database already contains data...');
            try {
                // PostgreSQL unquoted table names are lowercase in information_schema.
                const checkResult = await pool.query(`
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('product', 'admininformation')
                `);
                
                if (parseInt(checkResult.rows[0].count) > 0 && process.env.FORCE_SEED !== 'true') {
                    console.log('⏭️  Database already initialized. Skipping seed to prevent data loss.');
                    console.log('💡 Tip: Set FORCE_SEED=true to force a complete wipe and re-seed.');
                    await pool.end();
                    return;
                }
            } catch (checkErr) {
                console.log('⚠️  Idempotent check failed (treating as empty):', checkErr.message);
                // Table doesn't exist or other error, proceed with seed
            }

            console.log('🏗️  Executing Master SQL on PostgreSQL (Wipe and Initialize)...');
            // Ensure DROP TABLE commands use CASCADE for PostgreSQL to clear dependencies
            const pgSql = masterSql.replace(/DROP TABLE IF EXISTS ([a-z0-9_"]+);/gi, 'DROP TABLE IF EXISTS $1 CASCADE;');
            await pool.query(pgSql);
            console.log('✅ PostgreSQL database initialized successfully');
            await pool.end();

            } else {
            /**
             * SQLite Seeding Logic (Local Fallback)
             * Translates the PostgreSQL master SQL before execution.
             */
            const dbPath = path.resolve(__dirname, './data/sec2_gr14_database.sqlite');
            
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            if (fs.existsSync(dbPath) && process.env.FORCE_SEED !== 'true') {
                // On local sqlite, we usually just skip if the file exists to preserve testing data
                console.log('⏭️  Local SQLite database file exists. Skipping redundant seed.');
                return;
            }

            const sqliteDb = await open({ filename: dbPath, driver: sqlite3.Database });
            
            console.log('🏗️  Translating Master SQL for SQLite...');
            const localSql = translatePostgresToSqlite(masterSql);
            
            console.log('🏗️  Executing Translated SQL on SQLite (Wipe and Initialize)...');
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
