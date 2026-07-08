/**
 * TradeVerse - Portfolio Module
 * Handles portfolio display and management
 */

// Load dependencies
const portfolioDataScript = document.createElement('script');
portfolioDataScript.src = '../js/data.js';
document.head.appendChild(portfolioDataScript);

// Initialize portfolio page
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;

    // Wait for data script to load
    setTimeout(function () {
        initializePortfolioPage();
    }, 100);
});

/**
 * Initialize the portfolio page
 */
function initializePortfolioPage() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../pages/login.html';
        return;
    }

    // Load portfolio data
    loadPortfolioData(user.email);

    // Load holdings table
    loadHoldingsTable(user.email);

    // Load portfolio summary
    loadPortfolioSummary(user.email);
}

/**
 * Load portfolio statistics
 */
function loadPortfolioData(email) {
    const stats = calculatePortfolioStats(email);
    if (!stats) return;

    // Update summary cards
    document.getElementById('availableBalance').textContent = formatCurrency(stats.balance);
    document.getElementById('totalInvestment').textContent = formatCurrency(stats.totalInvestment);
    document.getElementById('currentValue').textContent = formatCurrency(stats.currentValue);

    const totalPLElement = document.getElementById('totalPL');
    totalPLEElement.textContent = (stats.profitLoss >= 0 ? '+' : '') + formatCurrency(stats.profitLoss);
    totalPLEElement.style.color = stats.profitLoss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
}

/**
 * Load holdings table
 */
function loadHoldingsTable(email) {
    const holdings = getHoldings(email);
    const tbody = document.getElementById('holdingsBody');
    const noHoldings = document.getElementById('noHoldings');
    const tableContainer = document.querySelector('.table-container');

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
        const stockDetails = STOCKS.find(function (s) { return s.symbol === holding.symbol; });
        const stock = currentStocks.find(function (s) { return s.symbol === holding.symbol; });
        const currentPrice = stock ? stock.currentPrice : holding.avgPrice;

        const investedValue = holding.quantity * holding.avgPrice;
        const currentValue = holding.quantity * currentPrice;
        const pl = currentValue - investedValue;
        const plPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice * 100).toFixed(2);

        const row = document.createElement('tr');
        row.innerHTML = '\
            <td>' + (stockDetails ? stockDetails.name : holding.symbol) + '</td>\
            <td>' + holding.symbol + '</td>\
            <td>' + holding.quantity + '</td>\
            <td>' + formatCurrency(holding.avgPrice) + '</td>\
            <td>' + formatCurrency(currentPrice) + '</td>\
            <td>' + formatCurrency(investedValue) + '</td>\
            <td>' + formatCurrency(currentValue) + '</td>\
            <td class="' + (pl >= 0 ? 'profit' : 'loss') + '">' + (pl >= 0 ? '+' : '') + formatCurrency(pl) + ' (' + (pl >= 0 ? '+' : '') + plPercent + '%)</td>\
            <td><a href="trade.html?symbol=' + holding.symbol + '" class="btn btn-secondary btn-sm">Trade</a></td>\
        ';
        tbody.appendChild(row);
    });
}

/**
 * Load portfolio summary statistics
 */
function loadPortfolioSummary(email) {
    const stats = calculatePortfolioStats(email);
    if (!stats) return;

    document.getElementById('numStocks').textContent = stats.numStocks;
    document.getElementById('totalShares').textContent = stats.totalShares;

    // Find best and worst performers
    const holdings = getHoldings(email);
    const currentStocks = getStocks();

    let bestPerformer = { symbol: '--', plPercent: -Infinity };
    let worstPerformer = { symbol: '--', plPercent: Infinity };

    holdings.forEach(function (holding) {
        const stock = currentStocks.find(function (s) { return s.symbol === holding.symbol; });
        if (stock) {
            const plPercent = ((stock.currentPrice - holding.avgPrice) / holding.avgPrice * 100);

            if (plPercent > bestPerformer.plPercent) {
                bestPerformer = { symbol: holding.symbol, plPercent: plPercent };
            }
            if (plPercent < worstPerformer.plPercent) {
                worstPerformer = { symbol: holding.symbol, plPercent: plPercent };
            }
        }
    });

    const bestElement = document.getElementById('bestPerformer');
    const worstElement = document.getElementById('worstPerformer');

    if (bestPerformer.symbol !== '--') {
        bestElement.textContent = bestPerformer.symbol + ' (+' + bestPerformer.plPercent.toFixed(2) + '%)';
    }

    if (worstPerformer.symbol !== '--') {
        worstElement.textContent = worstPerformer.symbol + ' (' + worstPerformer.plPercent.toFixed(2) + '%)';
        worstElement.style.color = 'var(--accent-danger)';
    }
}
