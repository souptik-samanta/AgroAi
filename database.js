const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agroai_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// User operations
const UserDB = {
  async create(user) {
    const sql = `INSERT INTO users (id, username, email, password, email_preferences, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const emailPrefs = JSON.stringify(user.email_preferences || {registration: true, weekly_digest: true});
    await query(sql, [user.id, user.username, user.email, user.password, emailPrefs, user.createdAt]);
    return user;
  },

  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const results = await query(sql, [email]);
    if (results.length > 0) {
      const user = results[0];
      user.email_preferences = JSON.parse(user.email_preferences || '{}');
      return user;
    }
    return null;
  },

  async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ?`;
    const results = await query(sql, [id]);
    if (results.length > 0) {
      const user = results[0];
      user.email_preferences = JSON.parse(user.email_preferences || '{}');
      return user;
    }
    return null;
  },

  async updateEmailPreferences(userId, preferences) {
    const sql = `UPDATE users SET email_preferences = ? WHERE id = ?`;
    await query(sql, [JSON.stringify(preferences), userId]);
  },

  async findAll() {
    const sql = `SELECT * FROM users`;
    const results = await query(sql);
    return results.map(user => {
      user.email_preferences = JSON.parse(user.email_preferences || '{}');
      return user;
    });
  }
};

// Crop operations
const CropDB = {
  async create(crop) {
    const sql = `INSERT INTO crops (id, user_id, name, type, location, planted_date, 
                 image_url, image_name, image_size, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await query(sql, [crop.id, crop.userId, crop.name, crop.type, crop.location, 
                     crop.plantedDate, crop.imageUrl, crop.imageName, crop.imageSize, 
                     crop.createdAt, crop.updatedAt]);
    return crop;
  },

  async findByUserId(userId) {
    const sql = `SELECT * FROM crops WHERE user_id = ? ORDER BY created_at DESC`;
    return await query(sql, [userId]);
  },

  async findById(id, userId) {
    const sql = `SELECT * FROM crops WHERE id = ? AND user_id = ?`;
    const results = await query(sql, [id, userId]);
    return results.length > 0 ? results[0] : null;
  },

  async update(id, userId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const sql = `UPDATE crops SET ${fields}, updated_at = NOW() WHERE id = ? AND user_id = ?`;
    await query(sql, [...values, id, userId]);
  },

  async delete(id, userId) {
    const sql = `DELETE FROM crops WHERE id = ? AND user_id = ?`;
    const result = await query(sql, [id, userId]);
    return result.affectedRows > 0;
  }
};

// Analysis operations
const AnalysisDB = {
  async create(analysis) {
    const sql = `INSERT INTO analyses (id, crop_id, user_id, image_url, image_name, 
                 confidence, health, disease, recommendation, analysis_date, 
                 processing_time, ai_model, raw_response) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await query(sql, [analysis.id, analysis.cropId, analysis.userId, analysis.imageUrl, 
                     analysis.imageName, analysis.confidence, analysis.health, 
                     analysis.disease, analysis.recommendation, analysis.analysisDate, 
                     analysis.processingTime, analysis.ai_model || 'hackclub-ai',
                     JSON.stringify(analysis.raw_response || {})]);
    return analysis;
  },

  async findByUserId(userId) {
    const sql = `SELECT * FROM analyses WHERE user_id = ? ORDER BY analysis_date DESC`;
    return await query(sql, [userId]);
  },

  async findByCropId(cropId) {
    const sql = `SELECT * FROM analyses WHERE crop_id = ? ORDER BY analysis_date DESC`;
    return await query(sql, [cropId]);
  }
};

// Chat operations
const ChatDB = {
  async createConversation(conversation) {
    const sql = `INSERT INTO chat_conversations (id, user_id, title, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?)`;
    await query(sql, [conversation.id, conversation.userId, conversation.title, 
                     conversation.createdAt, conversation.updatedAt]);
    return conversation;
  },

  async findConversationsByUserId(userId) {
    const sql = `SELECT * FROM chat_conversations WHERE user_id = ? ORDER BY updated_at DESC`;
    return await query(sql, [userId]);
  },

  async addMessage(message) {
    const sql = `INSERT INTO chat_messages (id, conversation_id, user_id, role, content, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    await query(sql, [message.id, message.conversationId, message.userId, 
                     message.role, message.content, message.createdAt]);
    
    // Update conversation timestamp
    await query(`UPDATE chat_conversations SET updated_at = ? WHERE id = ?`, 
                [message.createdAt, message.conversationId]);
    return message;
  },

  async getMessages(conversationId) {
    const sql = `SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC`;
    return await query(sql, [conversationId]);
  }
};

// Email log operations
const EmailLogDB = {
  async create(emailLog) {
    const sql = `INSERT INTO email_logs (id, user_id, email_type, recipient_email, 
                 subject, sent_at, status, error_message) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await query(sql, [emailLog.id, emailLog.userId, emailLog.emailType, 
                     emailLog.recipientEmail, emailLog.subject, emailLog.sentAt, 
                     emailLog.status, emailLog.errorMessage]);
    return emailLog;
  },

  async updateStatus(id, status, errorMessage = null) {
    const sql = `UPDATE email_logs SET status = ?, error_message = ? WHERE id = ?`;
    await query(sql, [status, errorMessage, id]);
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  UserDB,
  CropDB,
  AnalysisDB,
  ChatDB,
  EmailLogDB
};