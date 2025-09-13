// Dashboard functionality
let currentSection = 'dashboard';
let crops = [];
let analyses = [];
let userProfile = null;
let currentGalleryView = 'grid';
let currentFilter = '';
let chatHistory = [];

// Theme Management
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${newTheme}`);
    
    // Update theme icon
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.className = newTheme === 'light' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
    
    // Save preference
    localStorage.setItem('theme', newTheme);
    
    showNotification(`Switched to ${newTheme} theme`, 'success');
}

// Mobile Navigation
function toggleMobileNav() {
    const navbar = document.getElementById('navbar');
    const navMenu = document.getElementById('nav-menu');
    
    navbar.classList.toggle('mobile-open');
    navMenu.classList.toggle('mobile-open');
}

// Email Functions
async function testEmail() {
    try {
        showNotification('Sending test email...', 'info');
        
        const response = await fetch('/api/test-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Test email sent! Check your inbox.', 'success');
        } else {
            showNotification(`Failed to send email: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification('Error sending test email', 'error');
        console.error('Test email error:', error);
    }
}

async function sendDailySummary() {
    try {
        showNotification('Generating daily summary...', 'info');
        
        const response = await fetch('/api/send-daily-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Daily summary sent! Check your email.', 'success');
        } else {
            showNotification(`Failed to send summary: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification('Error sending daily summary', 'error');
        console.error('Daily summary error:', error);
    }
}

// Quick Analysis
async function quickAnalysis(file) {
    if (!file) return;
    
    try {
        showNotification('Starting quick AI analysis...', 'info');
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'Unknown');
        formData.append('location', 'Quick Analysis');
        formData.append('notes', 'Quick analysis from dashboard');
        
        const response = await fetch('/api/crops', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Quick analysis complete! Check your crops.', 'success');
            loadCrops(); // Refresh crops
            showSection('crops'); // Switch to crops view
        } else {
            showNotification(`Analysis failed: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification('Error during quick analysis', 'error');
        console.error('Quick analysis error:', error);
    }
}

// Chat Functions
async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const result = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        if (result.success) {
            addChatMessage(result.response, 'ai');
        } else {
            addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    } catch (error) {
        hideTypingIndicator();
        addChatMessage('Sorry, I cannot connect to the AI service right now.', 'ai');
        console.error('Chat error:', error);
    }
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function askQuickQuestion(question) {
    const input = document.getElementById('chat-input');
    input.value = question;
    sendChatMessage();
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    const senderName = sender === 'ai' ? 'AgroAI Assistant' : 'You';
    const time = new Date().toLocaleTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${avatar}
        </div>
        <div class="message-content">
            <div class="message-header">
                <strong>${senderName}</strong>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${message}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Store in chat history
    chatHistory.push({ message, sender, time });
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'chat-message ai-message typing';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`theme-${savedTheme}`);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.className = savedTheme === 'light' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
    }
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('🚀 SW registered: ', registration);
                    showNotification('App ready for offline use!', 'success');
                })
                .catch(registrationError => {
                    console.log('❌ SW registration failed: ', registrationError);
                });
        });
    }
    
    // Handle install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or banner
        const installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-content">
                <div class="install-icon">📱</div>
                <div class="install-text">
                    <strong>Install AgroAI</strong>
                    <p>Get the full app experience</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="installApp()">Install</button>
                <button class="btn btn-outline btn-sm" onclick="this.parentElement.parentElement.remove()">Later</button>
            </div>
        `;
        
        document.body.appendChild(installBanner);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installBanner.parentElement) {
                installBanner.remove();
            }
        }, 10000);
    });
    
    // Handle app installed
    window.addEventListener('appinstalled', (evt) => {
        console.log('🎉 AgroAI installed successfully!');
        showNotification('AgroAI installed! Launch from your home screen.', 'success');
    });
});

// Install app function
async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            showNotification('Installing AgroAI...', 'info');
        } else {
            console.log('❌ User dismissed the install prompt');
        }
        
        deferredPrompt = null;
        
        // Remove install banner
        const banner = document.querySelector('.install-banner');
        if (banner) {
            banner.remove();
        }
    }
}

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
    
    // Close mobile nav if open
    const navbar = document.getElementById('navbar');
    const navMenu = document.getElementById('nav-menu');
    navbar.classList.remove('mobile-open');
    navMenu.classList.remove('mobile-open');
    
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
                healthyCrops: analyses.filter(a => a.health === 'Excellent' || a.health === 'Good').length,
                totalAnalyses: analyses.length,
                avgConfidence: analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length) : 0
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
        
        // Animate counter updates only if values changed
        const totalCropsElement = document.getElementById('totalCrops');
        const healthyCropsElement = document.getElementById('healthyCrops');
        const totalAnalysesElement = document.getElementById('totalAnalyses');
        const avgConfidenceElement = document.getElementById('avgConfidence');
        
        if (!totalCropsElement.dataset.lastValue || totalCropsElement.dataset.lastValue != stats.totalCrops) {
            animateCounter('totalCrops', stats.totalCrops);
            totalCropsElement.dataset.lastValue = stats.totalCrops;
        }
        
        if (!healthyCropsElement.dataset.lastValue || healthyCropsElement.dataset.lastValue != stats.healthyCrops) {
            animateCounter('healthyCrops', stats.healthyCrops);
            healthyCropsElement.dataset.lastValue = stats.healthyCrops;
        }
        
        if (!totalAnalysesElement.dataset.lastValue || totalAnalysesElement.dataset.lastValue != stats.totalAnalyses) {
            animateCounter('totalAnalyses', stats.totalAnalyses);
            totalAnalysesElement.dataset.lastValue = stats.totalAnalyses;
        }
        
        if (!avgConfidenceElement.dataset.lastValue || avgConfidenceElement.dataset.lastValue != stats.avgConfidence) {
            animateCounter('avgConfidence', stats.avgConfidence, '%');
            avgConfidenceElement.dataset.lastValue = stats.avgConfidence;
        }
        
        // Update AI status
        updateAIStatus();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Use fallback calculations
        const stats = {
            totalCrops: crops.length,
            healthyCrops: analyses.filter(a => a.health === 'Excellent' || a.health === 'Good').length,
            totalAnalyses: analyses.length,
            avgConfidence: analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length) : 0
        };
        
        animateCounter('totalCrops', stats.totalCrops);
        animateCounter('healthyCrops', stats.healthyCrops);
        animateCounter('totalAnalyses', stats.totalAnalyses);
        animateCounter('avgConfidence', stats.avgConfidence, '%');
        updateAIStatus();
    }
}

// Animate counters with anti-flicker
function animateCounter(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
    const finalTarget = parseInt(targetValue) || 0;
    
    // Prevent unnecessary animations if values are the same
    if (currentValue === finalTarget) {
        element.textContent = finalTarget + suffix;
        return;
    }
    
    const increment = Math.ceil(Math.abs(finalTarget - currentValue) / 15);
    const isIncreasing = finalTarget > currentValue;
    let current = currentValue;
    
    const timer = setInterval(() => {
        if (isIncreasing) {
            current = Math.min(current + increment, finalTarget);
        } else {
            current = Math.max(current - increment, finalTarget);
        }
        
        element.textContent = current + suffix;
        
        if (current === finalTarget) {
            clearInterval(timer);
        }
    }, 50);
}

// Update AI status with more detailed messages
function updateAIStatus() {
    const statusMessages = [
        '🤖 Real AI Ready',
        '🔍 Computer Vision Active', 
        '🧠 Neural Networks Online',
        '📊 Image Analysis Ready',
        '🌱 Plant Health Monitoring',
        '🔬 Disease Detection Active',
        '💡 Smart Recommendations',
        '🤖 Real AI Ready'
    ];
    
    const statusElement = document.getElementById('aiStatusText');
    if (!statusElement) return;
    
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

// Create crop card HTML with better file display
function createCropCard(crop) {
    const plantedDaysAgo = Math.floor((new Date() - new Date(crop.plantedDate)) / (1000 * 60 * 60 * 24));
    const recentAnalysis = analyses.find(a => a.cropId === crop.id);
    const healthStatus = recentAnalysis ? recentAnalysis.health : 'Unknown';
    const healthClass = healthStatus.toLowerCase().replace(' ', '-');
    
    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    return `
        <div class="crop-card" onclick="showCropDetail('${crop.id}')">
            <div class="crop-image">
                ${crop.imageUrl ? 
                    `<img src="${crop.imageUrl}" alt="${crop.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'crop-image-placeholder\\'><i class=\\'fas fa-image\\'></i><span>Image not found</span></div>'">
                     <div class="image-info" style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        ${crop.imageSize ? formatFileSize(crop.imageSize) : 'Image'}
                     </div>` :
                    `<div class="crop-image-placeholder">
                         <i class="fas fa-seedling"></i>
                         <span>No image</span>
                         <button onclick="event.stopPropagation(); uploadImageForCrop('${crop.id}')" class="btn btn-sm btn-primary" style="margin-top: 8px;">
                            <i class="fas fa-camera"></i> Add Photo
                         </button>
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
                    ${crop.imageUrl ? `
                        <div class="crop-detail">
                            <span class="crop-detail-label">Photo</span>
                            <span class="crop-detail-value">
                                <i class="fas fa-image" style="color: green;"></i> Available
                            </span>
                        </div>
                    ` : ''}
                </div>
                <div class="crop-actions" onclick="event.stopPropagation();">
                    ${crop.imageUrl ? `
                        <button onclick="analyzeCrop('${crop.id}')" class="btn btn-primary btn-sm">
                            <i class="fas fa-microscope"></i> Analyze
                        </button>
                    ` : `
                        <button onclick="uploadImageForCrop('${crop.id}')" class="btn btn-secondary btn-sm">
                            <i class="fas fa-camera"></i> Add Photo
                        </button>
                    `}
                    <button onclick="deleteCrop('${crop.id}')" class="btn btn-secondary btn-sm" style="background: #dc3545;">
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
    const imageFile = formData.get('image');
    
    if (!name || !type || !location || !plantedDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate image file if provided
    if (imageFile && imageFile.size > 0) {
        if (imageFile.size > 10 * 1024 * 1024) {
            showNotification('Image file must be less than 10MB', 'error');
            return;
        }
        
        if (!imageFile.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            return;
        }
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
            const message = imageFile && imageFile.size > 0 ? 
                'Crop added with AI analysis! 🌱🤖' : 
                'Crop added successfully! 🌱';
            
            showNotification(message, 'success');
            closeAddCropModal();
            
            // Refresh data
            await loadCrops();
            await loadDashboardStats();
            
            // Show additional notification for AI analysis
            if (imageFile && imageFile.size > 0) {
                setTimeout(() => {
                    showNotification('AI analysis completed! Check the Analyses section for details.', 'info');
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

// Upload image for existing crop
function uploadImageForCrop(cropId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            showNotification('File size must be less than 10MB', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            showNotification('Uploading image...', 'info');
            
            const response = await fetch(`/api/crops/${cropId}/upload-image`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Image uploaded successfully! 📸', 'success');
                await loadCrops();
                if (currentSection === 'gallery') {
                    loadGallery();
                }
            } else {
                showNotification(result.message || 'Failed to upload image', 'error');
            }
        } catch (error) {
            showNotification('Upload failed. Please try again.', 'error');
            console.error('Upload error:', error);
        }
    };
    input.click();
}

// Delete crop with confirmation
async function deleteCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (!crop) return;
    
    const confirmMessage = crop.imageUrl ? 
        `Are you sure you want to delete "${crop.name}"?\n\nThis will also delete:\n• The crop photo\n• All AI analyses\n• All associated data\n\nThis action cannot be undone.` :
        `Are you sure you want to delete "${crop.name}"?\n\nThis will also delete all associated analyses and cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        showNotification('Deleting crop...', 'info');
        
        const response = await fetch(`/api/crops/${cropId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message || 'Crop deleted successfully', 'success');
            
            // Refresh all sections
            await loadCrops();
            await loadDashboardStats();
            
            if (currentSection === 'gallery') {
                loadGallery();
            }
            if (currentSection === 'analyses') {
                loadAnalyses();
            }
        } else {
            showNotification(result.message || 'Failed to delete crop', 'error');
        }
    } catch (error) {
        showNotification('Delete failed. Please try again.', 'error');
        console.error('Delete error:', error);
    }
}

// Analyze crop with enhanced AI messaging
async function analyzeCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    
    if (!crop || !crop.imageUrl) {
        showNotification('No image available for analysis. Please upload an image first.', 'error');
        return;
    }
    
    // Show AI analysis modal
    const modal = document.getElementById('aiAnalysisModal');
    modal.classList.add('active');
    
    // Enhanced status messages for real AI
    const statusMessages = [
        '🤖 Initializing real AI engine...',
        '📷 Loading computer vision models...',
        '🔍 Preprocessing image data...',
        '🌱 Analyzing plant morphology...',
        '🦠 Detecting diseases and pests...',
        '📊 Evaluating nutritional status...',
        '🌡️ Assessing environmental stress...',
        '💯 Calculating health metrics...',
        '💡 Generating smart recommendations...',
        '✅ Finalizing AI analysis report...'
    ];
    
    const statusElement = modal.querySelector('.ai-status-text');
    let messageIndex = 0;
    
    const statusInterval = setInterval(() => {
        if (messageIndex < statusMessages.length) {
            statusElement.textContent = statusMessages[messageIndex];
            messageIndex++;
        } else {
            statusElement.textContent = '🤖 Completing real AI analysis...';
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
            showNotification(`🤖 Real AI analysis completed! Health: ${result.analysis.health} (${result.analysis.confidence}% confidence)`, 'success');
            
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
            showNotification('AI analysis failed: ' + (result.message || 'Please try again'), 'error');
        }
    } catch (error) {
        clearInterval(statusInterval);
        modal.classList.remove('active');
        showNotification('Network error during AI analysis. Please check your connection.', 'error');
        console.error('AI Analysis error:', error);
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

// Auto-refresh dashboard stats every 60 seconds (reduced frequency to prevent flickering)
setInterval(() => {
    if (currentSection === 'dashboard') {
        // Only refresh if user is actively on dashboard and no modals are open
        const hasActiveModal = document.querySelector('.modal.active');
        if (!hasActiveModal) {
            loadDashboardStats();
        }
    }
}, 60000); // Changed from 30 to 60 seconds

// Image preview for file upload with better feedback
document.getElementById('cropImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    
    // Remove existing preview
    if (preview) {
        preview.remove();
    }
    
    if (file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            this.value = '';
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showNotification('Image file must be less than 10MB', 'error');
            this.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Create preview element
            const previewDiv = document.createElement('div');
            previewDiv.id = 'imagePreview';
            previewDiv.style.cssText = `
                margin-top: 12px;
                text-align: center;
                background: var(--bg-secondary);
                padding: 16px;
                border-radius: 8px;
                border: 2px dashed var(--border);
            `;
            
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="
                    max-width: 100%;
                    max-height: 200px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
                <div style="margin-top: 8px; color: var(--text-secondary); font-size: 14px;">
                    <i class="fas fa-file-image"></i> ${file.name}
                    <span style="margin-left: 12px;">
                        <i class="fas fa-weight"></i> ${formatFileSize(file.size)}
                    </span>
                </div>
                <div style="margin-top: 8px; color: var(--success-color); font-size: 12px;">
                    <i class="fas fa-check"></i> Ready for upload • AI analysis will run automatically
                </div>
            `;
            
            // Insert after the file input
            document.getElementById('cropImage').parentNode.insertBefore(previewDiv, document.getElementById('cropImage').nextSibling);
            
            showNotification('Image selected and ready for upload! 📸', 'success');
        };
        reader.readAsDataURL(file);
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
});