require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');

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
