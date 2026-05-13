// pages/api/auth/login.js
const bcrypt = require('bcryptjs');
const { queryOne } = require('../../../lib/db');
const { signToken } = require('../../../middleware/auth');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });

  try {
    const admin = await queryOne(
      'SELECT * FROM admins WHERE email = ? AND is_active = 1',
      [email.toLowerCase().trim()]
    );

    if (!admin || !(await bcrypt.compare(password, admin.password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    await queryOne('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = signToken({
      id: admin.id, email: admin.email, name: admin.name, role: admin.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error('Login error detail:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    return res.status(500).json({ success: false, message: 'Server error: ' + (err.message || 'Unknown error') });
  }
}
