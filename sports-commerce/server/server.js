require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDB, getDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────── Middleware ────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, error: 'Too many requests.' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// ──────────── Ensure DB is ready before API calls ────────────
app.use('/api', async (req, res, next) => {
  try { await initDB(); next(); } catch (e) { res.status(500).json({ success: false, error: 'Database not ready.' }); }
});

// ──────────── API Routes ────────────
app.use('/api/products', require('./routes/products'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/recommendations', require('./routes/recommendations'));

app.get('/api/teams', (req, res) => {
  try { res.json({ success: true, data: getDB().prepare('SELECT * FROM teams ORDER BY product_count DESC').all() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/players', (req, res) => {
  try { res.json({ success: true, data: getDB().prepare('SELECT * FROM players ORDER BY performance DESC').all() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/categories', (req, res) => {
  try { res.json({ success: true, data: getDB().prepare('SELECT * FROM categories ORDER BY id').all() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Health check
app.get('/api/health', (req, res) => {
  try {
    const db = getDB();
    res.json({ success: true, status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString(),
      database: { products: db.prepare('SELECT COUNT(*) as c FROM products').get().c, matches: db.prepare('SELECT COUNT(*) as c FROM matches').get().c, users: db.prepare('SELECT COUNT(*) as c FROM users').get().c }
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// 404 for API
app.use('/api/*', (req, res) => { res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found.` }); });
// Serve frontend
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '..', 'index.html')); });
// Error handler
app.use((err, req, res, _next) => { console.error('[ERROR]', err.stack); res.status(500).json({ success: false, error: err.message }); });

// ──────────── Start ────────────
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n⚡ SportVerse API Server`);
    console.log(`   Server  : http://localhost:${PORT}`);
    console.log(`   API     : http://localhost:${PORT}/api`);
    console.log(`   Health  : http://localhost:${PORT}/api/health\n`);
  });
  // Live score simulation
  const { simulateScoreUpdates } = require('./routes/matches');
  setInterval(simulateScoreUpdates, 10000);
}
start().catch(e => { console.error('Failed to start:', e); process.exit(1); });

module.exports = app;
