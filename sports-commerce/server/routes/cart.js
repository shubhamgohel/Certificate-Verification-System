const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const db = getDB();
    const items = db.prepare(`SELECT ci.id as cart_id, ci.quantity, ci.added_at, p.id, p.name, p.team, p.sport, p.price, p.old_price, p.image, p.badge, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ? ORDER BY ci.added_at DESC`).all(req.user.id);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = Math.round(subtotal * 0.1);
    res.json({ success: true, data: { items, summary: { subtotal, discount, delivery: 0, total: subtotal - discount, item_count: items.reduce((s, i) => s + i.quantity, 0) } } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const db = getDB();
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, error: 'product_id is required.' });
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
    if (existing) { db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id); }
    else { db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity); }
    db.prepare('INSERT INTO user_activity (user_id, product_id, action) VALUES (?, ?, ?)').run(req.user.id, product_id, 'cart');
    db._save();
    res.json({ success: true, message: `${product.name} added to cart.` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDB();
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ success: false, error: 'Quantity must be >= 1.' });
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!item) return res.status(404).json({ success: false, error: 'Cart item not found.' });
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
    db._save();
    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    db._save();
    res.json({ success: true, message: 'Item removed.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/', (req, res) => {
  try {
    const db = getDB();
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    db._save();
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/checkout', (req, res) => {
  try {
    const db = getDB();
    const items = db.prepare('SELECT ci.quantity, p.id, p.name, p.price, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?').all(req.user.id);
    if (items.length === 0) return res.status(400).json({ success: false, error: 'Cart is empty.' });
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = Math.round(subtotal * 0.1);
    const total = subtotal - discount;
    const order = db.prepare('INSERT INTO orders (user_id, items, subtotal, discount, total) VALUES (?, ?, ?, ?, ?)').run(req.user.id, JSON.stringify(items), subtotal, discount, total);
    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?').run(item.quantity, item.quantity, item.id);
      db.prepare('INSERT INTO user_activity (user_id, product_id, action) VALUES (?, ?, ?)').run(req.user.id, item.id, 'purchase');
    }
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    const loyaltyPts = Math.floor(total / 100);
    db.prepare('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?').run(loyaltyPts, req.user.id);
    db._save();
    res.json({ success: true, message: 'Order placed!', data: { order_id: order.lastInsertRowid, total, loyalty_points_earned: loyaltyPts } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
