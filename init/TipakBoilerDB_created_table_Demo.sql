-- 1) Database
CREATE DATABASE IF NOT EXISTS TipakBoilerDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2) Table (create if not exists)
CREATE TABLE IF NOT EXISTS TipakBoilerDB.Sensors (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `SV1` DECIMAL(5,2) NULL,
  `PT1` DECIMAL(5,2) NULL,
  `Temp1` DECIMAL(6,2) NULL,
  `Meter1` DECIMAL(10,2) NULL,
  `Meter2` DECIMAL(10,2) NULL,
  `Meter3` DECIMAL(10,2) NULL,
  `Meter4` DECIMAL(10,2) NULL,
  `Meter5` DECIMAL(10,2) NULL,
  `record_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- สร้างตาราง users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
-- เพิ่มข้อมูลทดสอบ (password คือ "password123" ที่ถูก hash แล้ว)
INSERT INTO users (username, email, full_name, password, role, status) VALUES
('admin', 'admin@tipak.com', 'Super Admin', '$2b$10$AUuHjSSi1rwwKYXZFwSnC.x/8Xzj0JM155TWjzO6mr517eI0xOTVy', 'admin', 'active'),
('john.doe', 'john@tipak.com', 'John Doe', '$2b$10$AUuHjSSi1rwwKYXZFwSnC.x/8Xzj0JM155TWjzO6mr517eI0xOTVy', 'member', 'active'),
('jane.smith', 'jane@tipak.com', 'Jane Smith', '$2b$10$AUuHjSSi1rwwKYXZFwSnC.x/8Xzj0JM155TWjzO6mr517eI0xOTVy', 'member', 'active');


-- ถ้าตารางมีอยู่แล้ว ใช้คำสั่งนี้เพื่อเพิ่ม column role
-- ALTER TABLE users ADD COLUMN role ENUM('admin', 'user') DEFAULT 'user' NOT NULL;

-- 3) Single-column indexes (drop-if-exists, then create)
DROP INDEX IF EXISTS idx_time ON TipakBoilerDB.Sensors;
CREATE INDEX idx_time ON TipakBoilerDB.Sensors (`record_time`);

DROP INDEX IF EXISTS idx_sv1 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_sv1 ON TipakBoilerDB.Sensors (`SV1`);

DROP INDEX IF EXISTS idx_pt1 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_pt1 ON TipakBoilerDB.Sensors (`PT1`);

DROP INDEX IF EXISTS idx_temp1 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_temp1 ON TipakBoilerDB.Sensors (`Temp1`);

DROP INDEX IF EXISTS idx_meter1 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_meter1 ON TipakBoilerDB.Sensors (`Meter1`);

DROP INDEX IF EXISTS idx_meter2 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_meter2 ON TipakBoilerDB.Sensors (`Meter2`);

DROP INDEX IF EXISTS idx_meter3 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_meter3 ON TipakBoilerDB.Sensors (`Meter3`);

DROP INDEX IF EXISTS idx_meter4 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_meter4 ON TipakBoilerDB.Sensors (`Meter4`);

DROP INDEX IF EXISTS idx_meter5 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_meter5 ON TipakBoilerDB.Sensors (`Meter5`);

-- 4) Composite indexes for common time-window queries
DROP INDEX IF EXISTS idx_time_pt1 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_time_pt1 ON TipakBoilerDB.Sensors (`record_time`, `PT1`);

DROP INDEX IF EXISTS idx_time_meter1 ON TipakBoilerDB.Sensors;
CREATE INDEX idx_time_meter1 ON TipakBoilerDB.Sensors (`record_time`, `Meter1`);

-- 5) User + Grants
CREATE USER IF NOT EXISTS 'tipakvbox'@'192.168.250.99' IDENTIFIED BY 'BoilerSensors!23';
GRANT INSERT, SELECT ON TipakBoilerDB.* TO 'tipakvbox'@'192.168.250.99';
FLUSH PRIVILEGES;
