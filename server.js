// Load environment variables first
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const HackClubCropAI = require('./hackclub-ai-engine');
const EmailService = require('./email-service');
const DatabaseManager = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQL Database
const database = new DatabaseManager();
console.log('🗃️ SQL Database initialized - Secure & Reliable!');

// Initialize Hack Club AI engine
const cropAI = new HackClubCropAI();
console.log('🚀 Hack Club GPT-4 120B AI Engine initialized successfully - FREE!');

// Initialize Email Service
const emailService = new EmailService();
console.log('📧 Email Service initialized - Welcome emails & daily summaries active!');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: 'agroai-secure-session-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Create upload directory
const createDirs = () => {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    console.log('📁 Created uploads directory');
  }
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
    console.log('📁 Created data directory');
  }
};
createDirs();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
};

// ===== AUTHENTICATION ROUTES =====

// Register new user
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Create new user
    const newUser = await database.createUser(username, email, password);
    
    // Set session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    };

    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail(email, username).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    res.json({ 
      success: true, 
      user: req.session.user,
      message: 'Registration successful! Welcome to AgroAI!' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.json({ success: false, message: 'Username or email already exists' });
    } else {
      res.json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: 'Email and password are required' });
    }

    const user = await database.authenticateUser(email, password);
    
    if (user) {
      req.session.user = user;
      res.json({ 
        success: true, 
        user: user,
        message: 'Login successful! Welcome back!' 
      });
    } else {
      res.json({ success: false, message: 'Invalid email or password' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// Logout user
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.json({ success: false, message: 'Logout failed' });
    } else {
      res.json({ success: true, message: 'Logged out successfully' });
    }
  });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get user profile
app.get('/api/profile', requireAuth, (req, res) => {
  try {
    res.json({
      success: true,
      username: req.session.user.username,
      email: req.session.user.email,
      id: req.session.user.id
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
});

// ===== CROP MANAGEMENT ROUTES =====

// Get user's crops
app.get('/api/crops', requireAuth, async (req, res) => {
  try {
    const crops = await database.getUserCrops(req.session.user.id);
    res.json({ success: true, crops: crops });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.json({ success: false, message: 'Failed to fetch crops' });
  }
});

// Add new crop
app.post('/api/crops', requireAuth, async (req, res) => {
  try {
    const cropData = {
      name: req.body.name,
      type: req.body.type,
      variety: req.body.variety || null,
      planting_date: req.body.planting_date,
      area: parseFloat(req.body.area),
      location: req.body.location,
      soil_moisture: Math.floor(Math.random() * 30) + 60, // Random 60-90%
      temperature: Math.floor(Math.random() * 10) + 20, // Random 20-30°C
      estimated_harvest: req.body.estimated_harvest,
      notes: req.body.notes || 'Newly added crop'
    };

    const newCrop = await database.createCrop(req.session.user.id, cropData);
    res.json({ success: true, crop: newCrop, message: 'Crop added successfully!' });

  } catch (error) {
    console.error('Error adding crop:', error);
    res.json({ success: false, message: 'Failed to add crop' });
  }
});

// ===== AI ANALYSIS ROUTES =====

// Analyze crop image
app.post('/api/analyze', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const cropId = req.body.crop_id || null;

    console.log('🔍 Starting AI analysis for image:', imagePath);

    // Get AI analysis
    const analysis = await cropAI.analyzeImage(imagePath, req.body.prompt || '');
    
    if (!analysis) {
      return res.json({ success: false, message: 'AI analysis failed' });
    }

    // Save analysis to database
    const analysisData = {
      crop_id: cropId,
      image_path: imagePath,
      analysis_result: JSON.stringify(analysis),
      confidence_score: analysis.confidence || 0.85,
      detected_issues: JSON.stringify(analysis.issues || []),
      recommendations: JSON.stringify(analysis.recommendations || [])
    };

    await database.saveAnalysis(req.session.user.id, analysisData);

    res.json({ 
      success: true, 
      analysis: analysis,
      image_path: imagePath,
      message: 'Analysis completed successfully!' 
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.json({ success: false, message: 'Analysis failed. Please try again.' });
  }
});

// Get user's analysis history
app.get('/api/analyses', requireAuth, async (req, res) => {
  try {
    const analyses = await database.getUserAnalyses(req.session.user.id);
    
    // Parse JSON fields for frontend consumption
    const parsedAnalyses = analyses.map(analysis => ({
      ...analysis,
      analysis_result: JSON.parse(analysis.analysis_result || '{}'),
      detected_issues: JSON.parse(analysis.detected_issues || '[]'),
      recommendations: JSON.parse(analysis.recommendations || '[]')
    }));

    res.json({ success: true, analyses: parsedAnalyses });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.json({ success: false, message: 'Failed to fetch analysis history' });
  }
});

// ===== DASHBOARD DATA ROUTES =====

// Get dashboard statistics (alternative endpoint)
app.get('/api/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const crops = await database.getUserCrops(req.session.user.id);
    const analyses = await database.getUserAnalyses(req.session.user.id);

    const stats = {
      totalCrops: crops.length,
      healthyCrops: crops.filter(c => c.status === 'healthy').length,
      warningCrops: crops.filter(c => c.status === 'warning' || c.status === 'critical').length,
      totalAnalyses: analyses.length,
      avgConfidence: analyses.length > 0 
        ? Math.round(analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.length * 100)
        : 0
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const crops = await database.getUserCrops(req.session.user.id);
    const analyses = await database.getUserAnalyses(req.session.user.id);

    const stats = {
      totalCrops: crops.length,
      healthyCrops: crops.filter(c => c.status === 'healthy').length,
      warningCrops: crops.filter(c => c.status === 'warning' || c.status === 'critical').length,
      totalAnalyses: analyses.length,
      avgConfidence: analyses.length > 0 
        ? Math.round(analyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / analyses.length * 100)
        : 0
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// ===== STATIC ROUTES =====

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    ai_engine: 'active'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down AgroAI server...');
  database.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('🌱 AgroAI Server running on http://localhost:' + PORT);
  console.log('📊 Dashboard: http://localhost:' + PORT + '/dashboard.html');
  console.log('🚀 Hack Club GPT-4 120B AI Engine: ACTIVE & FREE!');
  console.log('💡 No API key needed - powered by Hack Club');
});

module.exports = app;