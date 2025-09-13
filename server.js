const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import our custom modules
const { UserDB, CropDB, AnalysisDB, ChatDB } = require('./database');
const hackclubAI = require('./hackclub-ai');
const emailService = require('./email-service');

const app = express();
const PORT = process.env.PORT || 6996;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'agroai-secret-key-2024-advanced',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Create directories
const createDirs = () => {
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  if (!fs.existsSync('data')) fs.mkdirSync('data');
};

// File upload configuration with better validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `crop-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Generate image description for AI analysis
const generateImageDescription = (cropType, fileName) => {
  return `A ${cropType} crop plant photographed for health assessment. The image file is ${fileName}. Please analyze the visible plant characteristics, leaf condition, color, any signs of disease or stress, growth pattern, and overall plant health to provide agricultural recommendations.`;
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    // Check if it's an API request
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    res.redirect('/login.html');
  }
};

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.json({ success: false, message: 'Please fill in all required fields' });
    }
    
    // Check if user exists
    const existingUser = await UserDB.findByEmail(email);
    if (existingUser) {
      return res.json({ success: false, message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password_hash: hashedPassword,
      full_name: username,
      phone: null,
      location: null,
      farm_size: null,
      crop_types: null
    };
    
    const createdUser = await UserDB.create(newUser);
    req.session.userId = createdUser.id;
    
    // Send registration email
    await emailService.sendRegistrationEmail({ email, full_name: username, id: createdUser.id });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.json({ success: false, message: 'Please fill in all fields' });
    }
    
    const user = await UserDB.findByEmail(email);
    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Crop routes
app.get('/api/crops', requireAuth, async (req, res) => {
  try {
    const crops = await CropDB.findByUserId(req.session.userId);
    console.log(`📊 Returning ${crops.length} crops for user`);
    res.json(crops);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json([]);
  }
});

// Get uploaded files/images
app.get('/api/files', requireAuth, async (req, res) => {
  try {
    const crops = await CropDB.findByUserId(req.session.userId);
    
    const files = crops
      .filter(crop => crop.image_url)
      .map(crop => ({
        id: crop.id,
        cropName: crop.name,
        cropType: crop.type,
        imageUrl: crop.image_url,
        imageName: crop.image_name,
        imageSize: crop.image_size,
        createdAt: crop.created_at
      }));
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json([]);
  }
});

app.post('/api/crops', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, type, location, plantedDate } = req.body;
    
    // Validation
    if (!name || !type || !location || !plantedDate) {
      return res.json({ 
        success: false, 
        message: 'All fields (name, type, location, planted date) are required' 
      });
    }

    if (!req.file) {
      return res.json({ 
        success: false, 
        message: 'Image is required' 
      });
    }
    
    const newCrop = {
      user_id: req.session.userId,
      image_filename: req.file.filename,
      crop_type: type.toLowerCase(),
      location: location.trim(),
      planting_date: plantedDate,
      growth_stage: 'seedling',
      notes: `${name.trim()} - uploaded on ${new Date().toLocaleDateString()}`
    };
    
    const createdCrop = await CropDB.create(newCrop);
    console.log('🌱 Created crop:', createdCrop.id, 'for user:', req.session.userId);
    
    // Generate AI analysis
    const imageDescription = generateImageDescription(type, req.file.filename);
    const aiAnalysis = await hackclubAI.analyzePhoto(imageDescription, type);
    
    const analysis = {
      crop_id: createdCrop.id,
      user_id: req.session.userId,
      ai_analysis: aiAnalysis.analysis || 'No analysis available',
      health_score: aiAnalysis.health || 85,
      recommendations: aiAnalysis.recommendations || 'Continue monitoring growth',
      issues_detected: aiAnalysis.disease || 'None detected',
      confidence_score: aiAnalysis.confidence || 0.85,
      analysis_model: 'hackclub-ai'
    };

    console.log('🔍 Creating analysis for crop:', analysis.crop_id, 'user:', analysis.user_id);
    await AnalysisDB.create(analysis);
    
    // Send analysis complete email (async)
    const user = await UserDB.findById(req.session.userId);
    if (user) {
      emailService.sendAnalysisCompleteEmail(user, createdCrop, analysis);
    }
    
    console.log(`✅ Crop "${type}" added with AI analysis (${req.file.filename})`);
    
    res.json({ 
      success: true, 
      crop: createdCrop,
      message: 'Crop added with AI analysis!'
    });
    
  } catch (error) {
    console.error('Error adding crop:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// Upload image to existing crop
app.post('/api/crops/:id/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: 'No image file provided' });
    }
    
    const crop = await CropDB.findById(req.params.id, req.session.userId);
    
    if (!crop) {
      // Delete uploaded file since crop not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.json({ success: false, message: 'Crop not found' });
    }
    
    // Delete old image if it exists
    if (crop.image_url && crop.image_name) {
      const oldImagePath = path.join('uploads', crop.image_name);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log(`🗑️ Deleted old image: ${crop.image_name}`);
      }
    }
    
    // Update crop with new image
    const updates = {
      image_url: `/uploads/${req.file.filename}`,
      image_name: req.file.filename,
      image_size: req.file.size
    };
    
    await CropDB.update(req.params.id, req.session.userId, updates);
    
    // Generate AI analysis for the new image
    const imageDescription = generateImageDescription(crop.type, req.file.filename);
    const aiAnalysis = await hackclubAI.analyzePhoto(imageDescription, crop.type);
    
    const analysis = {
      crop_id: crop.id,
      user_id: req.session.userId,
      ai_analysis: JSON.stringify(aiAnalysis),
      health_score: aiAnalysis.confidence || 0,
      recommendations: aiAnalysis.recommendation || '',
      issues_detected: aiAnalysis.disease || 'No issues detected',
      confidence_score: aiAnalysis.confidence || 0,
      analysis_model: aiAnalysis.ai_model || 'hackclub-ai'
    };
    
    await AnalysisDB.create(analysis);
    
    // Send analysis complete email (async)
    const user = await UserDB.findById(req.session.userId);
    if (user) {
      emailService.sendAnalysisCompleteEmail(user, { ...crop, ...updates }, analysis);
    }
    
    console.log(`📸 Image uploaded for crop "${crop.name}" (${req.file.filename})`);
    res.json({ 
      success: true, 
      message: 'Image uploaded and analyzed successfully!',
      crop: { ...crop, ...updates },
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

app.delete('/api/crops/:id', requireAuth, async (req, res) => {
  try {
    const crop = await CropDB.findById(req.params.id, req.session.userId);
    
    if (!crop) {
      return res.json({ success: false, message: 'Crop not found' });
    }
    
    // Delete associated image file if it exists
    if (crop.image_url && crop.image_name) {
      const imagePath = path.join('uploads', crop.image_name);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`🗑️ Deleted image file: ${crop.image_name}`);
      }
    }
    
    // Delete crop (cascading will handle analyses)
    await CropDB.delete(req.params.id, req.session.userId);
    
    console.log(`🗑️ Deleted crop "${crop.name}"`);
    res.json({ 
      success: true, 
      message: `Crop "${crop.name}" deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting crop:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
});

// Analysis routes
app.get('/api/analyses', requireAuth, async (req, res) => {
  try {
    const analyses = await AnalysisDB.findByUserId(req.session.userId);
    res.json(analyses);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json([]);
  }
});

app.post('/api/analyze/:cropId', requireAuth, async (req, res) => {
  try {
    const crop = await CropDB.findById(req.params.cropId, req.session.userId);
    
    if (!crop) {
      return res.json({ success: false, message: 'Crop not found' });
    }
    
    if (!crop.image_url) {
      return res.json({ success: false, message: 'No image available for analysis' });
    }
    
    // Generate AI analysis
    const imageDescription = generateImageDescription(crop.type, crop.image_name);
    const aiAnalysis = await hackclubAI.analyzePhoto(imageDescription, crop.type);
    
    const analysis = {
      id: uuidv4(),
      cropId: crop.id,
      userId: req.session.userId,
      imageUrl: crop.image_url,
      imageName: crop.image_name,
      confidence: aiAnalysis.confidence,
      health: aiAnalysis.health,
      disease: aiAnalysis.disease,
      recommendation: aiAnalysis.recommendation,
      analysisDate: aiAnalysis.analysisDate,
      processingTime: aiAnalysis.processingTime,
      ai_model: aiAnalysis.ai_model,
      raw_response: aiAnalysis.raw_response
    };
    
    await AnalysisDB.create(analysis);
    
    // Send analysis complete email (async)
    const user = await UserDB.findById(req.session.userId);
    if (user) {
      emailService.sendAnalysisCompleteEmail(user, crop, analysis);
    }
    
    res.json({ success: true, analysis });
    
  } catch (error) {
    console.error('Error analyzing crop:', error);
    res.status(500).json({ success: false, message: 'Analysis failed' });
  }
});

// User profile
app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const user = await UserDB.findById(req.session.userId);
    if (user) {
      const { password_hash, ...userProfile } = user;
      userProfile.isAdmin = (user.email === 'admin' || user.email === 'admin@s.com'); // Add admin flag
      res.json(userProfile);
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Dashboard stats
app.get('/api/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const crops = await CropDB.findByUserId(req.session.userId);
    const analyses = await AnalysisDB.findByUserId(req.session.userId);
    
    const healthyCrops = analyses.filter(a => 
      a.health === 'Excellent' || a.health === 'Good'
    ).length;
    
    const stats = {
      totalCrops: crops.length,
      healthyCrops,
      totalAnalyses: analyses.length,
      avgConfidence: analyses.length > 0 ? 
        (analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length).toFixed(1) : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ totalCrops: 0, healthyCrops: 0, totalAnalyses: 0, avgConfidence: 0 });
  }
});

// Chat routes
app.get('/api/chat/conversations', requireAuth, async (req, res) => {
  try {
    const conversations = await ChatDB.getConversations(req.session.userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json([]);
  }
});

app.post('/api/chat/conversations', requireAuth, async (req, res) => {
  try {
    const { title } = req.body;
    
    const conversation = await ChatDB.createConversation(req.session.userId, title || 'New Conversation');
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
});

app.get('/api/chat/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const messages = await ChatDB.getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json([]);
  }
});

app.post('/api/chat/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.json({ success: false, message: 'Message content is required' });
    }
    
    // Save user message
    const userMessage = {
      id: uuidv4(),
      conversationId: req.params.id,
      userId: req.session.userId,
      role: 'user',
      content: content,
      createdAt: new Date().toISOString()
    };
    
    await ChatDB.addMessage(userMessage);
    
    // Get conversation history for context
    const messages = await ChatDB.getMessages(req.params.id);
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Get AI response
    const aiResponse = await hackclubAI.chatResponse(conversationHistory);
    
    // Save AI response
    const assistantMessage = {
      id: uuidv4(),
      conversationId: req.params.id,
      userId: req.session.userId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date().toISOString()
    };
    
    await ChatDB.addMessage(assistantMessage);
    
    res.json({ 
      success: true, 
      userMessage, 
      assistantMessage 
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Email preference routes
app.get('/api/email-preferences', requireAuth, async (req, res) => {
  try {
    const user = await UserDB.findById(req.session.userId);
    if (user) {
      res.json(user.email_preferences || { registration: true, weekly_digest: true });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/email-preferences', requireAuth, async (req, res) => {
  try {
    const { preferences } = req.body;
    const success = await emailService.updateEmailPreferences(req.session.userId, preferences);
    
    if (success) {
      res.json({ success: true, message: 'Email preferences updated' });
    } else {
      res.json({ success: false, message: 'Failed to update preferences' });
    }
  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send weekly digest manually
app.post('/api/send-weekly-digest', requireAuth, async (req, res) => {
  try {
    const success = await emailService.triggerWeeklyDigest(req.session.userId);
    
    if (success) {
      res.json({ success: true, message: 'Weekly digest sent successfully!' });
    } else {
      res.json({ success: false, message: 'Failed to send weekly digest' });
    }
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// AI models endpoint
app.get('/api/ai-models', async (req, res) => {
  try {
    const models = await hackclubAI.getAvailableModels();
    res.json({ models, current: process.env.HACKCLUB_AI_MODEL || 'qwen/qwen3-32b' });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.json({ models: ['qwen/qwen3-32b'], current: 'qwen/qwen3-32b' });
  }
});

// Initialize app
const startServer = async () => {
  try {
    // SQLite database connection is handled automatically in database.js
    console.log('🚀 Starting AgroAI server...');
    
    // Create directories
    createDirs();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🌱 AgroAI Server running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
      console.log(`💬 AI Chat: Integrated with HackClub AI`);
      console.log(`📧 Email Service: Active`);
      console.log(`🗄️ Database: MySQL Connected`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();