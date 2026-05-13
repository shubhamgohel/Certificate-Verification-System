// pages/api/auth/register.js
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../../../lib/db');
const { signToken } = require('../../../middleware/auth');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { name, email, password, setupKey } = req.body || {};

  if (setupKey !== (process.env.SETUP_KEY || 'amdox_setup_2024'))
    return res.status(403).json({ success: false, message: 'Invalid setup key' });

  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'All fields are required' });

  try {
    const existing = await queryOne('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing)
      return res.status(409).json({ success: false, message: 'Admin with this email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, 'superadmin')",
      [name.trim(), email.toLowerCase().trim(), hashed]
    );

    const token = signToken({ id: result.insertId, email, name, role: 'superadmin' });

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      token,
      admin: { id: result.insertId, name, email, role: 'superadmin' },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
