
const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('Successfully connected to MySQL server');
    await conn.query('CREATE DATABASE IF NOT EXISTS amdox_certificates');
    console.log('Database created/verified');
    await conn.changeUser({ database: 'amdox_certificates' });
    
    // Create admins table if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)  NOT NULL,
        email      VARCHAR(150)  NOT NULL UNIQUE,
        password   VARCHAR(255)  NOT NULL,
        role       ENUM('superadmin','admin') DEFAULT 'admin',
        is_active  TINYINT(1) DEFAULT 1,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Admins table verified');
    
    // Ensure admin user exists with correct password
    const bcrypt = require('bcryptjs');
    const defaultPassword = 'admin123';
    const hash = await bcrypt.hash(defaultPassword, 10);

    // Verify hash before saving (guard against bcrypt issues)
    const verified = await bcrypt.compare(defaultPassword, hash);
    if (!verified) {
      console.error('FATAL: bcrypt hash verification failed!');
      process.exit(1);
    }

    // Ensure primary admin exists
    const primaryEmail = 'shubhamsinhgohel@gmail.com';
    const [rows] = await conn.query('SELECT * FROM admins WHERE email = ?', [primaryEmail]);
    if (rows.length === 0) {
      await conn.query(
        'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Shubham', primaryEmail, hash, 'superadmin']
      );
      console.log('Created admin user: ' + primaryEmail + ' / ' + defaultPassword);
    }

    // Reset password for ALL admin accounts so login always works
    const [updated] = await conn.query('UPDATE admins SET password = ?', [hash]);
    console.log(`Password refreshed for ${updated.affectedRows} admin account(s) — password: ${defaultPassword}`);
    
    await conn.end();
  } catch (err) {
    console.error('DB Test Error:', err);
  }
}

test();
