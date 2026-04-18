const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
require('dotenv').config();

// Determine which database to use
const databaseUrl = process.env.DATABASE_URL || process.env.INTERNAL_DATABASE_URL;
const isPostgres = !!databaseUrl;

let dbInstance = null; // For SQLite
let pgPool = null;    // For PostgreSQL

/**
 * PostgreSQL Implementation
 */
if (isPostgres) {
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('render.com') ? { rejectUnauthorized: false } : false
  });
  console.log('🐘 PostgreSQL connected successfully (Production Mode)');
}

/**
 * SQLite Implementation (Fallback for Local)
 */
const initSqlite = async () => {
  if (!dbInstance) {
    const dbPath = path.resolve(__dirname, './data/sec2_gr14_database.sqlite');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ SQLite connected successfully (Local Fallback)');
    await dbInstance.run('PRAGMA foreign_keys = ON');
  }
  return dbInstance;
};

/**
 * Universal Database Interface
 * - Translates '?' placeholders to '$n' for PostgreSQL
 * - Translates results to match mysql2/sqlite structure (insertId, affectedRows)
 */
const pool = {
  execute: async (sql, params = []) => {
    if (isPostgres) {
      // 1. Translate placeholders: '?' -> '$1', '$2', etc.
      let pgSql = sql;
      let count = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${count++}`);
      }

      // 2. Handle Insert ID (Postgres requires RETURNING)
      const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
        // Attempt to find the ID column name. 
        // Heuristic: Most tables use [TableName]Id as PK.
        // For simplicity, we just return the first serial column or all.
        pgSql += ' RETURNING *';
      }

      try {
        const result = await pgPool.query(pgSql, params);
        
        const isSelect = pgSql.trim().toUpperCase().startsWith('SELECT') || 
                         pgSql.trim().toUpperCase().startsWith('WITH');

        if (isSelect) {
          return [result.rows, result.fields];
        } else {
          // Mock mysql2 result interface
          let insertId = null;
          if (isInsert && result.rows.length > 0) {
            // Pick the first key that looks like an ID
            const firstRow = result.rows[0];
            const idKey = Object.keys(firstRow).find(k => k.toLowerCase().endsWith('id'));
            insertId = idKey ? firstRow[idKey] : (firstRow.id || null);
          }
          return [{ insertId, affectedRows: result.rowCount }, []];
        }
      } catch (err) {
        console.error('🐘 Postgres Error on SQL:', pgSql);
        throw err;
      }
    } else {
      // Fallback to SQLite
      const db = await initSqlite();
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || 
                       sql.trim().toUpperCase().startsWith('WITH') || 
                       sql.trim().toUpperCase().startsWith('PRAGMA');
      
      try {
        if (isSelect) {
          const rows = await db.all(sql, params);
          return [rows, []];
        } else {
          const result = await db.run(sql, params);
          return [{ insertId: result.lastID, affectedRows: result.changes }, []];
        }
      } catch (err) {
        console.error('❌ SQLite Error on SQL:', sql);
        throw err;
      }
    }
  },
  query: async function(sql, params) {
    return this.execute(sql, params);
  }
};

module.exports = pool;
