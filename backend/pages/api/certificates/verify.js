// pages/api/certificates/verify.js — Public certificate lookup
const { queryOne } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const rawId = String(req.query.id || '').trim().toUpperCase();
  if (!rawId)
    return res.status(400).json({ success: false, message: 'Certificate ID is required' });

  try {
    const cert = await queryOne(
      `SELECT certificate_id, student_name, email, domain,
              start_date, end_date, duration, grade, issued_by,
              is_active, download_count, created_at
       FROM certificates
       WHERE certificate_id = ? AND is_active = 1`,
      [rawId]
    );

    if (!cert)
      return res.status(404).json({
        success: false,
        message: 'Certificate not found. Please double-check the ID and try again.',
      });

    // Increment download/view count
    await queryOne(
      'UPDATE certificates SET download_count = download_count + 1 WHERE certificate_id = ?',
      [rawId]
    );

    const fmt = (d) => {
      if (!d) return '';
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
    };

    return res.status(200).json({
      success: true,
      certificate: {
        ...cert,
        start_date: fmt(cert.start_date),
        end_date:   fmt(cert.end_date),
        issued_on:  fmt(cert.created_at),
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}
