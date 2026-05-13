// pages/api/admin/certificates.js — CRUD for admin
const { query } = require('../../../lib/db');
const { withAuth } = require('../../../middleware/auth');

async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — list with pagination + search
  if (req.method === 'GET') {
    const { page = 1, limit = 15, search = '', domain = '', active = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (certificate_id LIKE ? OR student_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (domain) { where += ' AND domain = ?'; params.push(domain); }
    if (active !== '') { where += ' AND is_active = ?'; params.push(active === 'true' ? 1 : 0); }

    try {
      const countRows = await query(`SELECT COUNT(*) as c FROM certificates ${where}`, params);
      const total = countRows[0].c;
      const rows  = await query(
        `SELECT certificate_id, student_name, email, domain, start_date, end_date,
                grade, is_active, download_count, created_at
         FROM certificates ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      return res.status(200).json({
        success: true,
        data: rows,
        pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // PATCH — toggle is_active
  if (req.method === 'PATCH') {
    const { certificate_id, is_active } = req.body || {};
    if (!certificate_id)
      return res.status(400).json({ success: false, message: 'Certificate ID required' });
    try {
      await query('UPDATE certificates SET is_active = ? WHERE certificate_id = ?', [is_active ? 1 : 0, certificate_id]);
      return res.status(200).json({ success: true, message: `Certificate ${is_active ? 'activated' : 'deactivated'}` });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { certificate_id } = req.body || {};
    if (!certificate_id)
      return res.status(400).json({ success: false, message: 'Certificate ID required' });
    try {
      await query('DELETE FROM certificates WHERE certificate_id = ?', [certificate_id]);
      return res.status(200).json({ success: true, message: 'Certificate deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withAuth(handler);
