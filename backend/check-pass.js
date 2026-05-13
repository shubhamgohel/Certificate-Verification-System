
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPass() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amdox_certificates'
    });
    const [rows] = await conn.query('SELECT email, password FROM admins');
    console.log(rows);
    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}
checkPass();
