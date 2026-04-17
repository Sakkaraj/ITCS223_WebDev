/**
 * Frontend Server for BoonSonClon
 * Serves the frontend static files on port 5000
 * Separate from the backend API server (port 3000)
 * 
 * Usage: npm run frontend
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || 5000;

// ─────────────────────────────────────────────
//  SERVE STATIC FILES
// ─────────────────────────────────────────────
const frontendPath = __dirname;
app.use(express.static(frontendPath, { extensions: ['html'] }));

// ─────────────────────────────────────────────
//  SPA FALLBACK: Serve index.html for routes
// ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─────────────────────────────────────────────
//  ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Frontend Server Error:', err);
  res.status(500).send('Server Error');
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
    app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log(`║  BoonSonClon Frontend Server on port ${PORT} ║`);
    console.log(`║  Open: http://localhost:${PORT}              ║`);
    console.log('║  API:  http://localhost:3000/api          ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
    });
