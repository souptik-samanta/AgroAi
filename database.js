// Database initialization and connection management
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'data', 'agroai.db');
        this.db = null;
        this.init();
    }

    // Initialize database connection and create tables
    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database');
                this.createTables();
            }
        });
    }

    // Create all necessary tables
    createTables() {
        const tables = [
            // Users table with secure authentication
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1,
                profile_image TEXT,
                phone TEXT,
                location TEXT
            )`,

            // Crops table for crop management
            `CREATE TABLE IF NOT EXISTS crops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                variety TEXT,
                planting_date DATE,
                area REAL,
                location TEXT,
                status TEXT DEFAULT 'healthy',
                health_score INTEGER DEFAULT 100,
                growth_stage INTEGER DEFAULT 0,
                image_path TEXT,
                soil_moisture REAL,
                temperature REAL,
                last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
                next_watering DATE,
                estimated_harvest DATE,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`,

            // AI Analysis table for storing analysis results
            `CREATE TABLE IF NOT EXISTS ai_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                crop_id INTEGER,
                image_path TEXT NOT NULL,
                analysis_result TEXT NOT NULL,
                confidence_score REAL,
                detected_issues TEXT,
                recommendations TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (crop_id) REFERENCES crops (id) ON DELETE SET NULL
            )`,

            // AI Recommendations table for personalized suggestions
            `CREATE TABLE IF NOT EXISTS ai_recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crop_id INTEGER NOT NULL,
                recommendation_text TEXT NOT NULL,
                priority TEXT DEFAULT 'medium',
                category TEXT,
                is_completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                due_date DATE,
                FOREIGN KEY (crop_id) REFERENCES crops (id) ON DELETE CASCADE
            )`,

            // Sessions table for secure session management
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`,

            // Email logs table for tracking sent emails
            `CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email_type TEXT NOT NULL,
                subject TEXT,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'sent',
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`
        ];

        // Run all table creation queries sequentially
        this.db.serialize(() => {
            tables.forEach((tableSQL) => {
                this.db.run(tableSQL);
            });
            
            console.log('📊 Database tables created successfully');
            // Add a delay before seeding to ensure tables are ready
            setTimeout(() => {
                this.seedSampleData();
            }, 1000);
        });
    }

    // Seed some sample data for testing
    seedSampleData() {
        // Check if we already have users
        this.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (err) {
                console.error('❌ Error checking users:', err);
                return;
            }

            if (row.count === 0) {
                console.log('🌱 Seeding sample data...');
                
                // Create sample user
                const samplePassword = bcrypt.hashSync('demo123', 10);
                this.db.run(`
                    INSERT INTO users (username, email, password_hash, location) 
                    VALUES (?, ?, ?, ?)
                `, ['demo_farmer', 'demo@agroai.com', samplePassword, 'Demo Farm Location'], (err) => {
                    if (err) {
                        console.error('❌ Error creating sample user:', err);
                        return;
                    }
                    
                    // Get the user ID and create sample crops
                    this.db.get("SELECT id FROM users WHERE username = 'demo_farmer'", (err, user) => {
                        if (user) {
                            this.createSampleCrops(user.id);
                        }
                    });
                });
            }
        });
    }

    createSampleCrops(userId) {
        const sampleCrops = [
            {
                name: 'Heritage Tomato Field A',
                type: 'tomato',
                variety: 'Roma',
                planting_date: '2025-06-15',
                area: 3.2,
                location: 'North Field, Section A',
                status: 'healthy',
                health_score: 94,
                growth_stage: 78,
                soil_moisture: 72,
                temperature: 24,
                next_watering: '2025-09-14',
                estimated_harvest: '2025-11-20',
                notes: 'Excellent growth rate, no signs of disease.'
            },
            {
                name: 'Golden Wheat Fields',
                type: 'wheat',
                variety: 'Winter Wheat',
                planting_date: '2025-05-01',
                area: 12.5,
                location: 'South Field, Sections B-D',
                status: 'warning',
                health_score: 76,
                growth_stage: 85,
                soil_moisture: 58,
                temperature: 22,
                next_watering: '2025-09-13',
                estimated_harvest: '2025-10-15',
                notes: 'Moderate drought stress detected.'
            },
            {
                name: 'Sweet Corn Paradise',
                type: 'corn',
                variety: 'Sugar Enhanced',
                planting_date: '2025-04-20',
                area: 5.8,
                location: 'East Field, Section E',
                status: 'healthy',
                health_score: 91,
                growth_stage: 92,
                soil_moisture: 78,
                temperature: 26,
                next_watering: '2025-09-15',
                estimated_harvest: '2025-10-30',
                notes: 'Exceptional growth, approaching tasseling stage.'
            }
        ];

        sampleCrops.forEach(crop => {
            this.db.run(`
                INSERT INTO crops (
                    user_id, name, type, variety, planting_date, area, location, 
                    status, health_score, growth_stage, soil_moisture, temperature,
                    next_watering, estimated_harvest, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, crop.name, crop.type, crop.variety, crop.planting_date,
                crop.area, crop.location, crop.status, crop.health_score,
                crop.growth_stage, crop.soil_moisture, crop.temperature,
                crop.next_watering, crop.estimated_harvest, crop.notes
            ]);
        });

        console.log('🌾 Sample crops created successfully');
    }

    // User authentication methods
    async createUser(username, email, password) {
        return new Promise((resolve, reject) => {
            const passwordHash = bcrypt.hashSync(password, 10);
            this.db.run(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, username, email });
                    }
                }
            );
        });
    }

    async authenticateUser(email, password) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE email = ? AND is_active = 1',
                [email],
                (err, user) => {
                    if (err) {
                        reject(err);
                    } else if (!user) {
                        resolve(null);
                    } else {
                        const isValid = bcrypt.compareSync(password, user.password_hash);
                        if (isValid) {
                            // Update last login
                            this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
                            resolve({
                                id: user.id,
                                username: user.username,
                                email: user.email,
                                created_at: user.created_at,
                                last_login: user.last_login
                            });
                        } else {
                            resolve(null);
                        }
                    }
                }
            );
        });
    }

    // Crop management methods
    async getUserCrops(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM crops WHERE user_id = ? ORDER BY created_at DESC',
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    async createCrop(userId, cropData) {
        return new Promise((resolve, reject) => {
            const {
                name, type, variety, planting_date, area, location,
                soil_moisture, temperature, estimated_harvest, notes
            } = cropData;

            this.db.run(`
                INSERT INTO crops (
                    user_id, name, type, variety, planting_date, area, location,
                    soil_moisture, temperature, estimated_harvest, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, name, type, variety, planting_date, area, location,
                soil_moisture, temperature, estimated_harvest, notes
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...cropData });
                }
            });
        });
    }

    // AI Analysis methods
    async saveAnalysis(userId, analysisData) {
        return new Promise((resolve, reject) => {
            const {
                crop_id, image_path, analysis_result, confidence_score,
                detected_issues, recommendations
            } = analysisData;

            this.db.run(`
                INSERT INTO ai_analyses (
                    user_id, crop_id, image_path, analysis_result, confidence_score,
                    detected_issues, recommendations
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, crop_id, image_path, analysis_result, confidence_score,
                detected_issues, recommendations
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...analysisData });
                }
            });
        });
    }

    async getUserAnalyses(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT a.*, c.name as crop_name, c.type as crop_type
                FROM ai_analyses a
                LEFT JOIN crops c ON a.crop_id = c.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC
            `, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                }
            });
        }
    }
}

module.exports = DatabaseManager;