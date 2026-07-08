/**
 * TradeVerse - Trade Module
 * Handles buying and selling stocks with live prices and candlestick chart
 */

// Global variables
let selectedStock = null;
let tradeType = 'buy';
let stocks = [];
let tradeChartSubscription = null;
let candlestickChart = null;
let allStocksSubscription = null;

// Initialize trade page
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;
    initializeTradePage();
});

/**
 * Initialize the trade page
 */
function initializeTradePage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Start the price engine
    startPriceEngine();

    // Load stocks
    stocks = getStocks();
    loadStocks();

    // Update balance
    updateBalanceDisplay(user.email);

    // Setup form
    setupTradeForm();

    // Initialize candlestick chart
    initCandlestickChart();

    // Subscribe to live price updates
    subscribeToPriceUpdates();

    // Load holdings preview
    loadHoldingsPreview(user.email);

    // Setup quantity input listener
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateTradeSummary);
    }

    // Check URL for preselected stock
    checkURLParams();

    // Handle window resize for chart
    window.addEventListener('resize', handleChartResize);
}

/**
 * Check URL parameters for preselected stock
 */
function checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const symbol = params.get('symbol');
    if (symbol) {
        const stock = stocks.find(function (s) { return s.symbol === symbol; });
        if (stock) {
            selectStock(stock);
        }
    }
}

/**
 * Subscribe to live price updates
 */
function subscribeToPriceUpdates() {
    // Update all stocks
    allStocksSubscription = subscribeToPrices(function (updatedStocks) {
        stocks = updatedStocks;
        updateStockListUI();
        updateLiveTicker(stocks);

        // Update selected stock info
        if (selectedStock) {
            const updatedSelected = stocks.find(function (s) { return s.symbol === selectedStock.symbol; });
            if (updatedSelected) {
                selectedStock = updatedSelected;
                updateSelectedStockUI();
                updateTradeSummary();
            }
        }

        // Update chart
        updateChartForSelected();

        // Update holdings preview
        const user = getCurrentUser();
        if (user) {
            loadHoldingsPreview(user.email);
        }
    });
}

/**
 * Update live market ticker
 */
function updateLiveTicker(stocksData) {
    const ticker = document.getElementById('marketTicker');
    if (!ticker) return;

    ticker.innerHTML = '';
    stocksData.slice(0, 5).forEach(function (stock) {
        const item = document.createElement('span');
        item.style.whiteSpace = 'nowrap';
        item.style.fontSize = '0.875rem';
        item.innerHTML = '\
            <span style="color: var(--text-secondary);">' + stock.symbol + '</span>\
            <span style="margin: 0 0.25rem; font-weight: 500;">' + formatCurrency(stock.currentPrice) + '</span>\
            <span style="color: ' + (stock.isPositive ? 'var(--accent-success)' : 'var(--accent-danger)') + ';">\
                ' + (stock.isPositive ? '+' : '') + stock.changePercent + '%\
            </span>\
        ';
        ticker.appendChild(item);
    });
}

/**
 * Load available stocks list
 */
function loadStocks() {
    const stockListEl = document.getElementById('stockList');
    if (!stockListEl) return;

    renderStockList();
}

/**
 * Render stock list UI
 */
function renderStockList() {
    const stockListEl = document.getElementById('stockList');
    if (!stockListEl) return;

    stockListEl.innerHTML = '';

    stocks.forEach(function (stock) {
        const item = document.createElement('div');
        item.className = 'stock-item' + (selectedStock && selectedStock.symbol === stock.symbol ? ' selected' : '');
        item.dataset.symbol = stock.symbol;
        item.innerHTML = '\
            <div class="stock-details">\
                <h4>' + stock.name + '</h4>\
                <span>' + stock.symbol + ' | ' + stock.sector + '</span>\
            </div>\
            <div class="stock-price-info">\
                <div class="price">' + formatCurrency(stock.currentPrice) + '</div>\
                <div class="change ' + (stock.isPositive ? 'profit' : 'loss') + '">' + (stock.isPositive ? '+' : '') + stock.changePercent + '%</div>\
            </div>\
        ';

        item.addEventListener('click', function () {
            selectStock(stock);
        });

        stockListEl.appendChild(item);
    });

    // Select first stock by default
    if (!selectedStock && stocks.length > 0) {
        selectStock(stocks[0]);
    }
}

/**
 * Update stock list UI with live prices
 */
function updateStockListUI() {
    stockItems = document.querySelectorAll('.stock-item');
    stockItems.forEach(function (item) {
        const symbol = item.dataset.symbol;
        const stock = stocks.find(function (s) { return s.symbol === symbol; });
        if (stock) {
            item.querySelector('.price').textContent = formatCurrency(stock.currentPrice);
            item.querySelector('.change').textContent = (stock.isPositive ? '+' : '') + stock.changePercent + '%';
            item.querySelector('.change').className = 'change ' + (stock.isPositive ? 'profit' : 'loss');
        }
    });
}

/**
 * Select a stock for trading
 */
function selectStock(stock) {
    selectedStock = stock;

    // Update UI
    document.querySelectorAll('.stock-item').forEach(function (item) {
        item.classList.remove('selected');
        if (item.dataset.symbol === stock.symbol) {
            item.classList.add('selected');
        }
    });

    updateSelectedStockUI();
    updateChartForSelected();
}

/**
 * Update selected stock UI elements
 */
function updateSelectedStockUI() {
    if (!selectedStock) return;

    document.getElementById('selectedStockName').textContent = selectedStock.name + ' (' + selectedStock.symbol + ')';
    document.getElementById('selectedStockPrice').textContent = formatCurrency(selectedStock.currentPrice);
    document.getElementById('selectedStockChange').textContent = (selectedStock.isPositive ? '+' : '') + selectedStock.changePercent + '%';
    document.getElementById('selectedStockChange').className = 'stock-change ' + (selectedStock.isPositive ? 'profit' : 'loss');
    document.getElementById('price').value = selectedStock.currentPrice.toFixed(2);

    updateTradeSummary();
}

/**
 * Setup trade form with buy/sell toggle
 */
function setupTradeForm() {
    const buyBtn = document.querySelector('.trade-type-btn.buy');
    const sellBtn = document.querySelector('.trade-type-btn.sell');
    const tradeForm = document.getElementById('tradeForm');

    if (buyBtn) {
        buyBtn.addEventListener('click', function () {
            setTradeType('buy');
        });
    }

    if (sellBtn) {
        sellBtn.addEventListener('click', function () {
            setTradeType('sell');
        });
    }

    if (tradeForm) {
        tradeForm.addEventListener('submit', handleTradeSubmit);
    }
}

/**
 * Set trade type (buy/sell)
 */
function setTradeType(type) {
    tradeType = type;

    const buyBtn = document.querySelector('.trade-type-btn.buy');
    const sellBtn = document.querySelector('.trade-type-btn.sell');
    const submitBtn = document.getElementById('submitTradeBtn');

    if (type === 'buy') {
        buyBtn.classList.add('active');
        sellBtn.classList.remove('active');
        submitBtn.textContent = 'Buy Now';
        submitBtn.className = 'btn btn-success btn-block btn-lg';
    } else {
        buyBtn.classList.remove('active');
        sellBtn.classList.add('active');
        submitBtn.textContent = 'Sell Now';
        submitBtn.className = 'btn btn-danger btn-block btn-lg';
    }
}

/**
 * Update trade summary calculations
 */
function updateTradeSummary() {
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const price = parseFloat(selectedStock?.currentPrice) || 0;

    const subtotal = quantity * price;
    const brokerage = Math.round(subtotal * 0.1) / 100;
    const total = subtotal + brokerage;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('brokerage').textContent = formatCurrency(brokerage);
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

/**
 * Update balance display
 */
function updateBalanceDisplay(email) {
    const balance = getBalance(email);
    document.getElementById('availableBalance').textContent = formatCurrency(balance);
}

/**
 * Initialize candlestick chart for trade page
 */
function initCandlestickChart() {
    const container = document.getElementById('candlestickChartContainer');
    if (!container) return;

    const containerWidth = container.offsetWidth || 800;
    const chartWidth = Math.max(600, containerWidth);
    const chartHeight = 300;

    candlestickChart = new CandlestickChart('candlestickChartContainer', {
        width: chartWidth,
        height: chartHeight,
        candleWidth: 5,
        candleGap: 1,
        showVolume: true,
        volumeHeight: 40
    });

    if (selectedStock) {
        updateChartForSelected();
    }
}

/**
 * Update chart for selected stock
 */
function updateChartForSelected() {
    if (!candlestickChart || !selectedStock) return;

    document.getElementById('chartStockTitle').textContent = selectedStock.name;
    document.getElementById('chartStockSymbol').textContent = selectedStock.symbol;

    // Update price info
    document.getElementById('chartOpen').textContent = selectedStock.basePrice.toFixed(2);
    document.getElementById('chartHigh').textContent = (selectedStock.dayHigh || selectedStock.currentPrice).toFixed(2);
    document.getElementById('chartLow').textContent = (selectedStock.dayLow || selectedStock.currentPrice).toFixed(2);
    document.getElementById('chartClose').textContent = selectedStock.currentPrice.toFixed(2);
    document.getElementById('chartClose').style.color = selectedStock.isPositive ? 'var(--accent-success)' : 'var(--accent-danger)';

    const changeEl = document.getElementById('chartChange');
    if (changeEl) {
        changeEl.textContent = (selectedStock.isPositive ? '+' : '') + selectedStock.changePercent + '%';
        changeEl.style.color = selectedStock.isPositive ? 'var(--accent-success)' : 'var(--accent-danger)';
    }

    // Update candle data
    const candles = getCandleData(selectedStock.symbol);
    if (candles.length > 0) {
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
        candlestickChart.resize(width, 300);
    }
}

/**
 * Load holdings preview on trade page
 */
function loadHoldingsPreview(email) {
    const holdings = getHoldings(email);
    const tbody = document.getElementById('holdingsBody');
    const noHoldings = document.getElementById('noHoldings');
    const tableContainer = document.getElementById('holdingsPreview');

    if (!tbody) return;

    if (holdings.length === 0) {
        tableContainer.classList.add('hidden');
        noHoldings.classList.remove('hidden');
        return;
    }

    tableContainer.classList.remove('hidden');
    noHoldings.classList.add('hidden');

    const currentStocks = getStocks();

    tbody.innerHTML = '';
    holdings.forEach(function (holding) {
        const stock = currentStocks.find(function (s) { return s.symbol === holding.symbol; });
        const currentPrice = stock ? stock.currentPrice : holding.avgPrice;
        const pl = (currentPrice - holding.avgPrice) * holding.quantity;
        const plPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice * 100).toFixed(2);

        const row = document.createElement('tr');
        row.innerHTML = '\
            <td>' + holding.symbol + '</td>\
            <td>' + holding.quantity + '</td>\
            <td>' + formatCurrency(holding.avgPrice) + '</td>\
            <td style="font-weight: 500;">' + formatCurrency(currentPrice) + '</td>\
            <td class="' + (pl >= 0 ? 'profit' : 'loss') + '">' + (pl >= 0 ? '+' : '') + formatCurrency(pl) + '</td>\
        ';
        tbody.appendChild(row);
    });
}

/**
 * Handle trade form submission
 */
function handleTradeSubmit(e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) return;

    if (!selectedStock) {
        showAlert('tradeAlert', 'Please select a stock first', 'danger');
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(selectedStock.currentPrice);

    if (quantity <= 0 || isNaN(quantity)) {
        showAlert('tradeAlert', 'Please enter a valid quantity', 'danger');
        return;
    }

    const result = executeTrade(user.email, selectedStock.symbol, tradeType, quantity, price);

    if (result.success) {
        showAlert('tradeAlert', result.message, 'success');

        updateBalanceDisplay(user.email);
        loadHoldingsPreview(user.email);
        document.getElementById('quantity').value = 1;
        updateTradeSummary();
    } else {
        showAlert('tradeAlert', result.message, 'danger');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function () {
    if (allStocksSubscription !== null) {
        unsubscribeFromPrices(allStocksSubscription);
    }
});
