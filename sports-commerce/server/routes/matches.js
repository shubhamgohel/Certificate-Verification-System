const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

router.get('/', (req, res) => {
  try {
    const db = getDB();
    const { status } = req.query;
    let query = 'SELECT * FROM matches';
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY started_at DESC';
    const matches = db.prepare(query).all(...params);
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/merch', (req, res) => {
  try {
    const db = getDB();
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
    const products = db.prepare('SELECT * FROM products WHERE team IN (?, ?) OR sport = ? ORDER BY sales_count DESC LIMIT 8')
      .all(match.team1, match.team2, match.sport).map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
    res.json({ success: true, data: { match, products } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function simulateScoreUpdates() {
  try {
    const db = getDB();
    const matches = db.prepare("SELECT * FROM matches WHERE status = 'Live'").all();
    for (const m of matches) {
      if (m.sport === 'Cricket') {
        const parts = m.score2.split('/');
        const newRuns = parseInt(parts[0]) + Math.floor(Math.random() * 7);
        db.prepare('UPDATE matches SET score2 = ? WHERE id = ?').run(newRuns + '/' + parts[1], m.id);
      } else if (m.sport === 'Basketball') {
        db.prepare('UPDATE matches SET score1 = ?, score2 = ? WHERE id = ?').run(
          String(parseInt(m.score1) + Math.floor(Math.random() * 4)),
          String(parseInt(m.score2) + Math.floor(Math.random() * 4)), m.id);
      }
    }
    db._save();
  } catch (_) { /* silent */ }
}

module.exports = router;
module.exports.simulateScoreUpdates = simulateScoreUpdates;
