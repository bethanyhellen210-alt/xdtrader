// ─────────────────────────────────────────────────────────────────────────────
//  Q-Trades AI Analysis Engine
//  Pure functions — no side effects, no I/O
// ─────────────────────────────────────────────────────────────────────────────

export type MarketType = 'over_under' | 'even_odd' | 'matches_differs';
export type Trend = 'Bullish' | 'Bearish' | 'Sideways';

export interface DigitStats {
    freq: number[];          // index 0-9: raw count
    pct: number[];           // index 0-9: percentage 0-100
    mostFreq: number;        // digit 0-9
    leastFreq: number;       // digit 0-9
    evenPct: number;
    oddPct: number;
    overPct: number;         // digits 5-9
    underPct: number;        // digits 0-4
}

export interface OverUnderResult {
    prediction: 'Over' | 'Under';
    barrier: number;         // 0-9
    confidence: number;      // 0-100
    insights: string[];
}

export interface EvenOddResult {
    prediction: 'Even' | 'Odd';
    confidence: number;
    insights: string[];
}

export interface MatchesDiffersResult {
    prediction: 'Matches' | 'Differs';
    digit: number;
    confidence: number;
    insights: string[];
}

export interface MarketScore {
    symbol: string;
    name: string;
    score: number;           // higher = more predictable
    prices: number[];
    digits: number[];
    trend: Trend;
    stats: DigitStats;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getLastDigit(price: number): number {
    // Get the very last digit of the price string (handles decimal prices)
    const str = price.toFixed(2).replace('.', '');
    return parseInt(str[str.length - 1], 10);
}

export function buildDigitStats(digits: number[]): DigitStats {
    const freq = Array(10).fill(0);
    for (const d of digits) freq[d]++;
    const n = digits.length || 1;
    const pct = freq.map(f => (f / n) * 100);

    let mostFreq = 0, leastFreq = 0;
    for (let i = 1; i < 10; i++) {
        if (freq[i] > freq[mostFreq]) mostFreq = i;
        if (freq[i] < freq[leastFreq]) leastFreq = i;
    }

    const evenPct = [0, 2, 4, 6, 8].reduce((s, d) => s + pct[d], 0);
    const oddPct  = [1, 3, 5, 7, 9].reduce((s, d) => s + pct[d], 0);
    const overPct  = [5, 6, 7, 8, 9].reduce((s, d) => s + pct[d], 0);
    const underPct = [0, 1, 2, 3, 4].reduce((s, d) => s + pct[d], 0);

    return { freq, pct, mostFreq, leastFreq, evenPct, oddPct, overPct, underPct };
}

export function detectTrend(prices: number[]): Trend {
    if (prices.length < 6) return 'Sideways';
    const mid = Math.floor(prices.length / 2);
    const firstHalfAvg = prices.slice(0, mid).reduce((s, p) => s + p, 0) / mid;
    const secondHalfAvg = prices.slice(mid).reduce((s, p) => s + p, 0) / (prices.length - mid);
    const delta = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    if (delta > 0.005) return 'Bullish';
    if (delta < -0.005) return 'Bearish';
    return 'Sideways';
}

export function detectStreak(digits: number[]): { digit: number; length: number } {
    if (!digits.length) return { digit: -1, length: 0 };
    const last = digits[digits.length - 1];
    let length = 1;
    for (let i = digits.length - 2; i >= 0; i--) {
        if (digits[i] === last) length++;
        else break;
    }
    return { digit: last, length };
}

/** Detect a two-digit alternating reversal in the last 6 ticks */
export function detectReversal(digits: number[]): boolean {
    const window = digits.slice(-6);
    if (window.length < 4) return false;
    // Check zig-zag: each digit alternates between >4 and <=4
    let zigs = 0;
    for (let i = 1; i < window.length; i++) {
        const prevHigh = window[i - 1] > 4;
        const currHigh = window[i] > 4;
        if (prevHigh !== currHigh) zigs++;
    }
    return zigs >= window.length - 1;
}

/** Score how predictable a market is (higher = more skewed, easier to predict) */
export function scoreMarketPredictability(stats: DigitStats): number {
    // Measure deviation from uniform distribution (10% per digit)
    let score = 0;
    for (const p of stats.pct) score += Math.abs(p - 10);
    // Bonus for strong over/under skew
    const ouSkew = Math.abs(stats.overPct - stats.underPct);
    const eoSkew = Math.abs(stats.evenPct - stats.oddPct);
    score += ouSkew * 1.5 + eoSkew;
    return score;
}

// ── Per-market-type analysis ──────────────────────────────────────────────────

export function analyzeOverUnder(digits: number[], prices: number[], trend: Trend): OverUnderResult {
    const stats = buildDigitStats(digits);
    const last50 = digits.slice(-50);
    const stats50 = buildDigitStats(last50);
    const streak = detectStreak(digits);
    const reversal = detectReversal(digits);
    const insights: string[] = [];

    // Combine 100-tick and 50-tick bias with more weight on recent
    const overBias  = stats.overPct  * 0.4 + stats50.overPct  * 0.6;
    const underBias = stats.underPct * 0.4 + stats50.underPct * 0.6;

    // Trend adds a tiebreaker
    let trendBump = 0;
    if (trend === 'Bullish') trendBump = 2;
    if (trend === 'Bearish') trendBump = -2;

    const adjustedOver = overBias + trendBump;

    // Reversal flips the prediction
    let prediction: 'Over' | 'Under' = adjustedOver >= 50 ? 'Over' : 'Under';
    if (reversal) {
        prediction = prediction === 'Over' ? 'Under' : 'Over';
        insights.push('Reversal pattern detected in last 6 ticks — flipping signal');
    }

    // Barrier: for Over, choose the highest digit that still appears at reasonable rate
    // For Under, choose the lowest digit with reasonable rate
    let barrier: number;
    if (prediction === 'Over') {
        // Find highest digit in 0-4 range with good frequency (= barrier where "over barrier" means 5-9)
        // Standard Deriv Over/Under barrier is 0-9; "Over 4" = digits 5-9
        // We pick barrier dynamically based on market distribution
        if (stats.pct.slice(5).reduce((s, v) => s + v, 0) > 60) barrier = 3;
        else if (stats.pct.slice(6).reduce((s, v) => s + v, 0) > 40) barrier = 4;
        else barrier = 4;
    } else {
        if (stats.pct.slice(0, 5).reduce((s, v) => s + v, 0) > 60) barrier = 6;
        else if (stats.pct.slice(0, 4).reduce((s, v) => s + v, 0) > 40) barrier = 5;
        else barrier = 5;
    }

    const rawConfidence = Math.max(overBias, underBias);
    const confidence = Math.min(Math.round(rawConfidence + Math.abs(trendBump)), 97);

    insights.push(`Last 100 ticks: Over ${stats.overPct.toFixed(1)}% — Under ${stats.underPct.toFixed(1)}%`);
    insights.push(`Last 50 ticks:  Over ${stats50.overPct.toFixed(1)}% — Under ${stats50.underPct.toFixed(1)}%`);
    if (streak.length >= 3) insights.push(`Current streak: ${streak.digit} × ${streak.length} ticks`);
    insights.push(`Price trend: ${trend}`);

    return { prediction, barrier, confidence, insights };
}

export function analyzeEvenOdd(digits: number[]): EvenOddResult {
    const stats = buildDigitStats(digits);
    const last50 = digits.slice(-50);
    const stats50 = buildDigitStats(last50);
    const reversal = detectReversal(digits);
    const insights: string[] = [];

    const evenBias = stats.evenPct * 0.4 + stats50.evenPct * 0.6;
    const oddBias  = stats.oddPct  * 0.4 + stats50.oddPct  * 0.6;

    let prediction: 'Even' | 'Odd' = evenBias >= oddBias ? 'Even' : 'Odd';
    if (reversal) {
        prediction = prediction === 'Even' ? 'Odd' : 'Even';
        insights.push('Reversal pattern detected — flipping signal');
    }

    const confidence = Math.min(Math.round(Math.max(evenBias, oddBias)), 97);

    insights.push(`Last 100 ticks: Even ${stats.evenPct.toFixed(1)}% — Odd ${stats.oddPct.toFixed(1)}%`);
    insights.push(`Last 50 ticks:  Even ${stats50.evenPct.toFixed(1)}% — Odd ${stats50.oddPct.toFixed(1)}%`);

    const topEven = [0, 2, 4, 6, 8].sort((a, b) => stats.pct[b] - stats.pct[a]);
    const topOdd  = [1, 3, 5, 7, 9].sort((a, b) => stats.pct[b] - stats.pct[a]);
    insights.push(`Most frequent even: ${topEven[0]} (${stats.pct[topEven[0]].toFixed(1)}%)`);
    insights.push(`Most frequent odd: ${topOdd[0]} (${stats.pct[topOdd[0]].toFixed(1)}%)`);

    return { prediction, confidence, insights };
}

export function analyzeMatchesDiffers(digits: number[]): MatchesDiffersResult {
    const stats = buildDigitStats(digits);
    const last50 = digits.slice(-50);
    const stats50 = buildDigitStats(last50);
    const insights: string[] = [];

    // Combined weighted percentages
    const combined = stats.pct.map((p, i) => p * 0.4 + stats50.pct[i] * 0.6);
    const maxPct  = Math.max(...combined);
    const minPct  = Math.min(...combined);
    const matchDigit  = combined.indexOf(maxPct);
    const differsDigit = combined.indexOf(minPct);

    // Deviation from uniform (10%)
    const matchDeviation  = maxPct - 10;
    const differsDeviation = 10 - minPct;

    let prediction: 'Matches' | 'Differs';
    let digit: number;
    let confidence: number;

    if (matchDeviation >= differsDeviation) {
        prediction = 'Matches';
        digit = matchDigit;
        confidence = Math.min(Math.round(50 + matchDeviation * 2.5), 97);
        insights.push(`Digit ${digit} is over-represented at ${combined[digit].toFixed(1)}% (expected 10%)`);
    } else {
        prediction = 'Differs';
        digit = differsDigit;
        confidence = Math.min(Math.round(50 + differsDeviation * 2.5), 97);
        insights.push(`Digit ${digit} is under-represented at ${combined[digit].toFixed(1)}% (expected 10%)`);
    }

    // Top 3 digit distribution
    const sorted = [...combined.entries()].sort((a, b) => b[1] - a[1]);
    insights.push(`Top digits: ${sorted.slice(0, 3).map(([d, p]) => `${d}(${p.toFixed(1)}%)`).join(', ')}`);
    insights.push(`Low digits: ${sorted.slice(-3).map(([d, p]) => `${d}(${p.toFixed(1)}%)`).join(', ')}`);
    const streak = detectStreak(digits);
    if (streak.length >= 3) insights.push(`Streak: digit ${streak.digit} × ${streak.length}`);

    return { prediction, digit, confidence, insights };
}

// ── Full market analysis ──────────────────────────────────────────────────────

export function analyzeMarket(
    symbol: string,
    name: string,
    prices: number[],
    marketType: MarketType
): MarketScore & { result: OverUnderResult | EvenOddResult | MatchesDiffersResult } {
    const digits = prices.map(getLastDigit);
    const stats = buildDigitStats(digits);
    const trend = detectTrend(prices);
    const score = scoreMarketPredictability(stats);

    let result: OverUnderResult | EvenOddResult | MatchesDiffersResult;
    if (marketType === 'over_under') result = analyzeOverUnder(digits, prices, trend);
    else if (marketType === 'even_odd') result = analyzeEvenOdd(digits);
    else result = analyzeMatchesDiffers(digits);

    return { symbol, name, score, prices, digits, trend, stats, result };
}
