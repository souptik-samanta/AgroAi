// Auth functionality
let currentForm = 'login';

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

// Tab switching
function showLogin() {
    currentForm = 'login';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    
    // Focus on email field
    setTimeout(() => document.getElementById('loginEmail').focus(), 100);
}

function showRegister() {
    currentForm = 'register';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    
    // Focus on username field
    setTimeout(() => document.getElementById('registerUsername').focus(), 100);
}

// Fill demo credentials
function fillDemoCredentials() {
    document.getElementById('loginEmail').value = 'demo@agroai.com';
    document.getElementById('loginPassword').value = 'demo123';
    showLogin();
    showNotification('Demo credentials filled! Click login to continue.', 'info');
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
    if (password.length < 6) {
        return 'Password must be at least 6 characters long';
    }
    return null;
}

// Form submissions
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('🔐 Login form submitted');
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    console.log('📋 Form data:', data);
    
    // Basic validation
    if (!data.email || !data.password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        console.log('📡 Sending login request...');
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('📨 Response received:', response.status);
        const result = await response.json();
        console.log('📄 Response data:', result);
        
        if (result.success) {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showNotification(result.message || 'Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Validation
    if (!data.username || !data.email || !data.password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (data.username.trim().length < 2) {
        showNotification('Username must be at least 2 characters long', 'error');
        return;
    }
    
    if (!isValidEmail(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    const passwordError = validatePassword(data.password);
    if (passwordError) {
        showNotification(passwordError, 'error');
        return;
    }
    
    // Show loading state
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: data.username.trim(),
                email: data.email.toLowerCase().trim(),
                password: data.password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Account created successfully! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showNotification(result.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please check your connection and try again.', 'error');
        console.error('Registration error:', error);
    } finally {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
});

// Create demo user on first load
async function createDemoUser() {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'Demo User',
                email: 'demo@agroai.com',
                password: 'demo123'
            })
        });
        
        // Silently handle the response - don't show errors if user exists
        if (response.ok) {
            const result = await response.json();
            console.log('Demo user setup:', result.success ? 'Success' : 'Already exists');
        }
    } catch (error) {
        // Silently fail - demo user might already exist
        console.log('Demo user already exists or network error');
    }
}

// Real-time validation feedback
document.getElementById('registerEmail').addEventListener('input', function(e) {
    const email = e.target.value.trim();
    if (email && !isValidEmail(email)) {
        e.target.style.borderColor = 'var(--error-color)';
    } else {
        e.target.style.borderColor = 'var(--border)';
    }
});

document.getElementById('registerPassword').addEventListener('input', function(e) {
    const password = e.target.value;
    const error = validatePassword(password);
    if (password && error) {
        e.target.style.borderColor = 'var(--error-color)';
    } else {
        e.target.style.borderColor = 'var(--border)';
    }
});

// Enter key handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (currentForm === 'login') {
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        } else {
            document.getElementById('registerForm').dispatchEvent(new Event('submit'));
        }
    }
});

// Initialize demo user and focus on first field
document.addEventListener('DOMContentLoaded', () => {
    createDemoUser();
    
    // Focus on first field
    setTimeout(() => {
        if (currentForm === 'login') {
            document.getElementById('loginEmail').focus();
        }
    }, 100);
    
    // Show welcome message
    setTimeout(() => {
        showNotification('Welcome to AgroAI! Use the demo account or create your own.', 'info');
    }, 500);
});

function showRegister() {
    currentForm = 'register';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

// Fill demo credentials
function fillDemoCredentials() {
    document.getElementById('loginEmail').value = 'demo@agroai.com';
    document.getElementById('loginPassword').value = 'demo123';
    showLogin();
    showNotification('Demo credentials filled! Click login to continue.', 'info');
}

// Create demo user on first load
async function createDemoUser() {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'Demo User',
                email: 'demo@agroai.com',
                password: 'demo123'
            })
        });
        
        // Don't show error if user already exists
        const result = await response.json();
    } catch (error) {
        // Silently fail
    }
}

// Initialize demo user on page load
document.addEventListener('DOMContentLoaded', () => {
    createDemoUser();
});