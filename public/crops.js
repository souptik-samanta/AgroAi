// Enhanced Crops Management JavaScript with Better Functionality

// Enhanced sample crop data with more realistic information
let crops = [
    {
        id: 1,
        name: "Heritage Tomato Field A",
        type: "tomato",
        variety: "Roma",
        plantingDate: "2025-06-15",
        area: 3.2,
        location: "North Field, Section A",
        status: "healthy",
        health: 94,
        growth: 78,
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop",
        lastChecked: "2025-09-12",
        nextWatering: "2025-09-14",
        estimatedHarvest: "2025-11-20",
        soilMoisture: 72,
        temperature: 24,
        notes: "Excellent growth rate, no signs of disease. Consider increasing irrigation frequency.",
        aiRecommendations: [
            "Continue current fertilization schedule",
            "Monitor for early blight symptoms",
            "Increase irrigation by 15% during fruit development"
        ]
    },
    {
        id: 2,
        name: "Golden Wheat Fields",
        type: "wheat",
        variety: "Winter Wheat",
        plantingDate: "2025-05-01",
        area: 12.5,
        location: "South Field, Sections B-D",
        status: "warning",
        health: 76,
        growth: 85,
        image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
        lastChecked: "2025-09-11",
        nextWatering: "2025-09-13",
        estimatedHarvest: "2025-10-15",
        soilMoisture: 58,
        temperature: 22,
        notes: "Moderate drought stress detected. Rust spots observed on lower leaves.",
        aiRecommendations: [
            "Increase irrigation immediately",
            "Apply fungicide for rust prevention",
            "Monitor nitrogen levels"
        ]
    },
    {
        id: 3,
        name: "Sweet Corn Paradise",
        type: "corn",
        variety: "Sugar Enhanced",
        plantingDate: "2025-04-20",
        area: 5.8,
        location: "East Field, Section E",
        status: "healthy",
        health: 91,
        growth: 92,
        image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop",
        lastChecked: "2025-09-12",
        nextWatering: "2025-09-15",
        estimatedHarvest: "2025-10-30",
        soilMoisture: 78,
        temperature: 26,
        notes: "Exceptional growth, approaching tasseling stage. High yield expected.",
        aiRecommendations: [
            "Maintain current irrigation schedule",
            "Side-dress with nitrogen in 2 weeks",
            "Watch for corn borers during tasseling"
        ]
    },
    {
        id: 4,
        name: "Organic Potato Patch",
        type: "potato",
        variety: "Russet Burbank",
        plantingDate: "2025-03-10",
        area: 2.3,
        location: "West Field, Section F",
        status: "critical",
        health: 45,
        growth: 65,
        image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop",
        lastChecked: "2025-09-10",
        nextWatering: "2025-09-13",
        estimatedHarvest: "2025-09-25",
        soilMoisture: 45,
        temperature: 28,
        notes: "Late blight detected on foliage. Immediate intervention required.",
        aiRecommendations: [
            "Apply copper-based fungicide immediately",
            "Reduce irrigation frequency",
            "Remove infected plant material",
            "Consider early harvest to minimize losses"
        ]
    },
    {
        id: 5,
        name: "Greenhouse Peppers",
        type: "pepper",
        variety: "Bell Pepper Mix",
        plantingDate: "2025-07-01",
        area: 0.8,
        location: "Greenhouse 1",
        status: "healthy",
        health: 89,
        growth: 45,
        image: "https://images.unsplash.com/photo-1583933008904-6ba0c48ee85c?w=400&h=300&fit=crop",
        lastChecked: "2025-09-12",
        nextWatering: "2025-09-14",
        estimatedHarvest: "2025-12-01",
        soilMoisture: 68,
        temperature: 25,
        notes: "Young plants showing excellent vigor. Flowering stage approaching.",
        aiRecommendations: [
            "Begin flower fertilizer program",
            "Monitor for aphids and whiteflies",
            "Maintain consistent moisture levels"
        ]
    }
];

let currentFilter = 'all';
let currentSort = 'newest';

// Initialize crops page with enhanced animations
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    renderCrops();
    setDefaultDate();
    
    // Add scroll animations
    observeElements();
});

// Enhanced statistics calculation
function updateStats() {
    const totalCrops = crops.length;
    const healthyCrops = crops.filter(crop => crop.status === 'healthy').length;
    const warningCrops = crops.filter(crop => crop.status === 'warning' || crop.status === 'critical').length;
    
    // Calculate average growth
    const avgGrowth = totalCrops > 0 ? Math.round(
        crops.reduce((sum, crop) => sum + crop.growth, 0) / totalCrops
    ) : 0;

    // Animate counter updates with staggered timing
    setTimeout(() => animateCounter('totalCrops', totalCrops), 100);
    setTimeout(() => animateCounter('healthyCrops', healthyCrops), 200);
    setTimeout(() => animateCounter('warningCrops', warningCrops), 300);
    setTimeout(() => animateCounter('avgGrowth', avgGrowth, '%'), 400);
}

// Enhanced counter animation with suffix support
function animateCounter(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    const duration = 50; // milliseconds per step
    
    if (currentValue !== targetValue) {
        element.textContent = (currentValue + increment) + suffix;
        setTimeout(() => animateCounter(elementId, targetValue, suffix), duration);
    }
}

// Enhanced crop rendering with better cards
function renderCrops() {
    const cropsGrid = document.getElementById('cropsGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Filter and sort crops
    const filteredCrops = getFilteredAndSortedCrops();

    if (filteredCrops.length === 0) {
        cropsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    cropsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    cropsGrid.innerHTML = filteredCrops.map((crop, index) => `
        <div class="crop-card slide-up" data-crop-id="${crop.id}" style="animation-delay: ${index * 0.1}s">
            <div class="crop-image">
                <img src="${crop.image}" alt="${crop.name}" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: var(--gradient-surface);">
                    <i class="fas fa-leaf" style="font-size: 3rem; color: var(--text-accent);"></i>
                </div>
                <div class="crop-status ${crop.status}">${getStatusText(crop.status)}</div>
            </div>
            <div class="crop-content">
                <div class="crop-header">
                    <h3 class="crop-name">${crop.name}</h3>
                    <span class="crop-type">${getTypeEmoji(crop.type)} ${capitalize(crop.type)}</span>
                </div>
                
                <div class="crop-stats">
                    <div class="crop-stat">
                        <div class="crop-stat-value">${crop.health}%</div>
                        <div class="crop-stat-label">Health Score</div>
                    </div>
                    <div class="crop-stat">
                        <div class="crop-stat-value">${crop.growth}%</div>
                        <div class="crop-stat-label">Growth Stage</div>
                    </div>
                </div>

                <div class="crop-progress">
                    <div class="crop-progress-label">
                        <i class="fas fa-seedling"></i> Growth Progress
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${crop.growth}%"></div>
                    </div>
                </div>

                <div class="crop-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${crop.location}</p>
                    <p><i class="fas fa-ruler-combined"></i> ${crop.area} acres</p>
                    <p><i class="fas fa-calendar"></i> Planted: ${formatDate(crop.plantingDate)}</p>
                    <p><i class="fas fa-harvest"></i> Harvest: ${formatDate(crop.estimatedHarvest)}</p>
                    ${crop.variety ? `<p><i class="fas fa-dna"></i> Variety: ${crop.variety}</p>` : ''}
                </div>

                <div class="crop-environmental">
                    <div class="env-stat">
                        <i class="fas fa-tint" style="color: #06b6d4;"></i>
                        <span>${crop.soilMoisture}% Moisture</span>
                    </div>
                    <div class="env-stat">
                        <i class="fas fa-thermometer-half" style="color: #f59e0b;"></i>
                        <span>${crop.temperature}°C</span>
                    </div>
                </div>

                <div class="crop-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewCropDetails(${crop.id})">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="analyzeCrop(${crop.id})">
                        <i class="fas fa-brain"></i> AI Analysis
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="editCrop(${crop.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add environmental stats styling
    const style = document.createElement('style');
    style.textContent = `
        .crop-environmental {
            display: flex;
            justify-content: space-between;
            margin: var(--spacing-md) 0;
            padding: var(--spacing-sm);
            background: var(--glass-bg);
            border-radius: var(--border-radius-sm);
            border: 1px solid var(--border-color);
        }
        .env-stat {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            font-size: 0.85rem;
            color: var(--text-secondary);
        }
    `;
    if (!document.querySelector('style[data-crops]')) {
        style.setAttribute('data-crops', 'true');
        document.head.appendChild(style);
    }
}

// Filter and sort helper function
function getFilteredAndSortedCrops() {
    const searchTerm = document.getElementById('cropSearch')?.value.toLowerCase() || '';
    
    let filtered = crops.filter(crop => {
        const matchesSearch = crop.name.toLowerCase().includes(searchTerm) || 
                            crop.type.toLowerCase().includes(searchTerm) ||
                            crop.location.toLowerCase().includes(searchTerm) ||
                            (crop.variety && crop.variety.toLowerCase().includes(searchTerm));
        const matchesFilter = currentFilter === 'all' || crop.status === currentFilter;
        return matchesSearch && matchesFilter;
    });

    // Sort crops
    switch(currentSort) {
        case 'health':
            filtered.sort((a, b) => b.health - a.health);
            break;
        case 'growth':
            filtered.sort((a, b) => b.growth - a.growth);
            break;
        case 'newest':
        default:
            filtered.sort((a, b) => new Date(b.plantingDate) - new Date(a.plantingDate));
            break;
    }

    return filtered;
}

// Enhanced helper functions
function getStatusText(status) {
    const statusMap = {
        healthy: 'Healthy',
        warning: 'Attention',
        critical: 'Critical'
    };
    return statusMap[status] || 'Unknown';
}

function getTypeEmoji(type) {
    const emojiMap = {
        tomato: '🍅',
        wheat: '🌾',
        rice: '🌾',
        corn: '🌽',
        potato: '🥔',
        carrot: '🥕',
        lettuce: '🥬',
        onion: '🧅',
        pepper: '🌶️',
        cucumber: '🥒'
    };
    return emojiMap[type] || '🌱';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Enhanced filter functions
function filterByStatus(status) {
    currentFilter = status;
    updateFilterButtons('status', status);
    renderCrops();
}

function sortCrops(sortType) {
    currentSort = sortType;
    updateFilterButtons('sort', sortType);
    renderCrops();
}

function updateFilterButtons(type, value) {
    if (type === 'status') {
        document.querySelectorAll('[data-status]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-status="${value}"]`).classList.add('active');
    } else if (type === 'sort') {
        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-sort="${value}"]`).classList.add('active');
    }
}

function filterCrops() {
    renderCrops();
}

// Enhanced modal functions
function showAddCropModal() {
    document.getElementById('addCropModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Add entrance animation
    const modal = document.querySelector('.modal-content');
    modal.style.animation = 'slideInDown 0.3s ease-out';
}

function hideAddCropModal() {
    const modal = document.getElementById('addCropModal');
    const content = modal.querySelector('.modal-content');
    
    // Add exit animation
    content.style.animation = 'slideInUp 0.3s ease-out reverse';
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('addCropForm').reset();
        resetFormToAddMode();
    }, 300);
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('plantingDate').value = today;
}

// Enhanced crop management functions
function addNewCrop(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newCrop = {
        id: crops.length + 1,
        name: formData.get('cropName'),
        type: formData.get('cropType'),
        variety: formData.get('cropVariety') || '',
        plantingDate: formData.get('plantingDate'),
        area: parseFloat(formData.get('cropArea')),
        location: formData.get('cropLocation'),
        status: 'healthy',
        health: Math.floor(Math.random() * 20) + 80, // Random health 80-100%
        growth: Math.floor(Math.random() * 30) + 20, // Random growth 20-50%
        image: getDefaultCropImage(formData.get('cropType')),
        lastChecked: new Date().toISOString().split('T')[0],
        nextWatering: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHarvest: calculateHarvestDate(formData.get('cropType'), formData.get('plantingDate')),
        soilMoisture: Math.floor(Math.random() * 30) + 60, // Random 60-90%
        temperature: Math.floor(Math.random() * 10) + 20, // Random 20-30°C
        notes: 'Newly added crop. Initial assessment pending.',
        aiRecommendations: [
            'Establish regular monitoring schedule',
            'Ensure adequate irrigation setup',
            'Monitor early growth stages carefully'
        ]
    };
    
    // Handle image upload
    const imageFile = formData.get('cropImage');
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newCrop.image = e.target.result;
            finishAddingCrop(newCrop);
        };
        reader.readAsDataURL(imageFile);
    } else {
        finishAddingCrop(newCrop);
    }
}

function finishAddingCrop(newCrop) {
    crops.push(newCrop);
    updateStats();
    renderCrops();
    hideAddCropModal();
    showNotification(`🌱 ${newCrop.name} added successfully! Starting AI monitoring...`, 'success');
}

function calculateHarvestDate(cropType, plantingDate) {
    const daysToHarvest = {
        tomato: 80,
        wheat: 120,
        rice: 120,
        corn: 100,
        potato: 90,
        carrot: 70,
        lettuce: 45,
        onion: 110,
        pepper: 75,
        cucumber: 60
    };
    
    const days = daysToHarvest[cropType] || 90;
    const harvestDate = new Date(plantingDate);
    harvestDate.setDate(harvestDate.getDate() + days);
    return harvestDate.toISOString().split('T')[0];
}

function getDefaultCropImage(cropType) {
    const defaultImages = {
        tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
        wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
        rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
        corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
        potato: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop',
        carrot: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&h=300&fit=crop',
        lettuce: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop',
        onion: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop',
        pepper: 'https://images.unsplash.com/photo-1583933008904-6ba0c48ee85c?w=400&h=300&fit=crop',
        cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=300&fit=crop'
    };
    return defaultImages[cropType] || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop';
}

// Enhanced crop action functions
function viewCropDetails(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
        // Create detailed view modal
        showCropDetailsModal(crop);
    }
}

function showCropDetailsModal(crop) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2><i class="fas fa-leaf"></i> ${crop.name} - Detailed Analysis</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove(); document.body.style.overflow='auto'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl);">
                    <div>
                        <img src="${crop.image}" alt="${crop.name}" style="width: 100%; border-radius: var(--border-radius); margin-bottom: var(--spacing-lg);">
                        <h3>Crop Information</h3>
                        <p><strong>Type:</strong> ${getTypeEmoji(crop.type)} ${capitalize(crop.type)}</p>
                        ${crop.variety ? `<p><strong>Variety:</strong> ${crop.variety}</p>` : ''}
                        <p><strong>Location:</strong> ${crop.location}</p>
                        <p><strong>Area:</strong> ${crop.area} acres</p>
                        <p><strong>Planted:</strong> ${formatDate(crop.plantingDate)}</p>
                        <p><strong>Expected Harvest:</strong> ${formatDate(crop.estimatedHarvest)}</p>
                    </div>
                    <div>
                        <h3>Health Metrics</h3>
                        <div class="crop-stat">
                            <div class="crop-stat-value">${crop.health}%</div>
                            <div class="crop-stat-label">Overall Health</div>
                        </div>
                        <div class="crop-stat">
                            <div class="crop-stat-value">${crop.growth}%</div>
                            <div class="crop-stat-label">Growth Progress</div>
                        </div>
                        <div class="crop-stat">
                            <div class="crop-stat-value">${crop.soilMoisture}%</div>
                            <div class="crop-stat-label">Soil Moisture</div>
                        </div>
                        <div class="crop-stat">
                            <div class="crop-stat-value">${crop.temperature}°C</div>
                            <div class="crop-stat-label">Temperature</div>
                        </div>
                        
                        <h3 style="margin-top: var(--spacing-lg);">AI Recommendations</h3>
                        <ul style="color: var(--text-secondary);">
                            ${crop.aiRecommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                        
                        <h3 style="margin-top: var(--spacing-lg);">Notes</h3>
                        <p style="color: var(--text-secondary); font-style: italic;">${crop.notes}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function analyzeCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
        showNotification(`🧠 Starting AI analysis for ${crop.name}...`, 'info');
        // Redirect to dashboard with crop analysis
        setTimeout(() => {
            window.location.href = 'dashboard.html#analyze';
        }, 1500);
    }
}

function editCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
        // Pre-fill the form with crop data
        document.getElementById('cropName').value = crop.name;
        document.getElementById('cropType').value = crop.type;
        document.getElementById('cropVariety').value = crop.variety || '';
        document.getElementById('plantingDate').value = crop.plantingDate;
        document.getElementById('cropArea').value = crop.area;
        document.getElementById('cropLocation').value = crop.location;
        
        // Update form submit to edit instead of add
        const form = document.getElementById('addCropForm');
        form.onsubmit = function(event) {
            event.preventDefault();
            updateCrop(cropId, event);
        };
        
        // Change modal title
        document.querySelector('.modal-header h2').innerHTML = '<i class="fas fa-edit"></i> Edit Crop Details';
        document.querySelector('.form-actions .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Changes';
        
        showAddCropModal();
    }
}

function updateCrop(cropId, event) {
    const formData = new FormData(event.target);
    const cropIndex = crops.findIndex(c => c.id === cropId);
    
    if (cropIndex !== -1) {
        crops[cropIndex] = {
            ...crops[cropIndex],
            name: formData.get('cropName'),
            type: formData.get('cropType'),
            variety: formData.get('cropVariety') || '',
            plantingDate: formData.get('plantingDate'),
            area: parseFloat(formData.get('cropArea')),
            location: formData.get('cropLocation'),
            estimatedHarvest: calculateHarvestDate(formData.get('cropType'), formData.get('plantingDate'))
        };
        
        updateStats();
        renderCrops();
        hideAddCropModal();
        showNotification(`✅ ${crops[cropIndex].name} updated successfully!`, 'success');
        
        // Reset form back to add mode
        resetFormToAddMode();
    }
}

function resetFormToAddMode() {
    const form = document.getElementById('addCropForm');
    form.onsubmit = addNewCrop;
    document.querySelector('.modal-header h2').innerHTML = '<i class="fas fa-plus"></i> Add New Crop';
    document.querySelector('.form-actions .btn-primary').innerHTML = '<i class="fas fa-plus"></i> Add Crop';
}

// Enhanced notification function with icons
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
        notification.className = 'notification';
    }, 4000);
}

// Scroll animation observer
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-up');
            }
        });
    }, { threshold: 0.1 });

    // Observe elements that should animate on scroll
    document.querySelectorAll('.crop-card, .filter-section, .stats-section').forEach(el => {
        observer.observe(el);
    });
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.remove();
        document.body.style.overflow = 'auto';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    }
    
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        showAddCropModal();
    }
});

// Render crops grid
function renderCrops() {
    const cropsGrid = document.getElementById('cropsGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Filter crops based on current filter and search
    const searchTerm = document.getElementById('cropSearch')?.value.toLowerCase() || '';
    const filteredCrops = crops.filter(crop => {
        const matchesSearch = crop.name.toLowerCase().includes(searchTerm) || 
                            crop.type.toLowerCase().includes(searchTerm) ||
                            crop.location.toLowerCase().includes(searchTerm);
        const matchesFilter = currentFilter === 'all' || crop.status === currentFilter;
        return matchesSearch && matchesFilter;
    });

    if (filteredCrops.length === 0) {
        cropsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    cropsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    cropsGrid.innerHTML = filteredCrops.map(crop => `
        <div class="crop-card" data-crop-id="${crop.id}">
            <div class="crop-image">
                <img src="${crop.image}" alt="${crop.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: var(--gradient-light);">
                    <i class="fas fa-leaf" style="font-size: 3rem; color: var(--primary-green);"></i>
                </div>
                <div class="crop-status ${crop.status}">${getStatusText(crop.status)}</div>
            </div>
            <div class="crop-content">
                <div class="crop-header">
                    <h3 class="crop-name">${crop.name}</h3>
                    <span class="crop-type">${capitalize(crop.type)}</span>
                </div>
                
                <div class="crop-stats">
                    <div class="crop-stat">
                        <div class="crop-stat-value">${crop.health}%</div>
                        <div class="crop-stat-label">Health</div>
                    </div>
                    <div class="crop-stat">
                        <div class="crop-stat-value">${crop.growth}%</div>
                        <div class="crop-stat-label">Growth</div>
                    </div>
                </div>

                <div class="crop-progress">
                    <div class="crop-progress-label">Growth Progress</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${crop.growth}%"></div>
                    </div>
                </div>

                <div class="crop-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${crop.location}</p>
                    <p><i class="fas fa-calendar"></i> Planted: ${formatDate(crop.plantingDate)}</p>
                    <p><i class="fas fa-tint"></i> Next watering: ${formatDate(crop.nextWatering)}</p>
                    <p><i class="fas fa-harvest"></i> Est. harvest: ${formatDate(crop.estimatedHarvest)}</p>
                </div>

                <div class="crop-actions">
                    <button class="btn btn-secondary btn-sm" onclick="viewCropDetails(${crop.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="analyzeCrop(${crop.id})">
                        <i class="fas fa-camera"></i> Analyze
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editCrop(${crop.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper functions
function getStatusText(status) {
    switch(status) {
        case 'healthy': return 'Healthy';
        case 'warning': return 'Warning';
        case 'critical': return 'Critical';
        default: return 'Unknown';
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Filter functions
function filterByStatus(status) {
    currentFilter = status;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
    
    renderCrops();
}

function filterCrops() {
    renderCrops();
}

// Modal functions
function showAddCropModal() {
    document.getElementById('addCropModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideAddCropModal() {
    document.getElementById('addCropModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('addCropForm').reset();
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('plantingDate').value = today;
}

// Add new crop
function addNewCrop(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newCrop = {
        id: crops.length + 1,
        name: formData.get('cropName'),
        type: formData.get('cropType'),
        plantingDate: formData.get('plantingDate'),
        area: parseFloat(formData.get('cropArea')),
        location: formData.get('cropLocation'),
        status: 'healthy',
        health: Math.floor(Math.random() * 20) + 80, // Random health 80-100%
        growth: Math.floor(Math.random() * 30) + 20, // Random growth 20-50%
        image: getDefaultCropImage(formData.get('cropType')),
        lastChecked: new Date().toISOString().split('T')[0],
        nextWatering: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        estimatedHarvest: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
    };
    
    // Handle image upload
    const imageFile = formData.get('cropImage');
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newCrop.image = e.target.result;
            finishAddingCrop(newCrop);
        };
        reader.readAsDataURL(imageFile);
    } else {
        finishAddingCrop(newCrop);
    }
}

function finishAddingCrop(newCrop) {
    crops.push(newCrop);
    updateStats();
    renderCrops();
    hideAddCropModal();
    showNotification('New crop added successfully!', 'success');
}

function getDefaultCropImage(cropType) {
    const defaultImages = {
        tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
        wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop',
        rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
        corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
        potato: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop',
        carrot: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&h=300&fit=crop',
        lettuce: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop',
        onion: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop'
    };
    return defaultImages[cropType] || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop';
}

// Crop action functions
function viewCropDetails(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
        // In a real app, this would open a detailed view
        showNotification(`Viewing details for ${crop.name}`, 'info');
        console.log('Crop details:', crop);
    }
}

function analyzeCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
        // Redirect to dashboard with crop analysis
        showNotification(`Redirecting to AI analysis for ${crop.name}...`, 'info');
        setTimeout(() => {
            window.location.href = 'dashboard.html#analyze';
        }, 1000);
    }
}

function editCrop(cropId) {
    const crop = crops.find(c => c.id === cropId);
    if (crop) {
        // Pre-fill the form with crop data
        document.getElementById('cropName').value = crop.name;
        document.getElementById('cropType').value = crop.type;
        document.getElementById('plantingDate').value = crop.plantingDate;
        document.getElementById('cropArea').value = crop.area;
        document.getElementById('cropLocation').value = crop.location;
        
        // Update form submit to edit instead of add
        const form = document.getElementById('addCropForm');
        form.onsubmit = function(event) {
            event.preventDefault();
            updateCrop(cropId, event);
        };
        
        // Change modal title
        document.querySelector('.modal-header h2').innerHTML = '<i class="fas fa-edit"></i> Edit Crop';
        document.querySelector('.form-actions .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Changes';
        
        showAddCropModal();
    }
}

function updateCrop(cropId, event) {
    const formData = new FormData(event.target);
    const cropIndex = crops.findIndex(c => c.id === cropId);
    
    if (cropIndex !== -1) {
        crops[cropIndex] = {
            ...crops[cropIndex],
            name: formData.get('cropName'),
            type: formData.get('cropType'),
            plantingDate: formData.get('plantingDate'),
            area: parseFloat(formData.get('cropArea')),
            location: formData.get('cropLocation')
        };
        
        updateStats();
        renderCrops();
        hideAddCropModal();
        showNotification('Crop updated successfully!', 'success');
        
        // Reset form back to add mode
        resetFormToAddMode();
    }
}

function resetFormToAddMode() {
    const form = document.getElementById('addCropForm');
    form.onsubmit = addNewCrop;
    document.querySelector('.modal-header h2').innerHTML = '<i class="fas fa-plus"></i> Add New Crop';
    document.querySelector('.form-actions .btn-primary').innerHTML = '<i class="fas fa-plus"></i> Add Crop';
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// Close modal when clicking outside
document.getElementById('addCropModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideAddCropModal();
    }
});