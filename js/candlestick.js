/**
 * TradeVerse - Candlestick Chart Component
 * Draws a lightweight candlestick chart without external libraries
 */

class CandlestickChart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.candles = [];
        this.options = {
            width: options.width || 800,
            height: options.height || 400,
            candleWidth: options.candleWidth || 8,
            candleGap: options.candleGap || 4,
            padding: options.padding || 50,
            gridLines: options.gridLines !== false,
            volumeHeight: options.volumeHeight || 60,
            showVolume: options.showVolume !== false,
            ...options
        };

        this.colors = {
            background: '#161b22',
            border: '#30363d',
            grid: '#21262d',
            text: '#8b949e',
            bullish: '#3fb950',
            bearish: '#da3633',
            wick: null,
            priceLine: '#58a6ff',
            crosshair: 'rgba(88, 166, 255, 0.3)'
        };

        this.crosshair = { x: null, y: null };
        this.tooltipData = null;

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'candlestick-canvas';
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.borderRadius = '10px';
        this.canvas.style.backgroundColor = this.colors.background;

        this.ctx = this.canvas.getContext('2d');

        // Clear container and add canvas
        if (this.container) {
            this.container.innerHTML = '';
            this.container.appendChild(this.canvas);
        }

        // Setup interaction
        this.setupInteraction();

        // Initial draw
        this.draw();
    }

    setupInteraction() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            this.crosshair.x = (e.clientX - rect.left) * scaleX;
            this.crosshair.y = (e.clientY - rect.top) * scaleX;
            this.draw();
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.crosshair.x = null;
            this.crosshair.y = null;
            this.draw();
        });
    }

    setData(candles) {
        this.candles = candles || [];
        this.draw();
    }

    calculateBounds() {
        if (this.candles.length === 0) {
            return { minPrice: 0, maxPrice: 100, maxVolume: 1000 };
        }

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let maxVolume = 0;

        this.candles.forEach(candle => {
            minPrice = Math.min(minPrice, candle.low);
            maxPrice = Math.max(maxPrice, candle.high);
            maxVolume = Math.max(maxVolume, candle.volume || 0);
        });

        // Add padding
        const priceRange = maxPrice - minPrice || 10;
        minPrice -= priceRange * 0.1;
        maxPrice += priceRange * 0.1;

        return { minPrice, maxPrice, maxVolume };
    }

    draw() {
        if (!this.ctx || !this.canvas) return;

        const { width, height, padding, showVolume, volumeHeight } = this.options;
        const w = width;
        const h = height;

        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, w, h);

        if (this.candles.length === 0) {
            // Draw empty state
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '14px Segoe UI';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('No data available', w / 2, h / 2);
            return;
        }

        const bounds = this.calculateBounds();
        const chartHeight = showVolume ? h - padding * 2 - volumeHeight : h - padding * 2;
        const chartTop = padding;
        const chartWidth = w - padding * 2;

        // Price scale
        const priceScale = chartHeight / (bounds.maxPrice - bounds.minPrice);

        // Draw grid lines
        if (this.options.gridLines) {
            this.drawGridLines(w, h, padding, bounds, chartHeight);
        }

        // Draw volume bars
        if (showVolume) {
            this.drawVolumeBars(w, h, padding, volumeHeight, bounds.maxVolume, chartHeight);
        }

        // Draw candles
        this.drawCandles(padding, chartTop, chartWidth, chartHeight, priceScale, bounds.minPrice);

        // Draw current price line
        this.drawPriceLine(padding, chartTop, chartWidth, chartHeight, priceScale, bounds.minPrice);

        // Draw crosshair
        this.drawCrosshair(w, h, padding, chartHeight);

        // Draw price labels
        this.drawPriceLabels(padding, chartHeight, bounds);
    }

    drawGridLines(w, h, padding, bounds, chartHeight) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        // Horizontal lines
        const priceStep = (bounds.maxPrice - bounds.minPrice) / 5;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * chartHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(w - padding, y);
            this.ctx.stroke();
        }

        // Vertical lines
        const numVertical = 6;
        for (let i = 0; i <= numVertical; i++) {
            const x = padding + (i / numVertical) * (w - padding * 2);
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding);
            this.ctx.lineTo(x, h - padding - (this.options.showVolume ? this.options.volumeHeight : 0));
            this.ctx.stroke();
        }
    }

    drawVolumeBars(w, h, padding, volumeHeight, maxVolume, chartHeight) {
        if (this.candles.length === 0) return;

        const barWidth = (w - padding * 2) / this.candles.length;
        const volumeTop = h - padding - volumeHeight;

        this.candles.forEach((candle, i) => {
            const x = padding + i * barWidth;
            const barHeight = (candle.volume / maxVolume) * volumeHeight * 0.8;

            // Color based on direction
            const isBullish = candle.close >= candle.open;
            this.ctx.fillStyle = isBullish ? 'rgba(63, 185, 80, 0.3)' : 'rgba(218, 54, 51, 0.3)';

            this.ctx.fillRect(x, volumeTop + volumeHeight - barHeight, barWidth - 1, barHeight);
        });
    }

    drawCandles(padding, chartTop, chartWidth, chartHeight, priceScale, minPrice) {
        if (this.candles.length === 0) return;

        const candleWidth = this.options.candleWidth;
        const totalWidth = chartWidth;
        const barWidth = totalWidth / this.candles.length;
        const candleBodyWidth = Math.min(candleWidth, barWidth - 2);

        this.candles.forEach((candle, i) => {
            const x = padding + i * barWidth + (barWidth - candleBodyWidth) / 2;

            const openY = chartTop + (this.candles[0].high - candle.open) * priceScale;
            const closeY = chartTop + (this.candles[0].high - candle.close) * priceScale;
            const highY = chartTop + (this.candles[0].high - candle.high) * priceScale;
            const lowY = chartTop + (this.candles[0].high - candle.low) * priceScale;

            // Adjust for the actual price range
            const adjustedOpenY = chartTop + chartHeight - (candle.open - minPrice) * priceScale;
            const adjustedCloseY = chartTop + chartHeight - (candle.close - minPrice) * priceScale;
            const adjustedHighY = chartTop + chartHeight - (candle.high - minPrice) * priceScale;
            const adjustedLowY = chartTop + chartHeight - (candle.low - minPrice) * priceScale;

            const isBullish = candle.close >= candle.open;
            const color = isBullish ? this.colors.bullish : this.colors.bearish;

            // Draw wick
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + candleBodyWidth / 2, adjustedHighY);
            this.ctx.lineTo(x + candleBodyWidth / 2, adjustedLowY);
            this.ctx.stroke();

            // Draw body
            this.ctx.fillStyle = color;
            const bodyHeight = Math.max(1, Math.abs(adjustedCloseY - adjustedOpenY));
            const bodyY = Math.min(adjustedOpenY, adjustedCloseY);
            this.ctx.fillRect(x, bodyY, candleBodyWidth, bodyHeight);
        });
    }

    drawPriceLine(padding, chartTop, chartWidth, chartHeight, priceScale, minPrice) {
        if (this.candles.length === 0) return;

        const lastCandle = this.candles[this.candles.length - 1];
        const priceY = chartTop + chartHeight - (lastCandle.close - minPrice) * priceScale;

        // Draw price line
        this.ctx.strokeStyle = this.colors.priceLine;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(padding, priceY);
        this.ctx.lineTo(padding + chartWidth, priceY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw price label
        const priceText = '\u20B9' + lastCandle.close.toFixed(2);
        this.ctx.fillStyle = this.colors.priceLine;
        this.ctx.fillRect(padding + chartWidth + 5, priceY - 10, 70, 20);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 11px Segoe UI';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(priceText, padding + chartWidth + 10, priceY + 4);
    }

    drawCrosshair(w, h, padding, chartHeight) {
        if (this.crosshair.x === null || this.crosshair.y === null) return;

        this.ctx.strokeStyle = this.colors.crosshair;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);

        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(this.crosshair.x, padding);
        this.ctx.lineTo(this.crosshair.x, h - padding);
        this.ctx.stroke();

        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(padding, this.crosshair.y);
        this.ctx.lineTo(w - padding, this.crosshair.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawPriceLabels(padding, chartHeight, bounds) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '11px Segoe UI';
        this.ctx.textAlign = 'right';

        const priceStep = (bounds.maxPrice - bounds.minPrice) / 5;
        for (let i = 0; i <= 5; i++) {
            const price = bounds.maxPrice - (i * priceStep);
            const y = this.options.padding + (i / 5) * chartHeight;
            this.ctx.fillText('\u20B9' + price.toFixed(0), padding - 10, y + 4);
        }
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.draw();
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.CandlestickChart = CandlestickChart;
}
