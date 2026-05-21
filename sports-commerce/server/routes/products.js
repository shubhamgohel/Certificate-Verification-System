const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/products
 * Fetch products with optional filters: sport, team, category, badge, search, sort, limit, offset
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDB();
    const { sport, team, category, badge, search, sort, limit = 20, offset = 0 } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (sport) { query += ' AND sport = ?'; params.push(sport); }
    if (team) { query += ' AND team = ?'; params.push(team); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (badge) { query += ' AND badge = ?'; params.push(badge); }
    if (search) {
      query += ' AND (name LIKE ? OR team LIKE ? OR sport LIKE ? OR tags LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params);

    const sortMap = { price_asc: 'price ASC', price_desc: 'price DESC', popular: 'sales_count DESC', rating: 'rating DESC', newest: 'created_at DESC' };
    query += ` ORDER BY ${sortMap[sort] || 'sales_count DESC'}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const products = db.prepare(query).all(...params).map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));

    if (req.user) {
      db.prepare('INSERT INTO user_activity (user_id, action, metadata) VALUES (?, ?, ?)').run(req.user.id, 'browse', JSON.stringify({ sport, team, category }));
    }

    res.json({ success: true, data: products, pagination: { total, limit: Number(limit), offset: Number(offset), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/products/trending
 */
router.get('/trending', (req, res) => {
  try {
    const db = getDB();
    const products = db.prepare("SELECT * FROM products WHERE badge IN ('trending','live') ORDER BY sales_count DESC LIMIT 8")
      .all().map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db = getDB();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    product.tags = JSON.parse(product.tags || '[]');
    const related = db.prepare('SELECT * FROM products WHERE id != ? AND (sport = ? OR team = ?) LIMIT 4')
      .all(product.id, product.sport, product.team).map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
    if (req.user) {
      db.prepare('INSERT INTO user_activity (user_id, product_id, action) VALUES (?, ?, ?)').run(req.user.id, product.id, 'view');
    }
    res.json({ success: true, data: { ...product, related } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
