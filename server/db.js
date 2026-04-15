const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
require('dotenv').config();

const dbPath = path.resolve(__dirname, './data/database.sqlite');

let dbInstance = null;

// Initialize the database connection
const initDb = async () => {
  if (!dbInstance) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ SQLite connected successfully');
    
    // Enable foreign keys
    await dbInstance.run('PRAGMA foreign_keys = ON');
  }
  return dbInstance;
};

initDb().catch(err => console.error('❌ SQLite connection failed:', err.message));

// Mock mysql2 execute interface
const pool = {
  execute: async (sql, params = []) => {
    const db = await initDb();
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || 
                     sql.trim().toUpperCase().startsWith('WITH') || 
                     sql.trim().toUpperCase().startsWith('PRAGMA');
    
    try {
      if (isSelect) {
        const rows = await db.all(sql, params);
        return [rows, []]; // [rows, fields]
      } else {
        const result = await db.run(sql, params);
        // mysql2 returns { insertId, affectedRows } in the first element
        return [{ insertId: result.lastID, affectedRows: result.changes }, []];
      }
    } catch (err) {
      console.error('DB Error on SQL:', sql);
      throw err;
    }
  },
  query: async function(sql, params) {
    return this.execute(sql, params);
  }
};

module.exports = pool;
