const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, 'data', 'agroai.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeTables();
    }
});

// Initialize tables
function initializeTables() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        location TEXT,
        farm_size REAL,
        crop_types TEXT,
        email_notifications_enabled BOOLEAN DEFAULT 1,
        weekly_digest_enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Crops table
    db.run(`CREATE TABLE IF NOT EXISTS crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image_filename TEXT NOT NULL,
        crop_type TEXT,
        location TEXT,
        planting_date DATE,
        growth_stage TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Analyses table
    db.run(`CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        ai_analysis TEXT NOT NULL,
        health_score INTEGER,
        recommendations TEXT,
        issues_detected TEXT,
        confidence_score REAL,
        analysis_model TEXT DEFAULT 'hackclub-ai',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Chat conversations table
    db.run(`CREATE TABLE IF NOT EXISTS chat_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT DEFAULT 'New Conversation',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Chat messages table
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message_type TEXT CHECK(message_type IN ('user', 'ai')) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Email logs table
    db.run(`CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    console.log('✅ SQLite tables initialized successfully');
}

// Helper function to run queries with promises
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

// Helper function to get single row
function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Helper function to get all rows
function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// User Database Operations
const UserDB = {
    // Create a new user
    async create(userData) {
        const sql = `INSERT INTO users (email, password_hash, full_name, phone, location, farm_size, crop_types)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            userData.email,
            userData.password_hash,
            userData.full_name,
            userData.phone || null,
            userData.location || null,
            userData.farm_size || null,
            userData.crop_types || null
        ];
        
        try {
            const result = await runQuery(sql, params);
            return { id: result.id, ...userData };
        } catch (error) {
            throw error;
        }
    },

    // Find user by email
    async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        return await getQuery(sql, [email]);
    },

    // Find user by ID
    async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        return await getQuery(sql, [id]);
    },

    // Find all users
    async findAll() {
        const sql = 'SELECT * FROM users ORDER BY created_at DESC';
        return await allQuery(sql);
    },

    // Update user
    async update(id, userData) {
        const fields = [];
        const params = [];
        
        Object.keys(userData).forEach(key => {
            if (userData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                params.push(userData[key]);
            }
        });
        
        if (fields.length === 0) return;
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);
        
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        return await runQuery(sql, params);
    }
};

// Crop Database Operations
const CropDB = {
    // Create a new crop record
    async create(cropData) {
        const sql = `INSERT INTO crops (user_id, image_filename, crop_type, location, planting_date, growth_stage, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            cropData.user_id,
            cropData.image_filename,
            cropData.crop_type || null,
            cropData.location || null,
            cropData.planting_date || null,
            cropData.growth_stage || null,
            cropData.notes || null
        ];
        
        const result = await runQuery(sql, params);
        return { id: result.id, ...cropData };
    },

    // Find crops by user ID
    async findByUserId(userId) {
        const sql = `SELECT c.*, 
                            COUNT(a.id) as analysis_count,
                            MAX(a.created_at) as last_analysis_date
                     FROM crops c 
                     LEFT JOIN analyses a ON c.id = a.crop_id 
                     WHERE c.user_id = ? 
                     GROUP BY c.id 
                     ORDER BY c.created_at DESC`;
        return await allQuery(sql, [userId]);
    },

    // Find crop by ID
    async findById(id) {
        const sql = 'SELECT * FROM crops WHERE id = ?';
        return await getQuery(sql, [id]);
    },

    // Update crop
    async update(id, cropData) {
        const fields = [];
        const params = [];
        
        Object.keys(cropData).forEach(key => {
            if (cropData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                params.push(cropData[key]);
            }
        });
        
        if (fields.length === 0) return;
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);
        
        const sql = `UPDATE crops SET ${fields.join(', ')} WHERE id = ?`;
        return await runQuery(sql, params);
    },

    // Delete crop
    async delete(id) {
        const sql = 'DELETE FROM crops WHERE id = ?';
        return await runQuery(sql, [id]);
    }
};

// Analysis Database Operations
const AnalysisDB = {
    // Create a new analysis
    async create(analysisData) {
        const sql = `INSERT INTO analyses (crop_id, user_id, ai_analysis, health_score, recommendations, issues_detected, confidence_score, analysis_model)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            analysisData.crop_id,
            analysisData.user_id,
            analysisData.ai_analysis,
            analysisData.health_score || null,
            analysisData.recommendations || null,
            analysisData.issues_detected || null,
            analysisData.confidence_score || null,
            analysisData.analysis_model || 'hackclub-ai'
        ];
        
        const result = await runQuery(sql, params);
        return { id: result.id, ...analysisData };
    },

    // Find analyses by crop ID
    async findByCropId(cropId) {
        const sql = 'SELECT * FROM analyses WHERE crop_id = ? ORDER BY created_at DESC';
        return await allQuery(sql, [cropId]);
    },

    // Find analyses by user ID
    async findByUserId(userId) {
        const sql = `SELECT a.*, c.image_filename, c.crop_type 
                     FROM analyses a 
                     JOIN crops c ON a.crop_id = c.id 
                     WHERE a.user_id = ? 
                     ORDER BY a.created_at DESC`;
        return await allQuery(sql, [userId]);
    },

    // Find recent analyses (last 7 days)
    async findRecent(userId) {
        const sql = `SELECT a.*, c.image_filename, c.crop_type 
                     FROM analyses a 
                     JOIN crops c ON a.crop_id = c.id 
                     WHERE a.user_id = ? AND a.created_at >= datetime('now', '-7 days')
                     ORDER BY a.created_at DESC`;
        return await allQuery(sql, [userId]);
    }
};

// Chat Database Operations
const ChatDB = {
    // Create new conversation
    async createConversation(userId, title = 'New Conversation') {
        const sql = 'INSERT INTO chat_conversations (user_id, title) VALUES (?, ?)';
        const result = await runQuery(sql, [userId, title]);
        return { id: result.id, user_id: userId, title, created_at: new Date() };
    },

    // Get user conversations
    async getConversations(userId) {
        const sql = `SELECT c.*, 
                            COUNT(m.id) as message_count,
                            MAX(m.created_at) as last_message_at
                     FROM chat_conversations c 
                     LEFT JOIN chat_messages m ON c.id = m.conversation_id 
                     WHERE c.user_id = ? 
                     GROUP BY c.id 
                     ORDER BY last_message_at DESC, c.created_at DESC`;
        return await allQuery(sql, [userId]);
    },

    // Add message to conversation
    async addMessage(conversationId, userId, messageType, content) {
        const sql = 'INSERT INTO chat_messages (conversation_id, user_id, message_type, content) VALUES (?, ?, ?, ?)';
        const result = await runQuery(sql, [conversationId, userId, messageType, content]);
        
        // Update conversation timestamp
        await runQuery('UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [conversationId]);
        
        return { id: result.id, conversation_id: conversationId, user_id: userId, message_type: messageType, content, created_at: new Date() };
    },

    // Get conversation messages
    async getMessages(conversationId) {
        const sql = 'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC';
        return await allQuery(sql, [conversationId]);
    },

    // Delete conversation
    async deleteConversation(conversationId) {
        const sql = 'DELETE FROM chat_conversations WHERE id = ?';
        return await runQuery(sql, [conversationId]);
    }
};

// Email Log Operations
const EmailLogDB = {
    // Log email sent
    async logEmail(userId, emailType, subject, status = 'sent') {
        const sql = 'INSERT INTO email_logs (user_id, email_type, subject, status) VALUES (?, ?, ?, ?)';
        const result = await runQuery(sql, [userId, emailType, subject, status]);
        return { id: result.id, user_id: userId, email_type: emailType, subject, status, sent_at: new Date() };
    },

    // Update email status
    async updateStatus(emailLogId, status, errorMessage = null) {
        const sql = 'UPDATE email_logs SET status = ? WHERE id = ?';
        return await runQuery(sql, [status, emailLogId]);
    },

    // Get user email history
    async getUserEmailHistory(userId) {
        const sql = 'SELECT * FROM email_logs WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50';
        return await allQuery(sql, [userId]);
    }
};

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

module.exports = {
    db,
    runQuery,
    UserDB,
    CropDB,
    AnalysisDB,
    ChatDB,
    EmailLogDB
};