-- AgroAI Database Schema
-- Run this script to create the MySQL database and tables

CREATE DATABASE IF NOT EXISTS agroai_db;
USE agroai_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email_preferences JSON DEFAULT '{"registration": true, "weekly_digest": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Crops table
CREATE TABLE IF NOT EXISTS crops (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    planted_date DATE NOT NULL,
    image_url VARCHAR(500),
    image_name VARCHAR(255),
    image_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

-- AI Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(36) PRIMARY KEY,
    crop_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500),
    image_name VARCHAR(255),
    confidence INT NOT NULL,
    health VARCHAR(50) NOT NULL,
    disease VARCHAR(100),
    recommendation TEXT,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_time VARCHAR(20),
    ai_model VARCHAR(100) DEFAULT 'hackclub-ai',
    raw_response JSON,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_crop_id (crop_id),
    INDEX idx_user_id (user_id),
    INDEX idx_health (health),
    INDEX idx_analysis_date (analysis_date)
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) DEFAULT 'New Conversation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_created_at (created_at)
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    email_type ENUM('registration', 'weekly_digest', 'analysis_complete', 'custom') NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_email_type (email_type),
    INDEX idx_sent_at (sent_at),
    INDEX idx_status (status)
);

-- Insert some demo data (optional)
INSERT INTO users (id, username, email, password, created_at) VALUES 
('demo-user-1', 'Demo User', 'demo@agroai.com', '$2a$10$hCFY/o.dXj/mCA7HNe6KxeWOIefdQ36KUrDUP6YsF4AQneQLjcxMm', NOW())
ON DUPLICATE KEY UPDATE username=username;

SHOW TABLES;
DESCRIBE users;
DESCRIBE crops;
DESCRIBE analyses;
DESCRIBE chat_conversations;
DESCRIBE chat_messages;
DESCRIBE email_logs;