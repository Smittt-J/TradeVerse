/**
 * TradeVerse - Profile Module
 * Handles user profile display and settings
 */

// Load dependencies
const profileDataScript = document.createElement('script');
profileDataScript.src = '../js/data.js';
document.head.appendChild(profileDataScript);

// Initialize profile page
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;

    // Wait for data script to load
    setTimeout(function () {
        initializeProfilePage();
    }, 100);
});

/**
 * Initialize the profile page
 */
function initializeProfilePage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Load profile data
    loadProfileData(user.email);

    // Setup form handler
    setupProfileForm(user.email);

    // Setup action buttons
    setupActionButtons(user.email);
}

/**
 * Load and display profile data
 */
function loadProfileData(email) {
    const userData = getUserData(email);
    const user = getCurrentUser();

    if (!userData || !user) return;

    // Profile header
    document.getElementById('profileAvatar').textContent = userData.fullName.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = userData.fullName;
    document.getElementById('profileEmail').textContent = userData.email;

    // Join date
    const joinDate = new Date(userData.createdAt);
    document.getElementById('joinDate').textContent = joinDate.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric'
    });

    // Profile form
    document.getElementById('fullName').value = userData.fullName;
    document.getElementById('email').value = userData.email;

    // Load stats
    loadProfileStats(email);
}

/**
 * Load profile statistics
 */
function loadProfileStats(email) {
    const stats = calculatePortfolioStats(email);
    const trades = getTrades(email);

    if (!stats) return;

    // Profile header stats
    document.getElementById('totalTradesProfile').textContent = trades.length;

    // Calculate realized P/L from sell trades
    let realizedPL = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    trades.forEach(function (trade) {
        if (trade.type === 'sell' && trade.realizedPL !== undefined) {
            realizedPL += trade.realizedPL;
            if (trade.realizedPL > 0) winningTrades++;
            else if (trade.realizedPL < 0) losingTrades++;
        }
    });

    // Calculate win rate based on closed trades
    const totalClosedTrades = winningTrades + losingTrades;
    const winRate = totalClosedTrades > 0 ? ((winningTrades / totalClosedTrades) * 100).toFixed(0) : 0;

    document.getElementById('winRate').textContent = winRate + '%';

    const profitFactorEl = document.getElementById('profitFactor');
    profitFactorEl.textContent = (realizedPL >= 0 ? '+' : '') + formatCurrency(realizedPL);
    profitFactorEl.style.color = realizedPL >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';

    // Trading statistics section
    document.getElementById('buyingPower').textContent = formatCurrency(stats.balance);
    document.getElementById('totalInvested').textContent = formatCurrency(stats.totalInvestment);
    document.getElementById('holdingsValue').textContent = formatCurrency(stats.currentValue);

    // Unrealized P/L (current holdings)
    const unrealizedPLEl = document.getElementById('unrealizedPL');
    if (unrealizedPLEl) {
        unrealizedPLEl.textContent = (stats.profitLoss >= 0 ? '+' : '') + formatCurrency(stats.profitLoss);
        unrealizedPLEl.style.color = stats.profitLoss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
    }

    // Realized P/L display
    const realizedPLProfileEl = document.getElementById('realizedPLProfile');
    if (realizedPLProfileEl) {
        realizedPLProfileEl.textContent = (realizedPL >= 0 ? '+' : '') + formatCurrency(realizedPL);
        realizedPLProfileEl.style.color = realizedPL >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
    }

    const totalReturn = document.getElementById('totalReturn');
    // Combine unrealized and realized P/L for total return
    const totalPL = stats.profitLoss + realizedPL;
    totalReturn.textContent = (totalPL >= 0 ? '+' : '') + formatCurrency(totalPL);
    totalReturn.style.color = totalPL >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
}

/**
 * Setup profile form handler
 */
function setupProfileForm(email) {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();

        if (fullName.length < 3) {
            alert('Name must be at least 3 characters');
            return;
        }

        // Update user data
        const userData = getUserData(email);
        if (userData) {
            userData.fullName = fullName;
            saveUserData(email, userData);
        }

        // Update session
        const user = getCurrentUser();
        if (user) {
            user.fullName = fullName;
            localStorage.setItem('tradeVerseUser', JSON.stringify(user));
        }

        // Update display
        document.getElementById('profileAvatar').textContent = fullName.charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = fullName;

        // Show success message
        document.getElementById('profileAlert').classList.remove('hidden');
        setTimeout(function () {
            document.getElementById('profileAlert').classList.add('hidden');
        }, 3000);
    });
}

/**
 * Setup action buttons
 */
function setupActionButtons(email) {
    // Reset Portfolio button
    const resetBtn = document.getElementById('resetPortfolio');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to reset your portfolio? All holdings and trades will be removed.')) {
                const userData = getUserData(email);
                if (userData) {
                    userData.balance = INITIAL_BALANCE;
                    userData.holdings = [];
                    userData.trades = [];
                    userData.realizedPL = 0;
                    saveUserData(email, userData);
                    alert('Portfolio has been reset successfully!');
                    loadProfileData(email);
                    loadProfileStats(email);
                }
            }
        });
    }

    // Export Data button
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            const userData = getUserData(email);
            if (userData) {
                const dataStr = JSON.stringify(userData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tradeVerse_data_' + new Date().toISOString().split('T')[0] + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }

    // Delete Account button
    const deleteBtn = document.getElementById('deleteAccount');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // Remove user data
                localStorage.removeItem('tradeVerseUser_' + email);

                // Remove from users list
                const users = JSON.parse(localStorage.getItem('tradeVerseUsers') || '{}');
                delete users[email];
                localStorage.setItem('tradeVerseUsers', JSON.stringify(users));

                // Clear session
                localStorage.removeItem('tradeVerseUser');

                alert('Account deleted successfully!');
                window.location.href = '../index.html';
            }
        });
    }
}
