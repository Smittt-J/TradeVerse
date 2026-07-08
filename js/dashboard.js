/**
 * TradeVerse - Dashboard Module
 * Handles dashboard display with live prices and candlestick chart
 */

// Global variables
let candlestickChart = null;
let selectedStockSymbol = 'RELIANCE';
let priceUpdateSubscription = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;
    initializeDashboard();
});

/**
 * Initialize the dashboard
 */
function initializeDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Update user name
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.fullName.split(' ')[0];
    }

    // Start the price engine
    startPriceEngine();

    // Populate stock selector
    populateStockSelector();

    // Load dashboard data
    loadDashboardData(user.email);

    // Initialize candlestick chart
    initCandlestickChart();

    // Subscribe to live price updates
    subscribeToLiveUpdates();

    // Setup chart tab listeners
    setupChartTabs();

    // Load recent trades
    loadRecentTrades(user.email);

    // Load watchlist
    loadStockWatchlist();

    // Handle window resize for chart
    window.addEventListener('resize', handleChartResize);
}

/**
 * Populate stock selector dropdown
 */
function populateStockSelector() {
    const stocks = getStocks();
    const selector = document.getElementById('stockSelector');
    if (!selector) return;

    selector.innerHTML = '';
    stocks.forEach(function (stock) {
        const option = document.createElement('option');
        option.value = stock.symbol;
        option.textContent = stock.symbol + ' - ' + stock.name;
        if (stock.symbol === selectedStockSymbol) {
            option.selected = true;
        }
        selector.appendChild(option);
    });

    selector.addEventListener('change', function () {
        selectedStockSymbol = this.value;
        updateChartForStock(selectedStockSymbol);
    });
}

/**
 * Subscribe to live price updates
 */
function subscribeToLiveUpdates() {
    priceUpdateSubscription = subscribeToPrices(function (stocks) {
        updateLiveTicker(stocks);
        updateChartInfo(stocks);
        loadStockWatchlist();
        loadDashboardData(getCurrentUser().email);
    });
}

/**
 * Update live market ticker
 */
function updateLiveTicker(stocks) {
    const ticker = document.getElementById('marketTicker');
    if (!ticker) return;

    ticker.innerHTML = '';
    stocks.forEach(function (stock) {
        const item = document.createElement('span');
        item.style.whiteSpace = 'nowrap';
        item.innerHTML = '\
            <span style="color: var(--text-secondary);">' + stock.symbol + '</span>\
            <span style="margin: 0 0.5rem;">' + formatCurrency(stock.currentPrice) + '</span>\
            <span style="color: ' + (stock.isPositive ? 'var(--accent-success)' : 'var(--accent-danger)') + ';">\
                ' + (stock.isPositive ? '+' : '') + stock.changePercent + '%\
            </span>\
        ';
        ticker.appendChild(item);
    });
}

/**
 * Load and display dashboard data
 */
function loadDashboardData(email) {
    const stats = calculatePortfolioStats(email);
    if (!stats) return;

    // Update balance cards
    document.getElementById('virtualBalance').textContent = formatCurrency(stats.balance);
    document.getElementById('totalInvestment').textContent = formatCurrency(stats.totalInvestment);
    document.getElementById('portfolioValue').textContent = formatCurrency(stats.currentValue);
    document.getElementById('totalPL').textContent = formatCurrency(stats.profitLoss);

    // Update P/L styling
    const plElement = document.getElementById('totalPL');
    const plChangeElement = document.getElementById('portfolioChange');
    const plPercentElement = document.getElementById('plPercent');

    if (stats.profitLoss >= 0) {
        plElement.style.color = 'var(--accent-success)';
        plChangeElement.textContent = '+' + stats.plPercent + '%';
        plChangeElement.className = 'balance-change positive';
        plPercentElement.textContent = '+' + stats.plPercent + '% return';
        plPercentElement.className = 'balance-change positive';
    } else {
        plElement.style.color = 'var(--accent-danger)';
        plChangeElement.textContent = stats.plPercent + '%';
        plChangeElement.className = 'balance-change negative';
        plPercentElement.textContent = stats.plPercent + '% return';
        plPercentElement.className = 'balance-change negative';
    }
}

/**
 * Initialize candlestick chart
 */
function initCandlestickChart() {
    const container = document.getElementById('candlestickChartContainer');
    if (!container) return;

    // Calculate chart dimensions
    const containerWidth = container.offsetWidth;
    const chartWidth = Math.max(600, containerWidth);
    const chartHeight = 350;

    // Create chart instance
    candlestickChart = new CandlestickChart('candlestickChartContainer', {
        width: chartWidth,
        height: chartHeight,
        candleWidth: 6,
        candleGap: 2,
        showVolume: true,
        volumeHeight: 50
    });

    // Load initial data
    updateChartForStock(selectedStockSymbol);
}

/**
 * Update chart for selected stock
 */
function updateChartForStock(symbol) {
    if (!candlestickChart) return;

    const stock = getStockBySymbol(symbol);
    if (!stock) return;

    // Update title
    document.getElementById('chartStockTitle').textContent = stock.name;
    document.getElementById('chartStockSymbol').textContent = symbol;

    // Get candle data
    const candles = getCandleData(symbol);
    candlestickChart.setData(candles);

    // Update info
    updateChartInfo(getStocks());
}

/**
 * Update chart info display
 */
function updateChartInfo(stocks) {
    const stock = stocks.find(function (s) { return s.symbol === selectedStockSymbol; });
    if (!stock) return;

    document.getElementById('chartOpen').textContent = stock.basePrice.toFixed(2);
    document.getElementById('chartHigh').textContent = stock.dayHigh ? stock.dayHigh.toFixed(2) : stock.currentPrice.toFixed(2);
    document.getElementById('chartLow').textContent = stock.dayLow ? stock.dayLow.toFixed(2) : stock.currentPrice.toFixed(2);
    document.getElementById('chartClose').textContent = stock.currentPrice.toFixed(2);
    document.getElementById('chartClose').style.color = stock.isPositive ? 'var(--accent-success)' : 'var(--accent-danger)';

    const changeEl = document.getElementById('chartChange');
    if (changeEl) {
        changeEl.textContent = (stock.isPositive ? '+' : '') + stock.changePercent + '%';
        changeEl.style.color = stock.isPositive ? 'var(--accent-success)' : 'var(--accent-danger)';
    }

    // Update chart data
    const candles = getCandleData(selectedStockSymbol);
    if (candlestickChart && candles.length > 0) {
        candlestickChart.setData(candles);
    }
}

/**
 * Handle chart resize
 */
function handleChartResize() {
    const container = document.getElementById('candlestickChartContainer');
    if (container && candlestickChart) {
        const width = container.offsetWidth;
        candlestickChart.resize(width, 350);
    }
}

/**
 * Setup chart period tabs
 */
function setupChartTabs() {
    const tabs = document.querySelectorAll('.chart-tab');

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');

            // Refresh chart data
            updateChartForStock(selectedStockSymbol);
        });
    });
}

/**
 * Load stock watchlist with live prices
 */
function loadStockWatchlist() {
    const stocks = getStocks();
    const tbody = document.getElementById('stocksWatchlist');
    if (!tbody) return;

    tbody.innerHTML = '';
    stocks.forEach(function (stock) {
        const row = document.createElement('tr');
        row.innerHTML = '\
            <td>\
                <strong>' + stock.name + '</strong><br>\
                <span style="color: var(--text-muted); font-size: 0.75rem;">' + stock.symbol + '</span>\
            </td>\
            <td style="font-weight: 600;">' + formatCurrency(stock.currentPrice) + '</td>\
            <td class="' + (stock.isPositive ? 'profit' : 'loss') + '">' + (stock.isPositive ? '+' : '') + stock.changePercent + '%</td>\
            <td>' + formatCurrency(stock.dayHigh || stock.currentPrice) + '</td>\
            <td>' + formatCurrency(stock.dayLow || stock.currentPrice) + '</td>\
            <td>' + (stock.volume ? (stock.volume / 1000).toFixed(1) + 'K' : '--') + '</td>\
            <td>\
                <a href="trade.html?symbol=' + stock.symbol + '" class="btn btn-' + (stock.isPositive ? 'success' : 'danger') + ' btn-sm">Trade</a>\
            </td>\
        ';
        tbody.appendChild(row);
    });
}

/**
 * Load recent trades for dashboard
 */
function loadRecentTrades(email) {
    const trades = getTrades(email);
    const tbody = document.getElementById('recentTradesBody');
    const noTrades = document.getElementById('noTrades');
    const tableContainer = document.getElementById('recentTrades').querySelector('table').parentElement;

    if (!tbody) return;

    if (trades.length === 0) {
        tableContainer.classList.add('hidden');
        noTrades.classList.remove('hidden');
        return;
    }

    tableContainer.classList.remove('hidden');
    noTrades.classList.add('hidden');

    const recentTrades = trades.slice(-5).reverse();

    tbody.innerHTML = '';
    recentTrades.forEach(function (trade) {
        const stock = STOCKS.find(function (s) { return s.symbol === trade.symbol; });
        const stockName = stock ? stock.name : trade.symbol;

        const row = document.createElement('tr');
        row.innerHTML = '\
            <td>' + stockName + ' (' + trade.symbol + ')</td>\
            <td><span class="badge ' + (trade.type === 'buy' ? 'badge-success' : 'badge-danger') + '">' + trade.type.toUpperCase() + '</span></td>\
            <td>' + trade.quantity + '</td>\
            <td>' + formatCurrency(trade.price) + '</td>\
            <td>' + formatShortDate(trade.timestamp) + '</td>\
        ';
        tbody.appendChild(row);
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', function () {
    if (priceUpdateSubscription !== null) {
        unsubscribeFromPrices(priceUpdateSubscription);
    }
});

