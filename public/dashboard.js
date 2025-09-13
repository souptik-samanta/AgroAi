// Dashboard functionality
let currentSection = 'dashboard';
let crops = [];
let analyses = [];
let userProfile = null;

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i> ${message}`;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Navigation
function showSection(section) {
    currentSection = section;
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${section}')"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    // Load section data
    if (section === 'crops') {
        loadCrops();
    } else if (section === 'analyses') {
        loadAnalyses();
    } else if (section === 'dashboard') {
        loadDashboardStats();
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (error) {
        showNotification('Logout failed', 'error');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch('/api/profile');
        if (response.ok) {
            userProfile = await response.json();
            document.getElementById('username').textContent = userProfile.username;
        } else {
            window.location.href = '/login.html';
        }
    } catch (error) {
        window.location.href = '/login.html';
    }
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard-stats');
        const stats = await response.json();
        
        document.getElementById('totalCrops').textContent = stats.totalCrops;
        document.getElementById('healthyCrops').textContent = stats.healthyCrops;
        document.getElementById('totalAnalyses').textContent = stats.totalAnalyses;
        document.getElementById('avgConfidence').textContent = stats.avgConfidence + '%';
        
        // Animate the neural network status messages
        animateAIStatus();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Animate AI status messages
function animateAIStatus() {
    const statusTexts = [
        'Initializing neural network...',
        'Loading trained models...',
        'Calibrating sensors...',
        'Ready for crop analysis!',
        'Processing satellite data...',
        'Analyzing weather patterns...',
        'Optimizing recommendations...'
    ];
    
    const statusElement = document.querySelector('.ai-status-text');
    if (!statusElement) return;
    
    let index = 0;
    setInterval(() => {
        statusElement.textContent = statusTexts[index];
        index = (index + 1) % statusTexts.length;
    }, 3000);
}

// Load crops
async function loadCrops() {
    try {
        const response = await fetch('/api/crops');
        crops = await response.json();
        renderCrops();
    } catch (error) {
        showNotification('Error loading crops', 'error');
    }
}

// Render crops
function renderCrops() {
    const container = document.getElementById('cropsGrid');
    
    if (crops.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-seedling" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3>No crops added yet</h3>
                <p>Add your first crop to start monitoring with AI</p>
                <button onclick="showAddCropModal()" class="btn btn-primary" style="margin-top: 16px;">
                    <i class="fas fa-plus"></i> Add Crop
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = crops.map(crop => `
        <div class="crop-card">
            <div class="crop-image">
                ${crop.imageUrl ? 
                    `<img src="${crop.imageUrl}" alt="${crop.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div style="display: none; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fas fa-image" style="font-size: 2rem;"></i>
                         <span>Image not available</span>
                     </div>` :
                    `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                         <i class="fas fa-seedling" style="font-size: 2rem;"></i>
                         <span>No image</span>
                     </div>`
                }
            </div>
            <div class="crop-info">
                <div class="crop-header">
                    <div>
                        <div class="crop-name">${crop.name}</div>
                        <div class="crop-type">${crop.type}</div>
                    </div>
                    <div class="crop-actions">
                        <button onclick="analyzeCrop('${crop.id}')" class="btn btn-primary btn-sm">
                            <i class="fas fa-microscope"></i> Analyze
                        </button>
                        <button onclick="deleteCrop('${crop.id}')" class="btn btn-secondary btn-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="crop-details">
                    <div class="crop-detail">
                        <strong>Location</strong>
                        ${crop.location}
                    </div>
                    <div class="crop-detail">
                        <strong>Planted</strong>
                        ${new Date(crop.plantedDate).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load analyses
async function loadAnalyses() {
    try {
        const response = await fetch('/api/analyses');
        analyses = await response.json();
        renderAnalyses();
    } catch (error) {
        showNotification('Error loading analyses', 'error');
    }
}

// Render analyses
function renderAnalyses() {
    const container = document.getElementById('analysesContainer');
    
    if (analyses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-microscope" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3>No analyses yet</h3>
                <p>Add crops with images to start AI analysis</p>
            </div>
        `;
        return;
    }
    
    // Sort analyses by date (newest first)
    const sortedAnalyses = analyses.sort((a, b) => new Date(b.analysisDate) - new Date(a.analysisDate));
    
    container.innerHTML = sortedAnalyses.map(analysis => {
        const crop = crops.find(c => c.id === analysis.cropId);
        const confidenceClass = analysis.confidence >= 90 ? 'confidence-high' : 
                              analysis.confidence >= 75 ? 'confidence-medium' : 'confidence-low';
        const healthClass = `health-${analysis.health.toLowerCase()}`;
        
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <div class="analysis-info">
                        <h4>${crop ? crop.name : 'Unknown Crop'} - AI Analysis</h4>
                        <div class="analysis-date">
                            <i class="fas fa-clock"></i>
                            ${new Date(analysis.analysisDate).toLocaleString()}
                            • Processing time: ${analysis.processingTime}
                        </div>
                    </div>
                    <div class="confidence-badge ${confidenceClass}">
                        ${analysis.confidence}% Confidence
                    </div>
                </div>
                <div class="analysis-results">
                    <div class="result-item">
                        <div class="result-icon ${healthClass}">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <div class="result-