// Dashboard functionality
let currentSection = 'dashboard';
let crops = [];
let analyses = [];
let userProfile = null;
let currentGalleryView = 'grid';
let currentFilter = '';

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    
    notification.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Navigation
function showSection(section) {
    console.log('Switching to section:', section);
    currentSection = section;
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const navLink = document.querySelector(`[onclick="showSection('${section}')"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    const contentSection = document.getElementById(section);
    if (contentSection) {
        contentSection.classList.add('active');
    }
    
    // Load section data
    switch(section) {
        case 'crops':
            loadCrops();
            break;
        case 'gallery':
            loadGallery();
            break;
        case 'analyses':
            loadAnalyses();
            break;
        case 'dashboard':
            loadDashboardStats();
            break;
        default:
            console.warn('Unknown section:', section);
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
        console.log('Loading dashboard stats...');
        const response = await fetch('/api/dashboard-stats');
        if (!response.ok) {
            // If stats endpoint doesn't exist, calculate from current data
            const stats = {
                totalCrops: crops.length,
                healthyCrops: analyses.filter(a => a.health === 'Healthy').length,
                totalAnalyses: analyses.length,
                avgConfidence: analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length) : 0
            };
            
            // Animate counter updates
            animateCounter('totalCrops', stats.totalCrops);
            animateCounter('healthyCrops', stats.healthyCrops);
            animateCounter('totalAnalyses', stats.totalAnalyses);
            animateCounter('avgConfidence', stats.avgConfidence, '%');
            
            // Update AI status
            updateAIStatus();
            return;
        }
        
        const stats = await response.json();
        console.log('Stats loaded:', stats);
        
        // Animate counter updates
        animateCounter('totalCrops', stats.totalCrops);
        animateCounter('healthyCrops', stats.healthyCrops);
        animateCounter('totalAnalyses', stats.totalAnalyses);
        animateCounter('avgConfidence', stats.avgConfidence, '%');
        
        // Update AI status
        updateAIStatus();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Use fallback calculations
        const stats = {
            totalCrops: crops.length,
            healthyCrops: analyses.filter(a => a.health === 'Healthy').length,
            totalAnalyses: analyses.length,
            avgConfidence: analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length) : 0
        };
        
        animateCounter('totalCrops', stats.totalCrops);
        animateCounter('healthyCrops', stats.healthyCrops);
        animateCounter('totalAnalyses', stats.totalAnalyses);
        animateCounter('avgConfidence', stats.avgConfidence, '%');
        updateAIStatus();
    }
}

// Animate counters
function animateCounter(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment = Math.ceil((targetValue - currentValue) / 20);
    
    if (currentValue === targetValue) return;
    
    const timer = setInterval(() => {
        const newValue = Math.min(currentValue + increment, targetValue);
        element.textContent = newValue + suffix;
        
        if (newValue >= targetValue) {
            clearInterval(timer);
        }
    }, 50);
}

// Update AI status with rotating messages
function updateAIStatus() {
    const statusMessages = [
        'Ready for Analysis',
        'Processing Data...',
        'Learning Patterns...',
        'Optimizing Models...',
        'Monitoring Health...',
        'Analyzing Growth...',
        'Ready for Analysis'
    ];
    
    const statusElement = document.getElementById('aiStatusText');
    let index = 0;
    
    const updateStatus = () => {
        statusElement.textContent = statusMessages[index];
        index = (index + 1) % statusMessages.length;
    };
    
    // Initial update
    updateStatus();
    
    // Update every 4 seconds
    setInterval(updateStatus, 4000);
}

// Load crops
async function loadCrops() {
    try {
        console.log('Loading crops...');
        const response = await fetch('/api/crops');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        crops = await response.json();
        console.log('Crops loaded:', crops.length);
        renderCrops();
        
        // Also refresh gallery if we're on that section
        if (currentSection === 'gallery') {
            renderGallery();
        }
    } catch (error) {
        console.error('Error loading crops:', error);
        showNotification('Error loading crops - ' + error.message, 'error');
        
        // Show fallback data
        crops = [];
        renderCrops();
    }
}

// Render crops
function renderCrops() {
    const container = document.getElementById('cropsGrid');
    
    if (crops.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-seedling"></i>
                <h3>No crops added yet</h3>
                <p>Start your agricultural journey by adding your first crop to monitor</p>
                <button onclick="showAddCropModal()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Your First Crop
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = crops.map(crop => createCropCard(crop)).join('');
}

// Create crop card HTML
function createCropCard(crop) {
    const plantedDaysAgo = Math.floor((new Date() - new Date(crop.plantedDate)) / (1000 * 60 * 60 * 24));
    const recentAnalysis = analyses.find(a => a.cropId === crop.id);
    const healthStatus = recentAnalysis ? recentAnalysis.health : 'Unknown';
    const healthClass = healthStatus.toLowerCase().replace(' ', '-');
    
    return `
        <div class="crop-card" onclick="showCropDetail('${crop.id}')">
            <div class="crop-image">
                ${crop.imageUrl ? 
                    `<img src="${crop.imageUrl}" alt="${crop.name}" loading="lazy">` :
                    `<div class="crop-image-placeholder">
                         <i class="fas fa-seedling"></i>
                         <span>No image</span>
                     </div>`
                }
                ${recentAnalysis ? `
                    <div class="health-indicator health-${healthClass}" style="
                        position: absolute; 
                        top: 12px; 
                        right: 12px; 
                        padding: 6px 12px; 
                        border-radius: 20px; 
                        font-size: 12px; 
                        font-weight: 600;
                        backdrop-filter: blur(10px);
                    ">
                        ${healthStatus}
                    </div>
                ` : ''}
            </div>
            <div class="crop-info">
                <div class="crop-header">
                    <div class="crop-name">${crop.name}</div>
                    <div class="crop-type">${crop.type}</div>
                </div>
                <div class="crop-details">
                    <div class="crop-detail">
                        <span class="crop-detail-label">Location</span>
                        <span class="crop-detail-value">${crop.location}</span>
                    </div>
                    <div class="crop-detail">
                        <span class="crop-detail-label">Age</span>
                        <span class="crop-detail-value">${plantedDaysAgo} days</span>
                    </div>
                </div>
                <div class="crop-actions" onclick="event.stopPropagation();">
                    ${crop.imageUrl ? `
                        <button onclick="analyzeCrop('${crop.id}')" class="btn btn-primary btn-sm">
                            <i class="fas fa-microscope"></i> Analyze
                        </button>
                    ` : ''}
                    <button onclick="deleteCrop('${crop.id}')" class="btn btn-secondary btn-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Gallery functions
async function loadGallery() {
    try {
        // Ensure crops are loaded first
        if (crops.length === 0) {
            const response = await fetch('/api/crops');
            crops = await response.json();
        }
        renderGallery();
    } catch (error) {
        console.error('Error loading gallery:', error);
        showNotification('Error loading gallery', 'error');
    }
}

function setGalleryView(view) {
    currentGalleryView = view;
    
    // Update toggle buttons
    document.querySelectorAll('.view-toggle button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update gallery grid class
    const gallery = document.getElementById('galleryGrid');
    gallery.className = `gallery-grid ${view}-view`;
    
    renderGallery();
}

function filterGallery() {
    currentFilter = document.getElementById('cropTypeFilter').value;
    renderGallery();
}

function renderGallery() {
    const container = document.getElementById('galleryGrid');
    
    if (!container) {
        console.error('Gallery container not found');
        return;
    }
    
    console.log('Rendering gallery with', crops.length, 'crops');
    
    // Filter crops
    let filteredCrops = crops;
    if (currentFilter) {
        filteredCrops = crops.filter(crop => crop.type === currentFilter);
    }
    
    if (filteredCrops.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-images" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">${currentFilter ? 'No crops found' : 'No crops in gallery'}</h3>
                <p style="color: #999; margin-bottom: 30px;">${currentFilter ? `No ${currentFilter} crops found` : 'Add crops to see them in the gallery'}</p>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="showAddCropModal();" class="btn btn-primary" style="padding: 12px 24px;">
                        <i class="fas fa-plus"></i> Add Crop
                    </button>
                    ${currentFilter ? `<button onclick="document.getElementById('cropTypeFilter').value = ''; filterGallery();" class="btn btn-secondary" style="padding: 12px 24px;"><i class="fas fa-filter"></i> Clear Filter</button>` : ''}
                </div>
            </div>
        `;
        return;
    }
    
    // Sort by most recent
    filteredCrops.sort((a, b) => new Date(b.createdAt || b.plantedDate) - new Date(a.createdAt || a.plantedDate));
    
    container.innerHTML = filteredCrops.map(crop => createCropCard(crop)).join('');
}

// Show crop detail modal
function showCropDetail(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (!crop) return;
    
    const modal = document.getElementById('cropDetailModal');
    const nameElement = document.getElementById('cropDetailName');
    const contentElement = document.getElementById('cropDetailContent');
    
    nameElement.textContent = crop.name;
    
    const cropAnalyses = analyses.filter(a => a.cropId === cropId);
    const latestAnalysis = cropAnalyses.sort((a, b) => new Date(b.analysisDate) - new Date(a.analysisDate))[0];
    const plantedDaysAgo = Math.floor((new Date() - new Date(crop.plantedDate)) / (1000 * 60 * 60 * 24));
    
    contentElement.innerHTML = `
        <div style="padding: 32px;">
            ${crop.imageUrl ? `
                <div style="text-align: center; margin-bottom: 32px;">
                    <img src="${crop.imageUrl}" alt="${crop.name}" style="
                        max-width: 100%; 
                        height: 300px; 
                        object-fit: cover; 
                        border-radius: var(--border-radius-lg);
                        box-shadow: var(--shadow);
                    ">
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 32px;">
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-seedling"></i>
                    </div>
                    <div class="result-text">
                        <div class="result-label">Crop Type</div>
                        <div class="result-value">${crop.type.charAt(0).toUpperCase() + crop.type.slice(1)}</div>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="result-text">
                        <div class="result-label">Location</div>
                        <div class="result-value">${crop.location}</div>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="result-text">
                        <div class="result-label">Planted Date</div>
                        <div class="result-value">${new Date(crop.plantedDate).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="result-text">
                        <div class="result-label">Age</div>
                        <div class="result-value">${plantedDaysAgo} days</div>
                    </div>
                </div>
            </div>
            
            ${latestAnalysis ? `
                <h4 style="margin-bottom: 16px; color: var(--primary-color);">
                    <i class="fas fa-microscope"></i> Latest AI Analysis
                </h4>
                <div class="analysis-results" style="margin-bottom: 24px;">
                    <div class="result-item">
                        <div class="result-icon health-${latestAnalysis.health.toLowerCase()}">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <div class="result-text">
                            <div class="result-label">Health Status</div>
                            <div class="result-value">${latestAnalysis.health}</div>
                        </div>
                    </div>
                    <div class="result-item">
                        <div class="result-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="result-text">
                            <div class="result-label">Confidence</div>
                            <div class="result-value">${latestAnalysis.confidence}%</div>
                        </div>
                    </div>
                    <div class="result-item">
                        <div class="result-icon">
                            <i class="fas fa-bug"></i>
                        </div>
                        <div class="result-text">
                            <div class="result-label">Disease Status</div>
                            <div class="result-value">${latestAnalysis.disease}</div>
                        </div>
                    </div>
                </div>
                <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--border-radius); border: 1px solid var(--border);">
                    <h5 style="color: var(--text-primary); margin-bottom: 8px;">
                        <i class="fas fa-lightbulb"></i> Recommendation
                    </h5>
                    <p style="color: var(--text-secondary); margin: 0;">${latestAnalysis.recommendation}</p>
                </div>
            ` : `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-microscope" style="font-size: 2rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>No AI analysis available yet</p>
                    ${crop.imageUrl ? `
                        <button onclick="analyzeCrop('${crop.id}'); closeCropDetailModal();" class="btn btn-primary" style="margin-top: 16px;">
                            <i class="fas fa-play"></i> Run AI Analysis
                        </button>
                    ` : `
                        <p style="font-size: 14px; margin-top: 12px;">Upload an image to enable AI analysis</p>
                    `}
                </div>
            `}
            
            ${cropAnalyses.length > 1 ? `
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border);">
                    <h5 style="color: var(--text-primary); margin-bottom: 16px;">
                        <i class="fas fa-history"></i> Analysis History (${cropAnalyses.length} total)
                    </h5>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        ${cropAnalyses.slice(0, 5).map(analysis => `
                            <div style="
                                background: var(--surface); 
                                padding: 12px 16px; 
                                border-radius: var(--border-radius); 
                                border: 1px solid var(--border);
                                font-size: 12px;
                            ">
                                <div style="color: var(--text-secondary); margin-bottom: 4px;">
                                    ${new Date(analysis.analysisDate).toLocaleDateString()}
                                </div>
                                <div style="color: var(--text-primary); font-weight: 600;">
                                    ${analysis.health} (${analysis.confidence}%)
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end;">
                ${crop.imageUrl ? `
                    <button onclick="analyzeCrop('${crop.id}'); closeCropDetailModal();" class="btn btn-primary">
                        <i class="fas fa-microscope"></i> Run New Analysis
                    </button>
                ` : ''}
                <button onclick="deleteCrop('${crop.id}'); closeCropDetailModal();" class="btn btn-secondary">
                    <i class="fas fa-trash"></i> Delete Crop
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeCropDetailModal() {
    document.getElementById('cropDetailModal').classList.remove('active');
}

// Load analyses
async function loadAnalyses() {
    try {
        console.log('Loading analyses...');
        const response = await fetch('/api/analyses');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        analyses = await response.json();
        console.log('Analyses loaded:', analyses.length);
        renderAnalyses();
    } catch (error) {
        console.error('Error loading analyses:', error);
        showNotification('Error loading analyses - ' + error.message, 'error');
        
        // Show fallback
        analyses = [];
        renderAnalyses();
    }
}

// Render analyses
function renderAnalyses() {
    const container = document.getElementById('analysesContainer');
    
    if (analyses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microscope"></i>
                <h3>No AI analyses yet</h3>
                <p>Upload crop images and run AI analysis to see detailed health reports and recommendations</p>
                <button onclick="showSection('crops')" class="btn btn-primary">
                    <i class="fas fa-leaf"></i> Go to My Crops
                </button>
            </div>
        `;
        return;
    }
    
    // Sort analyses by date (newest first)
    const sortedAnalyses = [...analyses].sort((a, b) => new Date(b.analysisDate) - new Date(a.analysisDate));
    
    container.innerHTML = sortedAnalyses.map(analysis => {
        const crop = crops.find(c => c.id === analysis.cropId);
        const confidenceClass = analysis.confidence >= 90 ? 'confidence-high' : 
                              analysis.confidence >= 75 ? 'confidence-medium' : 'confidence-low';
        const healthClass = `health-${analysis.health.toLowerCase().replace(' ', '-')}`;
        
        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <div class="analysis-info">
                        <h4>${crop ? crop.name : 'Unknown Crop'} - AI Health Analysis</h4>
                        <div class="analysis-date">
                            <i class="fas fa-clock"></i>
                            ${new Date(analysis.analysisDate).toLocaleString()}
                            <span style="margin-left: 16px;">
                                <i class="fas fa-tachometer-alt"></i>
                                Processing time: ${analysis.processingTime}
                            </span>
                        </div>
                    </div>
                    <div class="confidence-badge ${confidenceClass}">
                        <i class="fas fa-brain"></i> ${analysis.confidence}% Confidence
                    </div>
                </div>
                <div class="analysis-results">
                    <div class="result-item">
                        <div class="result-icon ${healthClass}">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <div class="result-text">
                            <div class="result-label">Health Status</div>
                            <div class="result-value">${analysis.health}</div>
                        </div>
                    </div>
                    <div class="result-item">
                        <div class="result-icon">
                            <i class="fas fa-bug"></i>
                        </div>
                        <div class="result-text">
                            <div class="result-label">Disease Detection</div>
                            <div class="result-value">${analysis.disease}</div>
                        </div>
                    </div>
                    <div class="result-item">
                        <div class="result-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="result-text">
                            <div class="result-label">AI Recommendation</div>
                            <div class="result-value">${analysis.recommendation}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Modal functions
function showAddCropModal() {
    document.getElementById('addCropModal').classList.add('active');
    // Set today as default planted date
    document.getElementById('plantedDate').value = new Date().toISOString().split('T')[0];
    // Focus on first input
    setTimeout(() => document.getElementById('cropName').focus(), 100);
}

function closeAddCropModal() {
    document.getElementById('addCropModal').classList.remove('active');
    document.getElementById('addCropForm').reset();
}

// Add crop form submission
document.getElementById('addCropForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Validate form
    const name = formData.get('name').trim();
    const type = formData.get('type');
    const location = formData.get('location').trim();
    const plantedDate = formData.get('plantedDate');
    
    if (!name || !type || !location || !plantedDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Crop...';
    
    try {
        const response = await fetch('/api/crops', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Crop added successfully! 🌱', 'success');
            closeAddCropModal();
            
            // Refresh data
            await loadCrops();
            await loadDashboardStats();
            
            // Show AI analysis notification if image was uploaded
            const imageFile = formData.get('image');
            if (imageFile && imageFile.size > 0) {
                setTimeout(() => {
                    showNotification('AI analysis completed automatically! 🤖', 'info');
                    if (currentSection === 'analyses') {
                        loadAnalyses();
                    }
                }, 1500);
            }
            
            // Refresh gallery if in gallery section
            if (currentSection === 'gallery') {
                loadGallery();
            }
        } else {
            showNotification(result.message || 'Failed to add crop', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please check your connection and try again.', 'error');
        console.error('Error adding crop:', error);
    } finally {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
});

// Delete crop
async function deleteCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (!crop) return;
    
    if (!confirm(`Are you sure you want to delete "${crop.name}"? This will also delete all associated analyses and cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/crops/${cropId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`"${crop.name}" deleted successfully`, 'success');
            await loadCrops();
            await loadDashboardStats();
            
            if (currentSection === 'gallery') {
                loadGallery();
            }
            if (currentSection === 'analyses') {
                loadAnalyses();
            }
        } else {
            showNotification('Failed to delete crop', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    }
}

// Analyze crop
async function analyzeCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    
    if (!crop || !crop.imageUrl) {
        showNotification('No image available for analysis. Please upload an image first.', 'error');
        return;
    }
    
    // Show AI analysis modal
    const modal = document.getElementById('aiAnalysisModal');
    modal.classList.add('active');
    
    // Animate status messages during analysis
    const statusMessages = [
        'Initializing neural network...',
        'Loading computer vision models...',
        'Preprocessing image data...',
        'Analyzing plant morphology...',
        'Detecting diseases and pests...',
        'Evaluating nutritional status...',
        'Assessing environmental stress...',
        'Calculating health metrics...',
        'Generating personalized recommendations...',
        'Finalizing analysis report...'
    ];
    
    const statusElement = modal.querySelector('.ai-status-text');
    let messageIndex = 0;
    
    const statusInterval = setInterval(() => {
        if (messageIndex < statusMessages.length) {
            statusElement.textContent = statusMessages[messageIndex];
            messageIndex++;
        } else {
            statusElement.textContent = 'Completing analysis...';
        }
    }, 400);
    
    try {
        const response = await fetch(`/api/analyze/${cropId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        clearInterval(statusInterval);
        modal.classList.remove('active');
        
        if (result.success) {
            showNotification(`AI analysis completed! Confidence: ${result.analysis.confidence}% 🎯`, 'success');
            
            // Refresh data
            await loadAnalyses();
            await loadDashboardStats();
            
            // Switch to analyses view to show result
            if (currentSection !== 'analyses') {
                setTimeout(() => {
                    showSection('analyses');
                    // Scroll to top to see the new analysis
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 500);
            }
        } else {
            showNotification('Analysis failed. Please try again.', 'error');
        }
    } catch (error) {
        clearInterval(statusInterval);
        modal.classList.remove('active');
        showNotification('Network error during analysis. Please check your connection.', 'error');
        console.error('Analysis error:', error);
    }
}

// Close modals when clicking outside or pressing Escape
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing dashboard...');
    
    try {
        // Load user profile first
        await loadUserProfile();
        console.log('User profile loaded');
        
        // Load all data in parallel
        const loadPromises = [
            loadCrops(),
            loadAnalyses()
        ];
        
        await Promise.all(loadPromises);
        console.log('Initial data loaded');
        
        // Load dashboard stats after we have crops and analyses data
        await loadDashboardStats();
        
        showNotification('Welcome back to AgroAI! 🌱', 'success');
        
        // Add some sample data for new users (only if no crops exist)
        if (crops.length === 0) {
            console.log('No crops found, adding sample data...');
            setTimeout(addSampleData, 2000);
        }
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Dashboard initialized with limited functionality', 'warning');
        
        // Initialize with empty data
        crops = [];
        analyses = [];
        
        // Still try to render what we can
        renderCrops();
        renderAnalyses();
    }
    
    console.log('Dashboard initialization complete');
});

// Add sample data for demo
async function addSampleData() {
    const sampleCrops = [
        {
            name: 'North Field Wheat',
            type: 'wheat',
            location: 'Field A-1',
            plantedDate: '2024-03-15'
        },
        {
            name: 'Greenhouse Tomatoes',
            type: 'tomato',
            location: 'Greenhouse B',
            plantedDate: '2024-04-01'
        },
        {
            name: 'East Plot Corn',
            type: 'corn',
            location: 'Field C-2',
            plantedDate: '2024-03-20'
        }
    ];
    
    for (const crop of sampleCrops) {
        try {
            const formData = new FormData();
            Object.keys(crop).forEach(key => {
                formData.append(key, crop[key]);
            });
            
            await fetch('/api/crops', {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('Error adding sample crop:', error);
        }
    }
    
    // Refresh the views
    await loadCrops();
    await loadDashboardStats();
    
    showNotification('Sample crops added to get you started! 🚀', 'info');
}

// Auto-refresh dashboard stats every 30 seconds
setInterval(() => {
    if (currentSection === 'dashboard') {
        loadDashboardStats();
    }
}, 30000);

// Image preview for file upload
document.getElementById('cropImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Could add image preview here if needed
            showNotification('Image selected. AI analysis will run automatically after adding the crop.', 'info');
        };
        reader.readAsDataURL(file);
    }
});