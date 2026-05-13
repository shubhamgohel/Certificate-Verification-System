// pages/api/admin/upload.js
const { IncomingForm } = require('formidable');
const XLSX = require('xlsx');
const fs   = require('fs');
const { query } = require('../../../lib/db');
const { withAuth } = require('../../../middleware/auth');

export const config = { api: { bodyParser: false } };

// Parse Excel/serial dates safely — no XLSX.SSF dependency
function parseDate(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  // Excel serial date number
  if (!isNaN(num) && num > 1000 && num < 100000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + Math.floor(num));
    const y = epoch.getUTCFullYear();
    const m = String(epoch.getUTCMonth() + 1).padStart(2, '0');
    const d = String(epoch.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
  // Fallback JS Date
  const p = new Date(str);
  return isNaN(p.getTime()) ? null : p.toISOString().split('T')[0];
}

// Parse multipart form using Promise (avoids callback + return conflict in Next.js)
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  let filePath = null;

  try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file)
      return res.status(400).json({ success: false, message: 'No file uploaded. Field name must be "file".' });

    filePath = file.filepath;
    const ext = (file.originalFilename || '').split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext))
      return res.status(400).json({ success: false, message: 'Only .xlsx, .xls, or .csv files are allowed' });

    // Read workbook
    const wb   = XLSX.readFile(filePath, { cellDates: true });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'The file has no data rows' });
    }

    // Create batch record
    const batchRes = await query(
      "INSERT INTO upload_batches (filename, total_records, uploaded_by, status) VALUES (?,?,?,'processing')",
      [file.originalFilename, rows.length, req.admin.id]
    );
    const batchId = batchRes.insertId;

    let successCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      // Normalize column keys → lowercase with underscores
      const n = {};
      Object.keys(r).forEach(k => {
        n[k.toLowerCase().trim().replace(/[\s\-]+/g, '_')] = r[k];
      });

      const certId = String(n.certificate_id || n.cert_id || n.id || '').trim().toUpperCase();
      const name   = String(n.student_name   || n.name   || '').trim();
      const domain = String(n.domain || n.internship_domain || '').trim();
      const start  = n.start_date || n.from_date || n.start || '';
      const end    = n.end_date   || n.to_date   || n.end   || '';
      const email  = String(n.email    || '').trim();
      const dur    = String(n.duration || '').trim();
      const grade  = String(n.grade    || 'Excellent').trim();

      if (!certId || !name || !domain || !start || !end) {
        errors.push(`Row ${i + 2}: Missing required field — need certificate_id, student_name, domain, start_date, end_date`);
        continue;
      }

      const ps = parseDate(start);
      const pe = parseDate(end);

      if (!ps || !pe) {
        errors.push(`Row ${i + 2}: Cannot parse dates for "${certId}". Use YYYY-MM-DD or DD/MM/YYYY`);
        continue;
      }

      try {
        await query(
          `INSERT INTO certificates
             (certificate_id, student_name, email, domain, start_date, end_date, duration, grade, batch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             student_name = VALUES(student_name),
             email        = VALUES(email),
             domain       = VALUES(domain),
             start_date   = VALUES(start_date),
             end_date     = VALUES(end_date),
             duration     = VALUES(duration),
             grade        = VALUES(grade),
             updated_at   = NOW()`,
          [certId, name, email, domain, ps, pe, dur, grade, batchId]
        );
        successCount++;
      } catch (dbErr) {
        errors.push(`Row ${i + 2} (${certId}): DB error — ${dbErr.message}`);
      }
    }

    // Update batch
    await query(
      "UPDATE upload_batches SET success_count=?, error_count=?, status='completed', errors=? WHERE id=?",
      [successCount, errors.length, JSON.stringify(errors), batchId]
    );

    return res.status(200).json({
      success: true,
      message: `Upload complete: ${successCount} inserted, ${errors.length} failed`,
      successCount,
      errorCount: errors.length,
      total: rows.length,
      errors: errors.slice(0, 25),
      batchId,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Processing failed: ' + err.message });
  } finally {
    // Always clean up temp file
    if (filePath) { try { fs.unlinkSync(filePath); } catch (_) {} }
  }
}

export default withAuth(handler);