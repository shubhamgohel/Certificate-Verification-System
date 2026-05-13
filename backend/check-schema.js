
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amdox_certificates'
    });
    const [columns] = await conn.query('DESCRIBE admins');
    console.log('Admins Table Columns:', columns);
    await conn.end();
  } catch (err) {
    console.error('Check Schema Error:', err);
  }
}
checkSchema();
