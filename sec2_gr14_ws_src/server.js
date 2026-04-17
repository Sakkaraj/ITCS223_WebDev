require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');

const app = express();
const PORT = process.env.PORT || 3000;

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
  secret: process.env.SESSION_SECRET || 'boonsonclon_session',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ─────────────────────────────────────────────
//  API ROUTES (Backend only - no static files)
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

// ─────────────────────────────────────────────
//  HEALTH CHECK ENDPOINT
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend API is running', timestamp: new Date() });
});

// ─────────────────────────────────────────────
//  OPTIONAL: SERVE STATIC FILES (For Unified Production)
// ─────────────────────────────────────────────
if (process.env.SERVE_FRONTEND === 'true') {
  const frontendPath = path.join(__dirname, '..', 'sec2_gr14_fe_src');
  app.use(express.static(frontendPath));

  // Fallback for SPA routing: serve index.html for any non-API route
  app.get('*', (req, res) => {
    // If it starts with /api/, it's a 404 for the API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Otherwise, serve index.html to allow frontend routing
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
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
            API Base: http://localhost:${PORT}/api
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
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═════════════════════════════════════════════════╗');
  console.log(`║  BoonSonClon API Server running on port ${PORT}    ║`);
  console.log(`║  API Base: http://localhost:${PORT}/api            ║`);
  console.log('╚═════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
