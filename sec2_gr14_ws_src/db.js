/**
 * db.js — BoonSonClon Database Bridge
 * Purpose: Provides a universal database interface that abstracts PostgreSQL 
 * (Production) and SQLite (Local Fallback), supporting clean SQL execution 
 * with automatic case normalization.
 */

const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
require('dotenv').config();

// ─────────────────────────────────────────────
//  DATABASE TYPE DETECTION
// ─────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL || 
                    process.env.INTERNAL_DATABASE_URL || 
                    process.env.DATABASE_PATH;
const isPostgres = !!databaseUrl && databaseUrl.startsWith('postgres');

let dbInstance = null; // For SQLite
let pgPool = null;    // For PostgreSQL

/**
 * PostgreSQL Implementation
 * Connected if isPostgres is true.
 */
if (isPostgres) {
    pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('render.com') ? { rejectUnauthorized: false } : false
    });
    console.log('🐘 PostgreSQL connected successfully (Production Mode)');
}

/**
 * Case Normalization Map
 * Maps lowercase PostgreSQL keys to PascalCase keys expected by the app.
 */
const NORMALIZE_MAP = {
  'productid': 'ProductId',
  'productname': 'ProductName',
  'price': 'Price',
  'quantityleft': 'QuantityLeft',
  'productdescription': 'ProductDescription',
  'productdetail': 'ProductDetail',
  'widthdimension': 'WidthDimension',
  'heightdimension': 'HeightDimension',
  'lengthdimension': 'LengthDimension',
  'weight': 'Weight',
  'featured': 'Featured',
  'status': 'Status',
  'createdat': 'CreatedAt',
  'categoryid': 'CategoryId',
  'category': 'Category',
  'materialid': 'MaterialId',
  'materialname': 'MaterialName',
  'materialtype': 'MaterialType',
  'colorid': 'ColorId',
  'colorname': 'ColorName',
  'hexcode': 'HexCode',
  'sortorder': 'SortOrder',
  'imageid': 'ImageId',
  'imageurl': 'ImageUrl',
  'imagecount': 'ImageCount',
  'total': 'total',
  'adminid': 'AdminId',
  'memberid': 'MemberId',
  'firstname': 'FirstName',
  'lastname': 'LastName',
  'email': 'Email',
  'memberemail': 'MemberEmail',
  'phonenumber': 'PhoneNumber',
  'totalamount': 'TotalAmount',
  'vatamount': 'VatAmount',
  'orderdate': 'OrderDate',
  'orderid': 'OrderId',
  'trackingid': 'TrackingId',
  'contactemail': 'ContactEmail',
  'rating': 'Rating',
  'shippingamount': 'ShippingAmount',
  'reviewcomment': 'ReviewComment',
  'reviewid': 'ReviewId',
  'memberpassword': 'MemberPassword',
  'adminpassword': 'AdminPassword',
  'adminusername': 'AdminUserName',
  'role': 'Role',
  'deliverystatus': 'DeliveryStatus',
  'totalrevenue': 'TotalRevenue',
  'membercount': 'MemberCount',
  'ordercount': 'OrderCount',
  'productcount': 'ProductCount',
  'itemquantity': 'ItemQuantity',
  'subtotal': 'SubTotal',
  'addressdetail': 'AddressDetail',
  'totalsold': 'TotalSold',
  'minprice': 'MinPrice',
  'maxprice': 'MaxPrice',
  'contactorid': 'ContactorId',
  'message': 'Message',
  'logintimestamp': 'LoginTimeStamp',
  'createat': 'CreateAt',
  'expiresat': 'ExpiresAt',
  'logid': 'LogId',
  'tokenid': 'TokenId',
  'tokenhash': 'TokenHash',
  'revokestatus': 'RevokeStatus',
  'addressid': 'AddressId',
  'orderitemid': 'OrderItemId',
  'subscriberid': 'SubscriberId',
  'address': 'Address',
  'age': 'Age',
  'telephonenumber': 'TelephoneNumber'
};

/**
 * normalizeRows — PostgreSQL Case Normalization
 * @param {Array} rows - The raw result rows from the database.
 * @returns {Array} - Transformed rows with normalized keys based on NORMALIZE_MAP.
 */
function normalizeRows(rows) {
    if (!rows || !Array.isArray(rows)) return rows;
    return rows.map(row => {
        const normalized = {};
        for (const key in row) {
            const lowerKey = key.toLowerCase();
            const mappedKey = NORMALIZE_MAP[lowerKey] || key;
            let value = row[key];

            // ─────────────────────────────────────────────
            //  DATE NORMALIZATION (SQLite Fix)
            //  SQLite returns 'YYYY-MM-DD HH:MM:SS' for UTC dates.
            //  We append 'Z' so the browser correctly treats it as UTC.
            // ─────────────────────────────────────────────
            if (typeof value === 'string' && 
                (lowerKey.includes('date') || lowerKey.includes('timestamp') || lowerKey.includes('at')) &&
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
                value += 'Z';
            }

            normalized[mappedKey] = value;
        }
        return normalized;
    });
}

/**
 * SQLite Implementation (Fallback for Local)
 */
/**
 * initSqlite — SQLite Connection Manager
 * Initializes the SQLite database instance for local development environments.
 * @returns {Promise<Database>} - The active SQLite database instance.
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
/**
 * Universal Database Interface
 * - Translates '?' placeholders to '$n' for PostgreSQL
 * - Translates results to match mysql2/sqlite structure (insertId, affectedRows)
 */
const pool = {
    /**
     * execute — Core Query Function
     * @param {string} sql - The SQL query string.
     * @param {Array} params - The query parameters.
     * @returns {Promise<Array>} - [Results, Fields] following mysql2 format.
     */
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
                // Return all columns to pick up the ID
                pgSql += ' RETURNING *';
            }

            try {
                const result = await pgPool.query(pgSql, params);
                
                const isSelect = pgSql.trim().toUpperCase().startsWith('SELECT') || 
                                 pgSql.trim().toUpperCase().startsWith('WITH');

                if (isSelect) {
                    return [normalizeRows(result.rows), result.fields];
                } else {
                    // Normalize rows for potential RETURNING clauses
                    const rows = normalizeRows(result.rows);
                    // Mock mysql2 result interface
                    let insertId = null;
                    if (isInsert && rows.length > 0) {
                        // Pick the first key that looks like an ID
                        const firstRow = rows[0];
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
                    return [normalizeRows(rows), []];
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
    
    /**
     * query — Standard Query Alias
     */
    query: async function(sql, params) {
        return this.execute(sql, params);
    }
};

module.exports = pool;
