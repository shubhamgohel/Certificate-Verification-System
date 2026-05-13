const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amdox_certificates'
    });

    const email = 'shubhamsinhgohel@gmail.com';
    const passwordToTest = 'admin123';

    const [rows] = await conn.query('SELECT * FROM admins WHERE email = ? AND is_active = 1', [email]);
    
    if (rows.length === 0) {
      console.log('ERROR: No admin found with email:', email);
      await conn.end();
      return;
    }

    const admin = rows[0];
    console.log('Found admin:', { id: admin.id, email: admin.email, role: admin.role, is_active: admin.is_active });
    console.log('Stored hash:', admin.password);
    console.log('Hash length:', admin.password.length);

    const match = await bcrypt.compare(passwordToTest, admin.password);
    console.log('Password "admin123" matches:', match);

    if (!match) {
      // Try rehashing and comparing
      const newHash = await bcrypt.hash(passwordToTest, 10);
      console.log('New hash would be:', newHash);
      console.log('Suggestion: Password in DB may have been corrupted or set differently.');
    }

    await conn.end();
  } catch (err) {
    console.error('Test Error:', err);
  }
}
testLogin();
