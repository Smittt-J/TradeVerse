/**
 * TradeVerse - Authentication Module
 * Handles login and registration functionality
 */

// Load the data module
const dataScript = document.createElement('script');
dataScript.src = getBasePath() + 'js/data.js';
document.head.appendChild(dataScript);

// Wait for data script to load
dataScript.onload = function () {
    checkAuth();
};

// Check which page we're on and initialize
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Registration form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);

        // Real-time password validation
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');

        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', function () {
                if (password.value !== confirmPassword.value) {
                    document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
                } else {
                    document.getElementById('confirmPasswordError').textContent = '';
                }
            });
        }
    }
});

/**
 * Handle login form submission
 */
function handleLogin(e) {
    e.preventDefault();
    hideAlert('loginAlert');

    // Get form values
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!email || !password) {
        showAlert('loginAlert', 'Please fill in all fields', 'danger');
        return;
    }

    // Get stored user
    const users = JSON.parse(localStorage.getItem('tradeVerseUsers') || '{}');
    const user = users[email];

    if (!user) {
        showAlert('loginAlert', 'No account found with this email', 'danger');
        return;
    }

    // Verify password
    if (user.password !== password) {
        showAlert('loginAlert', 'Incorrect password', 'danger');
        return;
    }

    // Save current user session
    localStorage.setItem('tradeVerseUser', JSON.stringify({
        email: user.email,
        fullName: user.fullName,
        isLoggedIn: true
    }));

    // Initialize user data if not exists
    if (!getUserData(email)) {
        initializeUserData(user);
    }

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
}

/**
 * Handle registration form submission
 */
function handleRegister(e) {
    e.preventDefault();
    hideAlert('registerAlert');

    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate inputs
    if (!fullName || !email || !password || !confirmPassword) {
        showAlert('registerAlert', 'Please fill in all fields', 'danger');
        return;
    }

    if (fullName.length < 3) {
        showAlert('registerAlert', 'Name must be at least 3 characters', 'danger');
        return;
    }

    if (password.length < 6) {
        showAlert('registerAlert', 'Password must be at least 6 characters', 'danger');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('registerAlert', 'Passwords do not match', 'danger');
        return;
    }

    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('tradeVerseUsers') || '{}');

    if (users[email]) {
        showAlert('registerAlert', 'An account with this email already exists', 'danger');
        return;
    }

    // Create new user
    users[email] = {
        fullName: fullName,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('tradeVerseUsers', JSON.stringify(users));

    // Initialize user data
    initializeUserData(users[email]);

    // Save session
    localStorage.setItem('tradeVerseUser', JSON.stringify({
        email: email,
        fullName: fullName,
        isLoggedIn: true
    }));

    // Show success and redirect
    showAlert('registerAlert', 'Account created successfully! Redirecting...', 'success');

    setTimeout(function () {
        window.location.href = 'dashboard.html';
    }, 1500);
}
