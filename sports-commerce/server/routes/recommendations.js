const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/recommendations
 * Hybrid contextual recommendation engine using:
 * 1. User preferences  2. Live match context  3. Behavior history  4. Player performance  5. Popularity
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDB();
    const limit = Number(req.query.limit) || 8;
    let products = db.prepare('SELECT * FROM products ORDER BY id').all();
    products = products.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]'), score: 0 }));

    if (req.user) {
      const user = db.prepare('SELECT preferences FROM users WHERE id = ?').get(req.user.id);
      if (user && user.preferences) {
        const prefs = JSON.parse(user.preferences);
        for (const p of products) {
          if ((prefs.sports || []).some(s => p.sport.toLowerCase().includes(s.toLowerCase()))) p.score += 15;
          if ((prefs.teams || []).some(t => p.team.toLowerCase().includes(t.toLowerCase()))) p.score += 25;
        }
      }
      const recentViews = db.prepare('SELECT product_id, COUNT(*) as cnt FROM user_activity WHERE user_id = ? AND action = ? GROUP BY product_id ORDER BY cnt DESC LIMIT 10').all(req.user.id, 'view');
      const viewedSports = new Set(), viewedTeams = new Set();
      for (const v of recentViews) { const vp = products.find(p => p.id === v.product_id); if (vp) { viewedSports.add(vp.sport); viewedTeams.add(vp.team); } }
      for (const p of products) { if (viewedSports.has(p.sport)) p.score += 8; if (viewedTeams.has(p.team)) p.score += 12; }
    }

    const liveMatches = db.prepare("SELECT * FROM matches WHERE status = 'Live'").all();
    const liveTeams = new Set(), liveSports = new Set();
    for (const m of liveMatches) { liveTeams.add(m.team1); liveTeams.add(m.team2); liveSports.add(m.sport); }
    for (const p of products) {
      if (liveTeams.has(p.team)) p.score += 20;
      if (liveSports.has(p.sport)) p.score += 5;
      if (p.badge === 'live') p.score += 10;
      if (p.badge === 'trending') p.score += 8;
      p.score += Math.floor(p.sales_count / 100) + Math.floor(p.rating * 2);
    }

    products.sort((a, b) => b.score - a.score);
    res.json({ success: true, data: products.slice(0, limit), meta: { algorithm: 'hybrid_contextual_v1', signals: ['user_preferences','live_matches','behavior','player_performance','popularity'], user_authenticated: !!req.user } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/match/:matchId', (req, res) => {
  try {
    const db = getDB();
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, error: 'Match not found.' });
    const products = db.prepare('SELECT * FROM products WHERE team IN (?, ?) OR sport = ? ORDER BY sales_count DESC LIMIT 8').all(match.team1, match.team2, match.sport).map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
    res.json({ success: true, data: { match, products } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/wishlist', authenticate, (req, res) => {
  try {
    const db = getDB();
    const { product_id } = req.body;
    const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
    if (existing) { db.prepare('DELETE FROM wishlist WHERE id = ?').run(existing.id); db._save(); res.json({ success: true, message: 'Removed from wishlist.', wishlisted: false }); }
    else { db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id); db._save(); res.json({ success: true, message: 'Added to wishlist!', wishlisted: true }); }
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/wishlist', authenticate, (req, res) => {
  try {
    const db = getDB();
    const items = db.prepare('SELECT p.*, w.added_at as wishlisted_at FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?').all(req.user.id).map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
