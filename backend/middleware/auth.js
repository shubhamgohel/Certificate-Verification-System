// middleware/auth.js — JWT auth (CommonJS)
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'amdox_dev_secret_change_in_prod';

function withAuth(handler) {
  return async (req, res) => {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
      req.admin = jwt.verify(header.split(' ')[1], SECRET);
      return handler(req, res);
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: e.name === 'TokenExpiredError' ? 'Session expired, please login again' : 'Invalid token',
      });
    }
  };
}

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

module.exports = { withAuth, signToken };
