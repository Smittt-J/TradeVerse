/**
 * TradeVerse - History Module
 * Handles trade history display and management with realized P/L
 */

let allTrades = [];
let currentFilter = { type: 'all', stock: 'all', sort: 'newest' };

// Initialize history page
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;

    // Start price engine for live prices
    startPriceEngine();

    setTimeout(function () {
        initializeHistoryPage();
    }, 100);
});

/**
 * Initialize the history page
 */
function initializeHistoryPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Load trade history
    loadTradeHistory(user.email);

    // Setup filter listeners
    setupFilterListeners();

    // Setup clear history button
    setupClearHistory(user.email);
}

/**
 * Load and display trade history
 */
function loadTradeHistory(email) {
    allTrades = getTrades(email);
    const filteredTrades = filterTrades(allTrades);

    // Update summary stats
    updateHistoryStats(allTrades, email);

    // Update stock filter dropdown
    populateStockFilter(allTrades);

    // Display trades
    displayTrades(filteredTrades);
}

/**
 * Filter trades based on current filters
 */
function filterTrades(trades) {
    let filtered = trades.slice();

    // Filter by type
    if (currentFilter.type !== 'all') {
        filtered = filtered.filter(function (t) { return t.type === currentFilter.type; });
    }

    // Filter by stock
    if (currentFilter.stock !== 'all') {
        filtered = filtered.filter(function (t) { return t.symbol === currentFilter.stock; });
    }

    // Sort trades
    if (currentFilter.sort === 'newest') {
        filtered.reverse();
    }

    return filtered;
}

/**
 * Display trades in table with realized P/L
 */
function displayTrades(trades) {
    const tbody = document.getElementById('historyBody');
    const noHistory = document.getElementById('noHistory');
    const tableContainer = document.querySelector('.table-container');

    if (!tbody) return;

    if (trades.length === 0) {
        tableContainer.classList.add('hidden');
        noHistory.classList.remove('hidden');
        return;
    }

    tableContainer.classList.remove('hidden');
    noHistory.classList.add('hidden');

    tbody.innerHTML = '';
    trades.forEach(function (trade) {
        // Calculate realized P/L for sell trades
        let plDisplay = '--';
        let plClass = '';

        if (trade.type === 'sell' && trade.realizedPL !== undefined) {
            const pl = trade.realizedPL;
            plDisplay = (pl >= 0 ? '+' : '') + formatCurrency(pl);
            plClass = pl >= 0 ? 'profit' : 'loss';
        }

        const row = document.createElement('tr');
        row.innerHTML = '\
            <td>' + formatDate(trade.timestamp) + '</td>\
            <td>' + trade.symbol + '</td>\
            <td><span class="badge ' + (trade.type === 'buy' ? 'badge-success' : 'badge-danger') + '">' + trade.type.toUpperCase() + '</span></td>\
            <td>' + trade.quantity + '</td>\
            <td>' + formatCurrency(trade.price) + '</td>\
            <td>' + formatCurrency(trade.totalAmount) + '</td>\
            <td>' + formatCurrency(trade.brokerage) + '</td>\
            <td style="font-weight: 600;" class="' + plClass + '">' + plDisplay + '</td>\
        ';
        tbody.appendChild(row);
    });
}

/**
 * Update history statistics including realized P/L
 */
function updateHistoryStats(trades, email) {
    const totalTrades = trades.length;
    const buyOrders = trades.filter(function (t) { return t.type === 'buy'; }).length;
    const sellOrders = trades.filter(function (t) { return t.type === 'sell'; }).length;
    const totalVolume = trades.reduce(function (sum, t) { return sum + t.totalAmount; }, 0);

    // Calculate total realized P/L from sell trades
    let totalRealizedPL = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    trades.forEach(function (trade) {
        if (trade.type === 'sell' && trade.realizedPL !== undefined) {
            totalRealizedPL += trade.realizedPL;
            if (trade.realizedPL > 0) {
                winningTrades++;
            } else if (trade.realizedPL < 0) {
                losingTrades++;
            }
        }
    });

    // Update DOM elements
    document.getElementById('totalTrades').textContent = totalTrades;
    document.getElementById('buyOrders').textContent = buyOrders;
    document.getElementById('sellOrders').textContent = sellOrders;
    document.getElementById('totalVolume').textContent = formatCurrency(totalVolume);

    // Update realized P/L display
    const totalPLEl = document.getElementById('totalRealizedPL');
    if (totalPLEl) {
        totalPLEl.textContent = (totalRealizedPL >= 0 ? '+' : '') + formatCurrency(totalRealizedPL);
        totalPLEl.style.color = totalRealizedPL >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
    }

    // Update winning/losing trades count
    const winningEl = document.getElementById('winningTrades');
    const losingEl = document.getElementById('losingTrades');
    if (winningEl) winningEl.textContent = winningTrades;
    if (losingEl) losingEl.textContent = losingTrades;
}

/**
 * Populate stock filter dropdown
 */
function populateStockFilter(trades) {
    const select = document.getElementById('filterStock');
    if (!select) return;

    const uniqueStocks = [...new Set(trades.map(function (t) { return t.symbol; }))];

    select.innerHTML = '<option value="all">All Stocks</option>';
    uniqueStocks.forEach(function (symbol) {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = symbol;
        select.appendChild(option);
    });
}

/**
 * Setup filter event listeners
 */
function setupFilterListeners() {
    const filterType = document.getElementById('filterType');
    const filterStock = document.getElementById('filterStock');
    const sortOrder = document.getElementById('sortOrder');

    if (filterType) {
        filterType.addEventListener('change', function () {
            currentFilter.type = this.value;
            displayTrades(filterTrades(allTrades));
        });
    }

    if (filterStock) {
        filterStock.addEventListener('change', function () {
            currentFilter.stock = this.value;
            displayTrades(filterTrades(allTrades));
        });
    }

    if (sortOrder) {
        sortOrder.addEventListener('change', function () {
            currentFilter.sort = this.value;
            displayTrades(filterTrades(allTrades));
        });
    }
}

/**
 * Setup clear history button
 */
function setupClearHistory(email) {
    const clearBtn = document.getElementById('clearHistory');
    if (!clearBtn) return;

    clearBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to clear all trade history? This action cannot be undone.')) {
            const userData = getUserData(email);
            if (userData) {
                userData.trades = [];
                userData.holdings = [];
                userData.balance = INITIAL_BALANCE;
                userData.realizedPL = 0;
                saveUserData(email, userData);
                loadTradeHistory(email);
            }
        }
    });
}
