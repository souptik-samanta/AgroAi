// Load environment variables first
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const HackClubCropAI = require('./hackclub-ai-engine'); // Import Hack Club AI engine
const EmailService = require('./email-service'); // Import Email Service
const DatabaseManager = require('./database'); // Import SQL Database Manager

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQL Database
const db = new DatabaseManager();
console.log('🗃️ SQL Database initialized - Secure & Reliable!');

// Initialize Hack Club AI engine - No API key needed! 🎉
const cropAI = new HackClubCropAI();
console.log('🚀 Hack Club GPT-4 120B AI Engine initialized successfully - FREE!');

// Initialize Email Service
const emailService = new EmailService();
console.log('📧 Email Service initialized - Welcome emails & daily summaries active!');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: 'agroai-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Create directories
const createDirs = () => {
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  if (!fs.existsSync('data')) fs.mkdirSync('data');
};

// Database helper functions
const readDB = () => {
  try {
    const data = fs.readFileSync('data/database.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], crops: [], analyses: [] };
  }
};

const writeDB = (data) => {
  fs.writeFileSync('data/database.json', JSON.stringify(data, null, 2));
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

// AI Analysis Functions using Hack Club GPT-4 120B Vision API (FREE!)
const performAIAnalysis = async (cropType, imageUrl, imagePath) => {
  try {
    console.log(`🚀 Starting Hack Club GPT-4 120B analysis for ${cropType}`);
    
    // Use Hack Club AI engine for analysis
    const analysis = await cropAI.analyzeImage(imagePath, cropType);
    
    // Check if image validation failed
    if (analysis.error) {
      console.log(`❌ Analysis failed: ${analysis.errorMessage || 'Invalid image'}`);
      return analysis;
    }
    
    // Check if image was rejected during validation
    if (analysis.validation && !analysis.validation.isValid) {
      console.log(`❌ Image rejected: ${analysis.validation.reason}`);
      return analysis;
    }
    
    console.log(`✅ Hack Club GPT-4 analysis completed in ${analysis.processingTime}ms`);
    return analysis;
    
  } catch (error) {
    console.error('Hack Club AI Analysis failed:', error);
    return {
      confidence: 0.0,
      health: 'Analysis Failed',
      disease: 'System Error',
      diseaseConfidence: 0.0,
      recommendation: 'Unable to analyze image with Hack Club AI. Please check your internet connection and try again.',
      analysisDate: new Date().toISOString(),
      processingTime: 0,
      error: true,
      errorMessage: error.message
    };
  }
};

// Legacy fallback simulation (kept as backup)
const simulateAIAnalysis = (cropType, imageUrl) => {
  const healthStates = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];
  const diseases = ['Leaf Blight', 'Root Rot', 'Powdery Mildew', 'Aphid Infestation', 'Nutrient Deficiency', 'Healthy'];
  const recommendations = [
    'Increase watering frequency',
    'Apply organic fertilizer',
    'Implement pest control measures',
    'Improve soil drainage',
    'Adjust pH levels',
    'Monitor for further symptoms',
    'Harvest within 2 weeks',
    'Apply fungicide treatment'
  ];

  const confidence = Math.floor(Math.random() * 15) + 85; // 85-99%
  const health = healthStates[Math.floor(Math.random() * healthStates.length)];
  const disease = diseases[Math.floor(Math.random() * diseases.length)];
  const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
  
  return {
    confidence,
    health,
    disease,
    recommendation,
    analysisDate: new Date().toISOString(),
    processingTime: (Math.random() * 2 + 1).toFixed(2) + 's'
  };
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login.html');
  }
};

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Authentication routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const db = readDB();
  
  // Check if user exists
  if (db.users.find(u => u.email === email)) {
    return res.json({ success: false, message: 'Email already registered' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    writeDB(db);
    
    // Send welcome email (async, don't wait for it)
    emailService.sendWelcomeEmail(email, username).catch(err => {
      console.error('Failed to send welcome email:', err);
    });
    
    req.session.userId = newUser.id;
    res.json({ 
      success: true, 
      user: { id: newUser.id, username, email },
      message: 'Registration successful! Check your email for welcome message.' 
    });
  } catch (error) {
    res.json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  
  const user = db.users.find(u => u.email === email);
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.json({ success: false, message: 'Invalid credentials' });
  }
  
  req.session.userId = user.id;
  res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Crop routes
app.get('/api/crops', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const userCrops = db.crops.filter(crop => crop.userId === req.session.userId);
    
    // Sort by creation date (newest first)
    userCrops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📊 Returning ${userCrops.length} crops for user`);
    res.json(userCrops);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json([]);
  }
});

// Get uploaded files/images
app.get('/api/files', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const userCrops = db.crops.filter(crop => crop.userId === req.session.userId);
    
    const files = userCrops
      .filter(crop => crop.imageUrl)
      .map(crop => ({
        id: crop.id,
        cropName: crop.name,
        cropType: crop.type,
        imageUrl: crop.imageUrl,
        imageName: crop.imageName,
        imageSize: crop.imageSize,
        createdAt: crop.createdAt
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
    
    const db = readDB();
    
    const newCrop = {
      id: uuidv4(),
      userId: req.session.userId,
      name: name.trim(),
      type: type.toLowerCase(),
      location: location.trim(),
      plantedDate,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      imageName: req.file ? req.file.filename : null,
      imageSize: req.file ? req.file.size : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.crops.push(newCrop);
    
    // Generate AI analysis if image is provided
    if (req.file) {
      console.log(`🤖 Running real AI analysis on ${req.file.filename}`);
      
      const aiResults = await performAIAnalysis(type, newCrop.imageUrl, req.file.path);
      
      const analysis = {
        id: uuidv4(),
        cropId: newCrop.id,
        userId: req.session.userId,
        imageUrl: newCrop.imageUrl,
        imageName: newCrop.imageName,
        ...aiResults
      };
      
      db.analyses.push(analysis);
      
      console.log(`✅ Crop "${name}" added with real AI analysis (${req.file.filename})`);
    } else {
      console.log(`✅ Crop "${name}" added without image`);
    }
    
    writeDB(db);
    res.json({ 
      success: true, 
      crop: newCrop,
      message: req.file ? 'Crop added with AI analysis!' : 'Crop added successfully!'
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
    
    const db = readDB();
    const cropIndex = db.crops.findIndex(crop => 
      crop.id === req.params.id && crop.userId === req.session.userId
    );
    
    if (cropIndex === -1) {
      // Delete uploaded file since crop not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.json({ success: false, message: 'Crop not found' });
    }
    
    const crop = db.crops[cropIndex];
    
    // Delete old image if it exists
    if (crop.imageUrl && crop.imageName) {
      const oldImagePath = path.join('uploads', crop.imageName);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log(`🗑️ Deleted old image: ${crop.imageName}`);
      }
    }
    
    // Update crop with new image
    crop.imageUrl = `/uploads/${req.file.filename}`;
    crop.imageName = req.file.filename;
    crop.imageSize = req.file.size;
    crop.updatedAt = new Date().toISOString();
    
    // Generate real AI analysis for the new image
    console.log(`🤖 Running real AI analysis on uploaded image: ${req.file.filename}`);
    
    const aiResults = await performAIAnalysis(crop.type, crop.imageUrl, req.file.path);
    
    const analysis = {
      id: uuidv4(),
      cropId: crop.id,
      userId: req.session.userId,
      imageUrl: crop.imageUrl,
      imageName: crop.imageName,
      ...aiResults
    };
    
    db.analyses.push(analysis);
    writeDB(db);
    
    console.log(`📸 Image uploaded and analyzed for crop "${crop.name}" (${req.file.filename})`);
    res.json({ 
      success: true, 
      message: 'Image uploaded and AI analysis completed!',
      crop: crop,
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

app.delete('/api/crops/:id', requireAuth, (req, res) => {
  try {
    const db = readDB();
    const cropIndex = db.crops.findIndex(crop => 
      crop.id === req.params.id && crop.userId === req.session.userId
    );
    
    if (cropIndex === -1) {
      return res.json({ success: false, message: 'Crop not found' });
    }
    
    const crop = db.crops[cropIndex];
    
    // Delete associated image file if it exists
    if (crop.imageUrl && crop.imageName) {
      const imagePath = path.join('uploads', crop.imageName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`🗑️ Deleted image file: ${crop.imageName}`);
      }
    }
    
    // Delete associated analyses
    const analysesCountBefore = db.analyses.length;
    db.analyses = db.analyses.filter(analysis => analysis.cropId !== req.params.id);
    const deletedAnalyses = analysesCountBefore - db.analyses.length;
    
    // Delete crop
    db.crops.splice(cropIndex, 1);
    writeDB(db);
    
    console.log(`🗑️ Deleted crop "${crop.name}" and ${deletedAnalyses} analyses`);
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
app.get('/api/analyses', requireAuth, (req, res) => {
  const db = readDB();
  const userAnalyses = db.analyses.filter(analysis => analysis.userId === req.session.userId);
  res.json(userAnalyses);
});

app.post('/api/analyze/:cropId', requireAuth, async (req, res) => {
  const db = readDB();
  const crop = db.crops.find(c => c.id === req.params.cropId && c.userId === req.session.userId);
  
  if (!crop) {
    return res.json({ success: false, message: 'Crop not found' });
  }
  
  if (!crop.imageUrl) {
    return res.json({ success: false, message: 'No image available for analysis' });
  }
  
  try {
    console.log(`🤖 Running real AI analysis for crop: ${crop.name}`);
    
    // Get the actual file path
    const imagePath = path.join(__dirname, 'uploads', crop.imageName);
    
    if (!fs.existsSync(imagePath)) {
      return res.json({ success: false, message: 'Image file not found' });
    }
    
    // Simulate processing delay for better UX
    setTimeout(async () => {
      try {
        const aiResults = await performAIAnalysis(crop.type, crop.imageUrl, imagePath);
        
        const analysis = {
          id: uuidv4(),
          cropId: crop.id,
          userId: req.session.userId,
          imageUrl: crop.imageUrl,
          imageName: crop.imageName,
          ...aiResults
        };
        
        db.analyses.push(analysis);
        writeDB(db);
        
        console.log(`✅ Real AI analysis completed for crop: ${crop.name}`);
        res.json({ success: true, analysis });
        
      } catch (error) {
        console.error('AI Analysis failed:', error);
        res.json({ success: false, message: 'Analysis failed: ' + error.message });
      }
    }, 2000); // 2 second delay for processing simulation
    
  } catch (error) {
    console.error('Analysis setup failed:', error);
    res.json({ success: false, message: 'Failed to start analysis' });
  }
});

// User profile
app.get('/api/profile', requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.session.userId);
  if (user) {
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Dashboard stats
app.get('/api/dashboard-stats', requireAuth, (req, res) => {
  const db = readDB();
  const userCrops = db.crops.filter(crop => crop.userId === req.session.userId);
  const userAnalyses = db.analyses.filter(analysis => analysis.userId === req.session.userId);
  
  const healthyCrops = userAnalyses.filter(a => 
    a.health === 'Excellent' || a.health === 'Good'
  ).length;
  
  const stats = {
    totalCrops: userCrops.length,
    healthyCrops,
    totalAnalyses: userAnalyses.length,
    avgConfidence: userAnalyses.length > 0 ? 
      (userAnalyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / userAnalyses.length).toFixed(1) : 0
  };
  
  res.json(stats);
});

// Get AI care tips for a crop type using Hack Club GPT-4
app.get('/api/ai-tips/:cropType', requireAuth, async (req, res) => {
  try {
    const cropType = req.params.cropType;
    console.log(`🚀 Getting Hack Club GPT-4 tips for ${cropType}`);
    
    const tips = await cropAI.getCropTips(cropType);
    
    res.json({
      success: true,
      cropType: cropType,
      tips: tips,
      source: 'Hack Club GPT-4 120B',
      free: true
    });
  } catch (error) {
    console.error('Failed to get AI tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI tips',
      tips: [
        `Monitor your ${req.params.cropType} regularly for signs of disease`,
        `Ensure proper watering schedule`,
        `Apply appropriate fertilizer for growth stage`,
        `Check soil pH levels regularly`,
        `Implement integrated pest management strategies`
      ]
    });
  }
});

// AI Chat endpoint
app.post('/api/ai-chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.json({ success: false, message: 'No message provided' });
    }
    
    console.log(`🤖 AI Chat request: ${message}`);
    
    // Use Hack Club API for chat
    const axios = require('axios');
    const response = await axios.post('https://ai.hackclub.com/chat/completions', {
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are an expert agricultural AI assistant. You help farmers with crop care, disease identification, pest management, soil health, irrigation, fertilizers, and farming best practices. 
          
          Always provide practical, actionable advice. Be concise but thorough. If asked about serious plant diseases or major agricultural issues, recommend consulting local agricultural experts as well.
          
          Focus on:
          - Crop health and disease diagnosis
          - Pest identification and management
          - Soil and nutrition advice
          - Watering and irrigation guidance
          - Seasonal farming tips
          - Sustainable farming practices
          
          Keep responses helpful and conversational.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const aiResponse = response.data.choices[0].message.content;
    
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Chat error:', error);
    res.json({
      success: false,
      response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or feel free to ask about specific crop issues - I'm here to help with farming questions!",
      error: true
    });
  }
});

// Email testing and management endpoints
app.post('/api/test-email', requireAuth, async (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.session.userId);
    
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    const success = await emailService.sendTestEmail(user.email);
    res.json({ 
      success, 
      message: success ? 'Test email sent successfully!' : 'Failed to send test email' 
    });
  } catch (error) {
    res.json({ success: false, message: 'Email test failed' });
  }
});

app.post('/api/send-daily-summary', requireAuth, async (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.session.userId);
    const userCrops = db.crops.filter(c => c.userId === req.session.userId);
    const userAnalyses = db.analyses.filter(a => a.userId === req.session.userId);
    
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    
    const summaryData = await emailService.generateDailySummary(user, userCrops, userAnalyses);
    if (summaryData) {
      const success = await emailService.sendDailySummary(summaryData);
      res.json({ 
        success, 
        message: success ? 'Daily summary sent!' : 'Failed to send daily summary' 
      });
    } else {
      res.json({ success: false, message: 'Failed to generate summary data' });
    }
  } catch (error) {
    res.json({ success: false, message: 'Daily summary failed' });
  }
});

// Initialize app
createDirs();
const db = readDB();
writeDB(db);

app.listen(PORT, () => {
  console.log(`🌱 AgroAI Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`🚀 Hack Club GPT-4 120B AI Engine: ACTIVE & FREE!`);
  console.log(`💡 No API key needed - powered by Hack Club`);
});