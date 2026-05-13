// pages/api/admin/stats.js — Dashboard stats
const { query } = require('../../../lib/db');
const { withAuth } = require('../../../middleware/auth');

async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const [
      totRows, actRows, dlRows, domains, recentUploads, recentCerts
    ] = await Promise.all([
      query('SELECT COUNT(*) as c FROM certificates'),
      query('SELECT COUNT(*) as c FROM certificates WHERE is_active = 1'),
      query('SELECT COALESCE(SUM(download_count), 0) as t FROM certificates'),
      query('SELECT domain, COUNT(*) as count FROM certificates GROUP BY domain ORDER BY count DESC LIMIT 8'),
      query('SELECT filename, total_records, success_count, error_count, status, created_at FROM upload_batches ORDER BY created_at DESC LIMIT 5'),
      query('SELECT certificate_id, student_name, domain, created_at FROM certificates ORDER BY created_at DESC LIMIT 10'),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalCertificates:    totRows[0].c,
        activeCertificates:   actRows[0].c,
        totalDownloads:       Number(dlRows[0].t),
        inactiveCertificates: totRows[0].c - actRows[0].c,
      },
      domains,
      recentUploads,
      recentCertificates: recentCerts,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}

export default withAuth(handler);
