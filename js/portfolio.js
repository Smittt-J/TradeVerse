/**
 * TradeNest - Portfolio Module
 * Handles portfolio display and management
 *
 * FIXES APPLIED:
 *  1. Removed dynamic data.js injection + setTimeout hack (data.js is now a
 *     proper <script> tag in portfolio.html, so it's guaranteed loaded first).
 *  2. Fixed typo: totalPLEElement -> totalPLElement (was throwing ReferenceError,
 *     which silently aborted loadPortfolioData and left all summary cards blank).
 *  3. Added startPriceEngine() so currentPrice values are live when P/L is computed.
 */

// Initialize portfolio page
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;

    // Start live price engine so current prices are available
    startPriceEngine();

    initializePortfolioPage();
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
    if (totalPLElement) {
        totalPLElement.textContent = (stats.profitLoss >= 0 ? '+' : '') + formatCurrency(stats.profitLoss);
        totalPLElement.style.color = stats.profitLoss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
    }
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
        if (tableContainer) tableContainer.classList.add('hidden');
        if (noHoldings) noHoldings.classList.remove('hidden');
        return;
    }

    if (tableContainer) tableContainer.classList.remove('hidden');
    if (noHoldings) noHoldings.classList.add('hidden');

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

    const numStocksEl = document.getElementById('numStocks');
    const totalSharesEl = document.getElementById('totalShares');
    if (numStocksEl) numStocksEl.textContent = stats.numStocks;
    if (totalSharesEl) totalSharesEl.textContent = stats.totalShares;

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

    if (bestElement) {
        if (bestPerformer.symbol !== '--') {
            const sign = bestPerformer.plPercent >= 0 ? '+' : '';
            bestElement.textContent = bestPerformer.symbol + ' (' + sign + bestPerformer.plPercent.toFixed(2) + '%)';
            bestElement.style.color = bestPerformer.plPercent >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
        } else {
            bestElement.textContent = '--';
        }
    }

    // Only show a distinct worst performer when 2+ different stocks are held.
    // With a single stock it would duplicate the best performer, which is misleading.
    if (worstElement) {
        if (holdings.length > 1 && worstPerformer.symbol !== '--') {
            const sign = worstPerformer.plPercent >= 0 ? '+' : '';
            worstElement.textContent = worstPerformer.symbol + ' (' + sign + worstPerformer.plPercent.toFixed(2) + '%)';
            worstElement.style.color = worstPerformer.plPercent >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
        } else {
            worstElement.textContent = '--';
            worstElement.style.color = '';
        }
    }
}
