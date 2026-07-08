/**
 * TradeVerse - Data Management & Price Engine Module
 * Handles stock data, live price fluctuation, and Local Storage operations
 */

// Dummy Indian Stocks Data with Base Prices
const STOCKS = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', basePrice: 2450 },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT', basePrice: 3580 },
    { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT', basePrice: 1420 },
    { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', basePrice: 620 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', basePrice: 980 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', basePrice: 1650 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', basePrice: 780 }
];

// Initial balance for new users
const INITIAL_BALANCE = 1000000;

// Price Engine State
let priceEngiVerseate = {
    isRunning: false,
    intervalId: null,
    subscribers: [],
    lastPrices: {},
    candleData: {}
};

// Initialize price data from storage or create defaults
function initializePriceData() {
    const storedPrices = getStoredStockPrices();
    const storedCandles = getStoredCandleData();

    STOCKS.forEach(function(stock) {
        // Initialize last prices
        if (!priceEngiVerseate.lastPrices[stock.symbol]) {
            priceEngiVerseate.lastPrices[stock.symbol] = storedPrices[stock.symbol] || stock.basePrice;
        }

        // Initialize candle data (OHLC format)
        if (!priceEngiVerseate.candleData[stock.symbol]) {
            if (storedCandles[stock.symbol] && storedCandles[stock.symbol].length > 0) {
                priceEngiVerseate.candleData[stock.symbol] = storedCandles[stock.symbol];
            } else {
                // Generate initial candle data
                priceEngiVerseate.candleData[stock.symbol] = generateInitialCandles(stock, 50);
            }
        }
    });
}

/**
 * Generate initial historical candle data
 */
function generateInitialCandles(stock, count) {
    const candles = [];
    let price = stock.basePrice;
    const now = new Date();

    for (let i = count; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000); // 1-minute candles

        // Generate OHLC with slight variations
        const volatility = price * 0.003; // 0.3% volatility

        // Generate price movement with some trend
        const trend = (Math.random() - 0.4) * 0.002; // Slight upward bias
        price = price * (1 + trend + (Math.random() - 0.5) * 0.005);

        const open = price;
        const high = open + Math.random() * volatility;
        const low = open - Math.random() * volatility;
        const close = low + Math.random() * (high - low);

        candles.push({
            time: timestamp.getTime(),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: Math.floor(Math.random() * 100000) + 10000
        });
    }

    return candles;
}

/**
 * Start the live price engine
 */
function startPriceEngine() {
    if (priceEngiVerseate.isRunning) return;

    initializePriceData();
    priceEngiVerseate.isRunning = true;

    // Update prices every 2 seconds
    priceEngiVerseate.intervalId = setInterval(function() {
        updateAllPrices();
    }, 2000);

    console.log('Price Engine Started');
}

/**
 * Stop the price engine
 */
function stopPriceEngine() {
    if (priceEngiVerseate.intervalId) {
        clearInterval(priceEngiVerseate.intervalId);
        priceEngiVerseate.intervalId = null;
    }
    priceEngiVerseate.isRunning = false;
}

/**
 * Update all stock prices with live fluctuation
 */
function updateAllPrices() {
    STOCKS.forEach(function(stock) {
        updateStockPrice(stock);
    });

    // Save to storage
    saveStockPrices(priceEngiVerseate.lastPrices);
    saveCandleData(priceEngiVerseate.candleData);

    // Notify all subscribers
    notifySubscribers();
}

/**
 * Update individual stock price
 */
function updateStockPrice(stock) {
    const lastPrice = priceEngiVerseate.lastPrices[stock.symbol];
    const candles = priceEngiVerseate.candleData[stock.symbol];

    // Generate price movement with market-like behavior
    const volatility = lastPrice * 0.002; // 0.2% per tick
    const momentum = Math.random() > 0.5 ? 1 : -1;
    const change = momentum * Math.random() * volatility;

    // Apply change with mean-reversion tendency
    let newPrice = lastPrice + change;

    // Mean reversion (prices tend back toward base)
    const deviationFromBase = (newPrice - stock.basePrice) / stock.basePrice;
    if (Math.abs(deviationFromBase) > 0.05) { // If more than 5% from base
        newPrice -= deviationFromBase * stock.basePrice * 0.1; // Gentle pull back
    }

    // Keep within reasonable bounds (base +/- 10%)
    const minPrice = stock.basePrice * 0.9;
    const maxPrice = stock.basePrice * 1.1;
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
    newPrice = parseFloat(newPrice.toFixed(2));

    // Update last price
    priceEngiVerseate.lastPrices[stock.symbol] = newPrice;

    // Update candle data
    if (candles && candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        const now = Date.now();

        // If more than 1 minute passed, create new candle
        if (now - lastCandle.time > 60000) {
            candles.push({
                time: now,
                open: newPrice,
                high: newPrice,
                low: newPrice,
                close: newPrice,
                volume: Math.floor(Math.random() * 50000) + 5000
            });

            // Keep only last 100 candles
            if (candles.length > 100) {
                candles.shift();
            }
        } else {
            // Update current candle
            lastCandle.close = newPrice;
            lastCandle.high = Math.max(lastCandle.high, newPrice);
            lastCandle.low = Math.min(lastCandle.low, newPrice);
            lastCandle.volume += Math.floor(Math.random() * 1000);
        }
    }
}

/**
 * Subscribe to price updates
 */
function subscribeToPrices(callback) {
    priceEngiVerseate.subscribers.push(callback);
    return priceEngiVerseate.subscribers.length - 1; // Return subscription ID
}

/**
 * Unsubscribe from price updates
 */
function unsubscribeFromPrices(subscriptionId) {
    priceEngiVerseate.subscribers[subscriptionId] = null;
}

/**
 * Notify all subscribers of price updates
 */
function notifySubscribers() {
    const updatedStocks = getStocks();
    priceEngiVerseate.subscribers.forEach(function(callback) {
        if (typeof callback === 'function') {
            callback(updatedStocks);
        }
    });
}

/**
 * Get all stocks with current prices and change
 */
function getStocks() {
    initializePriceData();

    return STOCKS.map(function(stock) {
        const lastPrice = priceEngiVerseate.lastPrices[stock.symbol] || stock.basePrice;

        // Calculate day change from opening price (first candle of recent data)
        const candles = priceEngiVerseate.candleData[stock.symbol] || [];
        const dayOpen = candles.length > 0 ? candles[0].open : stock.basePrice;
        const change = lastPrice - dayOpen;
        const changePercent = dayOpen > 0 ? ((change / dayOpen) * 100).toFixed(2) : 0;

        return {
            ...stock,
            currentPrice: lastPrice,
            change: Math.round(change * 100) / 100,
            changePercent: changePercent,
            isPositive: change >= 0,
            dayHigh: candles.length > 0 ? Math.max(...candles.map(c => c.high)) : lastPrice,
            dayLow: candles.length > 0 ? Math.min(...candles.map(c => c.low)) : lastPrice,
            volume: candles.length > 0 ? candles[candles.length - 1].volume : 0
        };
    });
}

/**
 * Get single stock by symbol
 */
function getStockBySymbol(symbol) {
    const stocks = getStocks();
    return stocks.find(function(s) { return s.symbol === symbol; });
}

/**
 * Get candle data for a stock
 */
function getCandleData(symbol) {
    initializePriceData();
    return priceEngiVerseate.candleData[symbol] || [];
}

/**
 * Get latest tick data (for live updates)
 */
function getLatestTickData(symbol) {
    const candles = getCandleData(symbol);
    if (candles.length === 0) return null;

    const lastCandle = candles[candles.length - 1];
    return {
        symbol: symbol,
        price: lastCandle.close,
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        volume: lastCandle.volume,
        time: lastCandle.time
    };
}

/**
 * Store updated stock prices
 */
function saveStockPrices(prices) {
    const priceData = {};
    Object.keys(prices).forEach(function(symbol) {
        priceData[symbol] = prices[symbol];
    });
    localStorage.setItem('tradeVerseStockPrices', JSON.stringify(priceData));
}

/**
 * Get stored stock prices
 */
function getStoredStockPrices() {
    const data = localStorage.getItem('tradeVerseStockPrices');
    return data ? JSON.parse(data) : {};
}

/**
 * Save candle data to storage
 */
function saveCandleData(candleData) {
    localStorage.setItem('tradeVerseCandleData', JSON.stringify(candleData));
}

/**
 * Get stored candle data
 */
function getStoredCandleData() {
    const data = localStorage.getItem('tradeVerseCandleData');
    return data ? JSON.parse(data) : {};
}

/**
 * Initialize storage for new user
 */
function initializeUserData(user) {
    const userData = {
        fullName: user.fullName,
        email: user.email,
        balance: INITIAL_BALANCE,
        holdings: [],
        trades: [],
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('tradeVerseUser_' + user.email, JSON.stringify(userData));
    return userData;
}

/**
 * Get user data from storage
 */
function getUserData(email) {
    const key = 'tradeVerseUser_' + email;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Save user data to storage
 */
function saveUserData(email, data) {
    const key = 'tradeVerseUser_' + email;
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get user holdings
 */
function getHoldings(email) {
    const userData = getUserData(email);
    return userData ? userData.holdings : [];
}

/**
 * Get user trades
 */
function getTrades(email) {
    const userData = getUserData(email);
    return userData ? userData.trades : [];
}

/**
 * Get user balance
 */
function getBalance(email) {
    const userData = getUserData(email);
    return userData ? userData.balance : INITIAL_BALANCE;
}

/**
 * Get user's total realized P/L
 */
function getRealizedPL(email) {
    const userData = getUserData(email);
    return userData ? (userData.realizedPL || 0) : 0;
}

/**
 * Execute a trade (buy or sell)
 */
function executeTrade(email, symbol, type, quantity, price) {
    const userData = getUserData(email);
    if (!userData) return { success: false, message: 'User not found' };

    const totalAmount = quantity * price;
    const brokerage = Math.round(totalAmount * 0.001 * 100) / 100;
    const finalAmount = totalAmount + brokerage;

    // Initialize realizedPL if not exists
    if (!userData.realizedPL) {
        userData.realizedPL = 0;
    }

    // Variable to track realized P/L for this trade
    let realizedPL = 0;

    if (type === 'buy') {
        if (userData.balance < finalAmount) {
            return { success: false, message: 'Insufficient balance' };
        }

        userData.balance -= finalAmount;

        const existingHolding = userData.holdings.find(function(h) { return h.symbol === symbol; });
        if (existingHolding) {
            const totalQty = existingHolding.quantity + quantity;
            const totalValue = (existingHolding.quantity * existingHolding.avgPrice) + totalAmount;
            existingHolding.quantity = totalQty;
            existingHolding.avgPrice = Math.round((totalValue / totalQty) * 100) / 100;
        } else {
            userData.holdings.push({
                symbol: symbol,
                quantity: quantity,
                avgPrice: price,
                buyDate: new Date().toISOString()
            });
        }
    } else if (type === 'sell') {
        const holding = userData.holdings.find(function(h) { return h.symbol === symbol; });
        if (!holding || holding.quantity < quantity) {
            return { success: false, message: 'Insufficient shares to sell' };
        }

        // Calculate realized P/L for this sell
        // P/L = (Sell Price - Buy Price) * Quantity - Brokerage
        const buyValue = holding.avgPrice * quantity;
        const sellValue = totalAmount;
        realizedPL = sellValue - buyValue - brokerage;

        // Add to total realized P/L
        userData.realizedPL += realizedPL;

        userData.balance += (totalAmount - brokerage);

        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            userData.holdings = userData.holdings.filter(function(h) { return h.symbol !== symbol; });
        }
    }

    userData.trades.push({
        id: Date.now(),
        symbol: symbol,
        type: type,
        quantity: quantity,
        price: price,
        totalAmount: totalAmount,
        brokerage: brokerage,
        realizedPL: type === 'sell' ? realizedPL : 0,
        timestamp: new Date().toISOString()
    });

    saveUserData(email, userData);

    return {
        success: true,
        message: type === 'buy' ? 'Stock purchased successfully!' : 'Stock sold successfully!',
        newBalance: userData.balance,
        realizedPL: realizedPL
    };
}

/**
 * Calculate portfolio statistics
 */
function calculatePortfolioStats(email) {
    const userData = getUserData(email);
    if (!userData) return null;

    const stocks = getStocks();
    let totalInvestment = 0;
    let currentValue = 0;
    let totalShares = 0;

    userData.holdings.forEach(function(holding) {
        const stock = stocks.find(function(s) { return s.symbol === holding.symbol; });
        if (stock) {
            totalInvestment += holding.quantity * holding.avgPrice;
            currentValue += holding.quantity * stock.currentPrice;
            totalShares += holding.quantity;
        }
    });

    const profitLoss = currentValue - totalInvestment;
    const plPercent = totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100).toFixed(2) : 0;

    return {
        balance: userData.balance,
        totalInvestment: totalInvestment,
        currentValue: currentValue,
        profitLoss: profitLoss,
        plPercent: plPercent,
        totalShares: totalShares,
        numStocks: userData.holdings.length
    };
}

// Auto-start price engine when script loads
if (typeof window !== 'undefined') {
    initializePriceData();
}
