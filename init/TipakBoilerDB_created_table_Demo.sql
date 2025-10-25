-- 1) Database
CREATE DATABASE IF NOT EXISTS TipakBoilerDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2) Table (create if not exists)
CREATE TABLE IF NOT EXISTS TipakBoilerDB.sensors (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `sv_steam_setpoint` decimal(5,2) DEFAULT NULL,
  `pt_steam_pressure` decimal(5,2) DEFAULT NULL,
  `tc1_stack_temperature` int(4) DEFAULT NULL,
  `mt1_oil_supply_meter` decimal(10,2) DEFAULT NULL,
  `mt2_boiler_feed_meter` decimal(10,2) DEFAULT NULL,
  `mt3_soft_water_meter` decimal(10,2) DEFAULT NULL,
  `mt4_condensate_meter` decimal(10,2) DEFAULT NULL,
  `opt_oil_pressure` decimal(10,2) DEFAULT NULL,
  `record_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- `SV1` DECIMAL(5,2) NULL,
--   `PT1` DECIMAL(5,2) NULL,
--   `Temp1` DECIMAL(6,2) NULL,
--   `Meter1` DECIMAL(10,2) NULL,
--   `Meter2` DECIMAL(10,2) NULL,
--   `Meter3` DECIMAL(10,2) NULL,
--   `Meter4` DECIMAL(10,2) NULL,
--   `Meter5` DECIMAL(10,2) NULL,
--   `record_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
('admin', 'admin@tipak.com', 'Super Admin', '$2b$10$0bqz.i.ROg7kMr/QkmLd1uAqnfARYqKCB6YV79RBJJ5h9CAdMBQ4e', 'admin', 'active'),
('john.doe', 'john@tipak.com', 'John Doe', '$2b$10$0bqz.i.ROg7kMr/QkmLd1uAqnfARYqKCB6YV79RBJJ5h9CAdMBQ4e', 'member', 'active'),
('jane.smith', 'jane@tipak.com', 'Jane Smith', '$2b$10$0bqz.i.ROg7kMr/QkmLd1uAqnfARYqKCB6YV79RBJJ5h9CAdMBQ4e', 'member', 'active');

CREATE TABLE alarms (
  `id` int(10) NOT NULL,
  `name` enum('PLC_BATTER_LOW','STEAM_HIGH_PRESS','BURNER_FAIL','MOTOR_FAIL','STEAM_LOW_PRESS','FLOW_SWITCH_FEED','STEAM_PRESS_EXT','STACK_HIGH_TEMP','BOILER_LOW1','BOILER_EXTRA_LOW2','OIL_PRESS_TRANSM','PRESS_TRANSMIT','EMERGENCY_STOP','ELECTRICAL_FAILURE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `alarm_content` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL COMMENT '0=ปกติ, 1=Alarm',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `ended_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO alarms (`id`, `name`, `alarm_content`, `status`, `created_at`, `ended_at`) VALUES
(1, 'PLC_BATTER_LOW', 'BAT LOW', 0, '2025-10-19 16:03:25', '2025-10-19 16:03:44'),
(2, 'STEAM_HIGH_PRESS', 'HIGH PRESSURE', 0, '2025-10-19 16:06:49', NULL),
(3, 'PLC_BATTER_LOW', 'BATT LOW', 0, '2025-10-19 16:14:54', '2025-10-19 16:28:38'),
(4, 'STACK_HIGH_TEMP', 'STACK TEMP HIGH', 1, '2025-10-19 16:16:13', NULL);