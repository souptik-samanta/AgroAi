const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

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

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// AI Simulation Functions
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
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// Auth routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const db = readDB();
  
  // Check if user exists
  if (db.users.find(u => u.email === email)) {
    return res.json({ success: false, message: 'User already exists' });
  }
  
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
  
  req.session.userId = newUser.id;
  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  
  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.json({ success: false, message: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.json({ success: false, message: 'Invalid credentials' });
  }
  
  req.session.userId = user.id;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Crop routes
app.get('/api/crops', requireAuth, (req, res) => {
  const db = readDB();
  const userCrops = db.crops.filter(crop => crop.userId === req.session.userId);
  res.json(userCrops);
});

app.post('/api/crops', requireAuth, upload.single('image'), (req, res) => {
  const { name, type, location, plantedDate } = req.body;
  const db = readDB();
  
  const newCrop = {
    id: uuidv4(),
    userId: req.session.userId,
    name,
    type,
    location,
    plantedDate,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date().toISOString()
  };
  
  db.crops.push(newCrop);
  
  // Generate fake AI analysis
  if (req.file) {
    const analysis = {
      id: uuidv4(),
      cropId: newCrop.id,
      userId: req.session.userId,
      imageUrl: newCrop.imageUrl,
      ...simulateAIAnalysis(type, newCrop.imageUrl)
    };
    db.analyses.push(analysis);
  }
  
  writeDB(db);
  res.json({ success: true, crop: newCrop });
});

app.delete('/api/crops/:id', requireAuth, (req, res) => {
  const db = readDB();
  const cropIndex = db.crops.findIndex(crop => 
    crop.id === req.params.id && crop.userId === req.session.userId
  );
  
  if (cropIndex === -1) {
    return res.json({ success: false, message: 'Crop not found' });
  }
  
  // Delete associated analyses
  db.analyses = db.analyses.filter(analysis => analysis.cropId !== req.params.id);
  
  // Delete crop
  db.crops.splice(cropIndex, 1);
  writeDB(db);
  
  res.json({ success: true });
});

// Analysis routes
app.get('/api/analyses', requireAuth, (req, res) => {
  const db = readDB();
  const userAnalyses = db.analyses.filter(analysis => analysis.userId === req.session.userId);
  res.json(userAnalyses);
});

app.post('/api/analyze/:cropId', requireAuth, (req, res) => {
  const db = readDB();
  const crop = db.crops.find(c => c.id === req.params.cropId && c.userId === req.session.userId);
  
  if (!crop) {
    return res.json({ success: false, message: 'Crop not found' });
  }
  
  // Simulate AI processing delay
  setTimeout(() => {
    const analysis = {
      id: uuidv4(),
      cropId: crop.id,
      userId: req.session.userId,
      imageUrl: crop.imageUrl,
      ...simulateAIAnalysis(crop.type, crop.imageUrl)
    };
    
    db.analyses.push(analysis);
    writeDB(db);
    
    res.json({ success: true, analysis });
  }, 2000);
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
      (userAnalyses.reduce((sum, a) => sum + a.confidence, 0) / userAnalyses.length).toFixed(1) : 0
  };
  
  res.json(stats);
});

// Initialize app
createDirs();
const db = readDB();
writeDB(db);

app.listen(PORT, () => {
  console.log(`🌱 AgroAI Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
});