/**
 * server.js — BoonSonClon Backend API Server
 * Purpose: Main entry point for the Express application. Configures middleware,
 * session management, API routes, and serves the frontend in production.
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const SQLiteStore = require('connect-sqlite3')(session);
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
//  ROUTE IMPORTS
// ─────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
//  DATABASE CONFIGURATION
// ─────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL || 
                    process.env.INTERNAL_DATABASE_URL || 
                    process.env.DATABASE_PATH;
const isPostgres = !!databaseUrl && databaseUrl.startsWith('postgres');
let sessionStore;

if (isPostgres) {
    // Production: Use PostgreSQL for sessions
    sessionStore = new PgSession({
        conString: databaseUrl,
        tableName: 'session',
        createTableIfMissing: false
    });
    console.log('💾 Session Store: PostgreSQL');
} else {
    // Local: Use SQLite for sessions
    const sessionDir = path.resolve(__dirname, './data');
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    sessionStore = new SQLiteStore({
        db: 'sec2_gr14_sessions.sqlite',
        dir: sessionDir,
        table: 'sessions'
    });
    console.log('💾 Session Store: SQLite');
}

// ─────────────────────────────────────────────
//  MIDDLEWARE
// ─────────────────────────────────────────────
// Enable CORS for frontend on separate server
// Frontend is typically on port 5000 during development
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || 'http://localhost:5000',
        'http://localhost:3000',  // Allow same-origin requests
        'http://127.0.0.1:5000',
        'http://127.0.0.1:3000',
    ],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'boonsonclon_session',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-site cookies on Render
    },
    proxy: process.env.NODE_ENV === 'production', // Trust Render's proxy
}));

// ─────────────────────────────────────────────
//  API ROUTES (Backend only - no static files)
// ─────────────────────────────────────────────
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);

// ─────────────────────────────────────────────
//  HEALTH CHECK ENDPOINT
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend API is running', timestamp: new Date() });
});

// ─────────────────────────────────────────────
//  UNIFIED PRODUCTION MODE (Serve Frontend + API)
// ─────────────────────────────────────────────
if (process.env.SERVE_FRONTEND === 'true' || process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '..', 'sec2_gr14_fe_src');
    
    // 1. Serve static assets (js, css, images) directly
    app.use(express.static(frontendPath, { 
        extensions: ['html'], // 👈 Supports Clean URLs (e.g. /pages/shop instead of shop.html)
        index: 'index.html'
    }));

    // 2. Custom route for cleaner page resolution if needed
    app.get('/pages/:page', (req, res, next) => {
        const page = req.params.page;
        const filePath = path.join(frontendPath, 'pages', `${page}.html`);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
        next();
    });

    // 3. Fallback for SPA routing or 404s
    app.get('*', (req, res) => {
        // If it starts with /api/, it's a 404 for the API
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        // Otherwise, serve the main landing page
        res.sendFile(path.join(frontendPath, 'index.html'));
    });

    console.log('🚀 Unified Mode: Serving frontend from ' + frontendPath);
} else {
    // Default root route for API-only mode (Local Development)
    app.get('/', (req, res) => {
        res.send(`
            <div style="font-family: sans-serif; padding: 50px; text-align: center;">
                <h1 style="color: #4f46e5;">🛋️ BoonSonClon API Server</h1>
                <p style="color: #666; font-size: 18px;">The backend API service is running successfully on port ${PORT}.</p>
                <p style="color: #999;">For the website, please use <strong>http://localhost:5000</strong></p>
                <div style="margin-top: 30px;">
                    <code style="background: #f3f4f6; padding: 10px 20px; border-radius: 8px; font-size: 16px;">
                        API Base URL: http://localhost:${PORT}/api
                    </code>
                </div>
            </div>
        `);
    });
}

// ─────────────────────────────────────────────
//  GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    // Handle JSON parsing errors (common with Postman/invalid payloads)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.warn('⚠️ Bad JSON Payload received:', err.message);
        return res.status(400).json({ 
            error: 'Invalid JSON payload. Please check your request formatting.',
            details: err.message
        });
    }

    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  const isProd = process.env.NODE_ENV === 'production';
  console.log('');
  console.log('╔═════════════════════════════════════════════════╗');
  console.log(`║  BoonSonClon API Server running on port ${PORT}    ║`);
  if (!isProd) {
    console.log(`║  API Base: http://localhost:${PORT}/api            ║`);
  } else {
    console.log(`║  Mode: Production (Unified Deployment)          ║`);
  }
  console.log('╚═════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
