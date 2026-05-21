const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDB } = require('../database');
const { authenticate, generateToken } = require('../middleware/auth');

router.post('/register', (req, res) => {
  try {
    const db = getDB();
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    if (password.length < 6) return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered.' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);
    db._save();
    const user = { id: result.lastInsertRowid, name, email };
    res.status(201).json({ success: true, data: { user, token: generateToken(user) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required.' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    const { password: _, ...userData } = user;
    userData.preferences = JSON.parse(userData.preferences || '{}');
    res.json({ success: true, data: { user: userData, token: generateToken(user) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/profile', authenticate, (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare('SELECT id, name, email, preferences, loyalty_points, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    user.preferences = JSON.parse(user.preferences || '{}');
    const orderStats = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total_spent FROM orders WHERE user_id = ?').get(req.user.id);
    res.json({ success: true, data: { ...user, orders: orderStats } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/preferences', authenticate, (req, res) => {
  try {
    const db = getDB();
    const { sports, teams, interests } = req.body;
    const prefs = JSON.stringify({ sports, teams, interests });
    db.prepare('UPDATE users SET preferences = ? WHERE id = ?').run(prefs, req.user.id);
    db._save();
    res.json({ success: true, message: 'Preferences updated.', data: { sports, teams, interests } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
