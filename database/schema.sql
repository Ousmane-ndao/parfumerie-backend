CREATE DATABASE IF NOT EXISTS salaichaparfumeur
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE salaichaparfumeur;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type ENUM('Parfum', 'Diffuseur électrique', 'Appareil Doppler') NOT NULL,
  family ENUM('Floral', 'Boisé', 'Oriental', 'Frais') NULL,
  price INT NOT NULL,
  image VARCHAR(500) NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  notes_top JSON NOT NULL,
  notes_heart JSON NOT NULL,
  notes_base JSON NOT NULL,
  contenance VARCHAR(100) NOT NULL,
  concentration VARCHAR(100) NOT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_featured (featured)
);
