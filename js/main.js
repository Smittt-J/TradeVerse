/**
 * TradeVerse - Main JavaScript File
 * Common utilities and navigation functionality
 */

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function () {
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarNav = document.getElementById('navbarNav');

    if (navbarToggle && navbarNav) {
        // Toggle menu on click
        navbarToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navbarNav.classList.toggle('active');

            // Animate hamburger icon
            const spans = navbarToggle.querySelectorAll('span');
            if (navbarNav.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });

        // Close mobile menu when clicking on a link
        const navLinks = navbarNav.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                navbarNav.classList.remove('active');
                const spans = navbarToggle.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (e) {
            if (navbarNav.classList.contains('active')) {
                if (!navbarNav.contains(e.target) && !navbarToggle.contains(e.target)) {
                    navbarNav.classList.remove('active');
                    const spans = navbarToggle.querySelectorAll('span');
                    spans[0].style.transform = '';
                    spans[1].style.opacity = '';
                    spans[2].style.transform = '';
                }
            }
        });

        // Close mobile menu on window resize (e.g., rotating device)
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) {
                navbarNav.classList.remove('active');
                const spans = navbarToggle.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });
    }

    // Logout button functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('tradeVerseUser');
                window.location.href = getBasePath() + 'index.html';
            }
        });
    }

    // Handle escape key to close mobile menu
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navbarNav && navbarNav.classList.contains('active')) {
            navbarNav.classList.remove('active');
            const spans = navbarToggle.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });
});

// Helper function to get base path based on current location
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
        return '../';
    }
    return '';
}

// Check if user is logged in
function checkAuth() {
    const user = getCurrentUser();
    const path = window.location.pathname;
    const isAuthPage = path.includes('login.html') || path.includes('register.html');
    const isProtectedPage = path.includes('dashboard.html') || path.includes('trade.html') ||
        path.includes('portfolio.html') || path.includes('history.html') ||
        path.includes('profile.html');

    if (!user && isProtectedPage) {
        window.location.href = getBasePath() + 'pages/login.html';
        return false;
    }

    if (user && isAuthPage) {
        window.location.href = getBasePath() + 'pages/dashboard.html';
        return false;
    }

    return true;
}

// Get current user from localStorage
function getCurrentUser() {
    const userData = localStorage.getItem('tradeVerseUser');
    return userData ? JSON.parse(userData) : null;
}

// Format currency
function formatCurrency(amount) {
    const absAmount = Math.abs(amount);
    const formatted = '\u20B9' + absAmount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });
    return amount < 0 ? '-' + formatted : formatted;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format short date
function formatShortDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    });
}

// Show alert message
function showAlert(elementId, message, type) {
    type = type || 'danger';
    const alert = document.getElementById(elementId);
    const alertMessage = document.getElementById(elementId + 'Message') || (alert ? alert.querySelector('span') : null);

    if (alert && alertMessage) {
        alert.className = 'alert alert-' + type;
        alertMessage.textContent = message;
        alert.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(function () {
            alert.classList.add('hidden');
        }, 5000);
    }
}

// Hide alert message
function hideAlert(elementId) {
    const alert = document.getElementById(elementId);
    if (alert) {
        alert.classList.add('hidden');
    }
}

// Generate random stock price change
function getRandomChange(basePrice, percentRange) {
    const change = basePrice * (Math.random() * percentRange * 2 - percentRange);
    return change;
}

// Calculate percentage change
function calculatePercentChange(oldValue, newValue) {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue * 100).toFixed(2);
}

// Prevent zoom on double tap for iOS
document.addEventListener('touchend', function (e) {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - (this.lastTouchEnd || 0) <= DOUBLE_TAP_DELAY) {
        e.preventDefault();
    }
    this.lastTouchEnd = now;
}, { passive: false });

// Handle viewport height for mobile browsers
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
}

// Run on load and resize
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
