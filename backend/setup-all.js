
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function setup() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    console.log('Connected.');
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await conn.query(sql);
    console.log('Schema imported with sample data.');
    await conn.end();
  } catch (err) {
    console.error('Setup Error:', err);
  }
}
setup();
