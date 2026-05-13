-- =====================================================
-- AMDOX Certificate Verification System
-- MySQL Schema — Run in phpMyAdmin (XAMPP)
-- =====================================================

CREATE DATABASE IF NOT EXISTS amdox_certificates
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE amdox_certificates;

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  role       ENUM('superadmin','admin') DEFAULT 'admin',
  is_active  TINYINT(1) DEFAULT 1,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upload batches
CREATE TABLE IF NOT EXISTS upload_batches (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  filename      VARCHAR(255) NOT NULL,
  total_records INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count   INT DEFAULT 0,
  uploaded_by   INT,
  status        ENUM('processing','completed','failed') DEFAULT 'processing',
  errors        JSON,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  certificate_id VARCHAR(60)  NOT NULL UNIQUE,
  student_name   VARCHAR(150) NOT NULL,
  email          VARCHAR(150),
  domain         VARCHAR(120) NOT NULL,
  start_date     DATE         NOT NULL,
  end_date       DATE         NOT NULL,
  duration       VARCHAR(60),
  grade          VARCHAR(30)  DEFAULT 'Excellent',
  issued_by      VARCHAR(100) DEFAULT 'AMDOX Technologies',
  batch_id       INT,
  is_active      TINYINT(1) DEFAULT 1,
  download_count INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cert   (certificate_id),
  INDEX idx_name   (student_name),
  INDEX idx_domain (domain),
  FOREIGN KEY (batch_id) REFERENCES upload_batches(id) ON DELETE SET NULL
);

-- =====================================================
-- Sample Data (for testing)
-- =====================================================
INSERT INTO certificates (certificate_id,student_name,email,domain,start_date,end_date,duration,grade) VALUES
('AMDOX-2024-0001','Rahul Sharma',   'rahul@example.com',  'Web Development',        '2024-01-15','2024-04-15','3 Months','Excellent'),
('AMDOX-2024-0002','Priya Singh',    'priya@example.com',  'Data Science',           '2024-02-01','2024-05-01','3 Months','Outstanding'),
('AMDOX-2024-0003','Arjun Mehta',    'arjun@example.com',  'Machine Learning',       '2024-03-10','2024-06-10','3 Months','Excellent'),
('AMDOX-2024-0004','Sneha Patel',    'sneha@example.com',  'UI/UX Design',           '2024-01-20','2024-03-20','2 Months','Good'),
('AMDOX-2024-0005','Vikram Joshi',   'vikram@example.com', 'Cybersecurity',          '2024-04-01','2024-07-01','3 Months','Outstanding'),
('AMDOX-2024-0006','Anjali Gupta',   'anjali@example.com', 'Android Development',    '2024-02-15','2024-05-15','3 Months','Excellent'),
('AMDOX-2024-0007','Rohan Kumar',    'rohan@example.com',  'Cloud Computing',        '2024-05-01','2024-08-01','3 Months','Good'),
('AMDOX-2024-0008','Divya Nair',     'divya@example.com',  'Full Stack Development', '2024-03-01','2024-06-30','4 Months','Outstanding');
