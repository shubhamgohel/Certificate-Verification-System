
const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amdox_certificates'
    });
    const [rows] = await conn.query('SELECT * FROM admins');
    console.log('Admins list count:', rows.length);
    rows.forEach(row => {
      console.log(`- ID: ${row.id}, Email: ${row.email}, Role: ${row.role}`);
    });
    await conn.end();
  } catch (err) {
    console.error('Check Error:', err);
  }
}
check();
