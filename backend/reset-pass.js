// reset-pass.js — Force reset the admin password
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amdox_certificates'
    });

    const newPassword = 'admin123';
    const hash = await bcrypt.hash(newPassword, 10);

    // Verify hash works BEFORE saving
    const verified = await bcrypt.compare(newPassword, hash);
    console.log('Pre-save verification:', verified);

    if (!verified) {
      console.error('FATAL: bcrypt hash/compare mismatch!');
      process.exit(1);
    }

    // Update ALL admin accounts with the new password
    const [result] = await conn.query('UPDATE admins SET password = ? WHERE email = ?', [hash, 'shubhamsinhgohel@gmail.com']);
    console.log('Updated rows:', result.affectedRows);

    // Verify from DB
    const [rows] = await conn.query('SELECT email, password FROM admins WHERE email = ?', ['shubhamsinhgohel@gmail.com']);
    if (rows.length > 0) {
      const dbVerify = await bcrypt.compare(newPassword, rows[0].password);
      console.log('Post-DB verification:', dbVerify);
      console.log('Login credentials: shubhamsinhgohel@gmail.com / admin123');
    }

    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

resetPassword();
