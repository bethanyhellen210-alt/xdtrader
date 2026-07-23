// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    analyzeMarket,
    buildDigitStats,
    type EvenOddResult,
    type MarketType,
    type MarketScore,
    type MatchesDiffersResult,
    type OverUnderResult,
} from './analysis-engine';
import './ai-agent.scss';

// ─────────────────────────────────────────────────────────────────────────────
//  Deriv public tick fetcher (no auth needed)
// ─────────────────────────────────────────────────────────────────────────────

const WS_ENDPOINT = 'wss://ws.derivws.com/websockets/v3?app_id=1089';

function fetchTickHistory(symbol: string, count = 100): Promise<number[]> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_ENDPOINT);
        const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 12000);

        ws.onopen = () => {
            ws.send(JSON.stringify({ ticks_history: symbol, end: 'latest', count, style: 'ticks' }));
        };
        ws.onmessage = (ev) => {
            const data = JSON.parse(ev.data);
            if (data.msg_type === 'history') {
                clearTimeout(timer);
                ws.close();
                resolve(data.history?.prices?.map(Number) ?? []);
            } else if (data.error) {
                clearTimeout(timer);
                ws.close();
                reject(new Error(data.error.message));
            }
        };
        ws.onerror = () => { clearTimeout(timer); reject(new Error('ws error')); };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────

const VOLATILITY_MARKETS = [
    { symbol: 'R_10',    name: 'Volatility 10' },
    { symbol: 'R_25',    name: 'Volatility 25' },
    { symbol: 'R_50',    name: 'Volatility 50' },
    { symbol: 'R_75',    name: 'Volatility 75' },
    { symbol: 'R_100',   name: 'Volatility 100' },
    { symbol: '1HZ10V',  name: 'Volatility 10 (1s)' },
    { symbol: '1HZ25V',  name: 'Volatility 25 (1s)' },
    { symbol: '1HZ50V',  name: 'Volatility 50 (1s)' },
    { symbol: '1HZ75V',  name: 'Volatility 75 (1s)' },
    { symbol: '1HZ100V', name: 'Volatility 100 (1s)' },
];

const MARKET_CONFIG = {
    over_under: {
        label: 'Over / Under',
        icon: '📊',
        desc: 'Predict if the last digit will be Over or Under a barrier',
    },
    even_odd: {
        label: 'Even / Odd',
        icon: '⚖️',
        desc: 'Predict if the last digit will be Even or Odd',
    },
    matches_differs: {
        label: 'Matches / Differs',
        icon: '🎯',
        desc: 'Predict if the last digit Matches or Differs from a specific digit',
    },
} as const;

const LOAD_STEPS = [
    'Connecting to Deriv WebSocket…',
    'Fetching 100-tick history for all markets…',
    'Running Digit Frequency Analysis…',
    'Detecting patterns & reversals…',
    'Scoring market predictability…',
    'Generating trading signal…',
];

type Phase = 'select' | 'loading' | 'result';

interface Result {
    market: typeof VOLATILITY_MARKETS[number];
    analysis: MarketScore & { result: OverUnderResult | EvenOddResult | MatchesDiffersResult };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────────────────────

const AIAgent: React.FC = () => {
    // ── Drag state ───────────────────────────────────────────────────────────
    const [pos, setPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 140 });
    const dragRef = useRef({ active: false, ox: 0, oy: 0, px: 0, py: 0, moved: false });

    // ── Panel state ──────────────────────────────────────────────────────────
    const [open, setOpen]           = useState(false);
    const [marketType, setMarketType] = useState<MarketType | null>(null);
    const [phase, setPhase]         = useState<Phase>('select');
    const [step, setStep]           = useState(0);
    const [result, setResult]       = useState<Result | null>(null);
    const [error, setError]         = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const onPointerDown = useCallback((e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { active: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y, px: pos.x, py: pos.y, moved: false };
    }, [pos]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const d = dragRef.current;
        if (!d.active) return;
        const nx = e.clientX - d.ox;
        const ny = e.clientY - d.oy;
        if (Math.abs(nx - d.px) > 4 || Math.abs(ny - d.py) > 4) d.moved = true;
        const maxX = window.innerWidth  - 58;
        const maxY = window.innerHeight - 58;
        setPos({ x: Math.max(0, Math.min(nx, maxX)), y: Math.max(0, Math.min(ny, maxY)) });
    }, []);

    const onPointerUp = useCallback(() => {
        const moved = dragRef.current.moved;
        dragRef.current.active = false;
        if (!moved) setOpen(o => !o);
    }, []);

    // ── Panel positioning ─────────────────────────────────────────────────────
    const getPanelStyle = () => {
        const PANEL_W = 380;
        const PANEL_H = 560;
        const MARGIN  = 12;
        const TRIGGER = 58;

        let left = pos.x - PANEL_W - MARGIN;
        if (left < MARGIN) left = pos.x + TRIGGER + MARGIN;
        if (left + PANEL_W > window.innerWidth - MARGIN) left = window.innerWidth - PANEL_W - MARGIN;

        let top = pos.y - PANEL_H / 2;
        if (top < MARGIN) top = MARGIN;
        if (top + PANEL_H > window.innerHeight - MARGIN) top = window.innerHeight - PANEL_H - MARGIN;

        return { left, top };
    };

    // ── Analysis runner ───────────────────────────────────────────────────────
    const runAnalysis = async () => {
        if (!marketType) return;
        setPhase('loading');
        setStep(0);
        setError(null);

        try {
            // Steps 0-1: connect + fetch
            setStep(1);
            const fetched = await Promise.allSettled(
                VOLATILITY_MARKETS.map(m => fetchTickHistory(m.symbol, 100).then(p => ({ ...m, prices: p })))
            );
            setStep(2);

            const valid = fetched
                .filter(r => r.status === 'fulfilled' && r.value.prices.length >= 20)
                .map(r => (r as PromiseFulfilledResult<any>).value);

            if (valid.length === 0) throw new Error('Could not fetch tick data from Deriv. Check your connection.');

            // Steps 2-5: analyse
            setStep(3);
            const analysed = valid.map(m => ({
                market: { symbol: m.symbol, name: m.name },
                analysis: analyzeMarket(m.symbol, m.name, m.prices, marketType),
            }));

            setStep(4);
            // Pick best market (highest predictability score)
            analysed.sort((a, b) => b.analysis.score - a.analysis.score);
            const best = analysed[0];

            setStep(5);
            await new Promise(r => setTimeout(r, 500)); // brief pause for UX

            setResult(best);
            setPhase('result');
        } catch (err: any) {
            setError(err.message ?? 'Analysis failed');
            setPhase('select');
        }
    };

    const reset = () => {
        setPhase('select');
        setResult(null);
        setError(null);
        setStep(0);
    };

    // ── Signal card variant class ─────────────────────────────────────────────
    const getSignalVariant = () => {
        if (!result) return '';
        const r = result.analysis.result;
        if ('prediction' in r) {
            return r.prediction.toLowerCase(); // over/under/even/odd/matches/differs
        }
        return '';
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const panelStyle = open ? getPanelStyle() : {};
    const isDragging = dragRef.current.active && dragRef.current.moved;

    return (
        <>
            {/* Floating circle trigger */}
            <div
                className={`ai-agent__trigger${open ? ' ai-agent__trigger--open' : ''}${isDragging ? ' ai-agent__trigger--dragging' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                title='Q-Trades AI Signal Agent'
            >
                <span className='ai-agent__trigger-icon'>🤖</span>
                <span className='ai-agent__trigger-label'>AI</span>
            </div>

            {/* Panel */}
            {open && (
                <div
                    ref={panelRef}
                    className='ai-agent__panel'
                    style={{ left: panelStyle.left, top: panelStyle.top }}
                >
                    {/* Header */}
                    <div className='ai-agent__panel-header'>
                        <div className='ai-agent__panel-title'>
                            <span>📡</span>
                            <div>
                                <div className='ai-agent__panel-title-text'>Q-TRADES AI</div>
                                <div className='ai-agent__panel-subtitle'>SIGNAL AGENT</div>
                            </div>
                        </div>
                        <button className='ai-agent__close' onClick={() => setOpen(false)}>×</button>
                    </div>

                    {/* Body */}
                    <div className='ai-agent__panel-body'>

                        {/* ── SELECT phase ─────────────────────────────────── */}
                        {phase === 'select' && (
                            <>
                                <div>
                                    <p className='ai-agent__section-label'>1 — Choose Market Type</p>
                                    <div className='ai-agent__market-btns'>
                                        {(Object.entries(MARKET_CONFIG) as [MarketType, typeof MARKET_CONFIG[MarketType]][]).map(([key, cfg]) => (
                                            <button
                                                key={key}
                                                className={`ai-agent__market-btn${marketType === key ? ' ai-agent__market-btn--active' : ''}`}
                                                onClick={() => setMarketType(key)}
                                            >
                                                <span className='ai-agent__market-btn-icon'>{cfg.icon}</span>
                                                <div className='ai-agent__market-btn-info'>
                                                    <span className='ai-agent__market-btn-name'>{cfg.label}</span>
                                                    <span className='ai-agent__market-btn-desc'>{cfg.desc}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div style={{ color: '#f43f5e', fontSize: '1.2rem', background: 'rgba(244,63,94,0.08)', padding: '0.8rem 1rem', borderRadius: 6, border: '1px solid rgba(244,63,94,0.2)' }}>
                                        ⚠️ {error}
                                    </div>
                                )}

                                <div>
                                    <p className='ai-agent__section-label'>2 — Launch Analysis</p>
                                    <button
                                        className='ai-agent__launch'
                                        onClick={runAnalysis}
                                        disabled={!marketType}
                                    >
                                        🚀 ANALYSE ALL MARKETS
                                    </button>
                                </div>

                                <p className='ai-agent__disclaimer'>
                                    Scans all 10 volatility indices in real-time and picks the most predictable market for your selected strategy using Digit Frequency, Pattern & Reversal analysis on the last 100 ticks.
                                </p>
                            </>
                        )}

                        {/* ── LOADING phase ────────────────────────────────── */}
                        {phase === 'loading' && (
                            <div className='ai-agent__loading'>
                                <div className='ai-agent__loading-ring' />
                                <div className='ai-agent__loading-steps'>
                                    {LOAD_STEPS.map((s, i) => (
                                        <div
                                            key={i}
                                            className={`ai-agent__loading-step${i === step ? ' ai-agent__loading-step--active' : i < step ? ' ai-agent__loading-step--done' : ''}`}
                                        >
                                            <span className='ai-agent__step-dot' />
                                            {i < step ? '✓ ' : ''}{s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── RESULT phase ─────────────────────────────────── */}
                        {phase === 'result' && result && (() => {
                            const res = result.analysis.result;
                            const stats = result.analysis.stats;
                            const variant = getSignalVariant();

                            // Derive display values
                            let signalMain = '';
                            let barrierBlock: React.ReactNode = null;
                            let insights: string[] = [];

                            if ('barrier' in res) {
                                // OverUnder
                                const ou = res as OverUnderResult;
                                signalMain = ou.prediction;
                                insights = ou.insights;
                                barrierBlock = (
                                    <div className='ai-agent__signal-barrier'>
                                        <span className='ai-agent__signal-barrier-label'>Barrier Digit</span>
                                        <span className='ai-agent__signal-barrier-val'>{ou.barrier}</span>
                                    </div>
                                );
                            } else if ('evenPct' in (res as any) || 'prediction' in res && !('digit' in res)) {
                                // EvenOdd
                                const eo = res as EvenOddResult;
                                signalMain = eo.prediction;
                                insights = eo.insights;
                            } else {
                                // MatchesDiffers
                                const md = res as MatchesDiffersResult;
                                signalMain = md.prediction;
                                insights = md.insights;
                                barrierBlock = (
                                    <div className='ai-agent__signal-barrier'>
                                        <span className='ai-agent__signal-barrier-label'>{md.prediction === 'Matches' ? 'Match Digit' : 'Differs From'}</span>
                                        <span className='ai-agent__signal-barrier-val'>{md.digit}</span>
                                    </div>
                                );
                            }

                            const confidence = (res as any).confidence as number;

                            return (
                                <div className='ai-agent__result'>
                                    {/* Best market */}
                                    <div className='ai-agent__result-market'>
                                        <div>
                                            <div className='ai-agent__result-market-name'>🏆 {result.market.name}</div>
                                            <div style={{ fontSize: '1.1rem', color: '#64748b', marginTop: 2 }}>Best market for {MARKET_CONFIG[marketType!].label}</div>
                                        </div>
                                        <span className={`ai-agent__trend ai-agent__trend--${result.analysis.trend}`}>
                                            {result.analysis.trend === 'Bullish' ? '↑' : result.analysis.trend === 'Bearish' ? '↓' : '→'} {result.analysis.trend}
                                        </span>
                                    </div>

                                    {/* Signal card */}
                                    <div className={`ai-agent__signal-card ai-agent__signal-card--${variant}`}>
                                        <span className='ai-agent__signal-label'>SIGNAL</span>
                                        <span className='ai-agent__signal-main'>{signalMain.toUpperCase()}</span>
                                        {barrierBlock}
                                    </div>

                                    {/* Confidence */}
                                    <div className='ai-agent__confidence'>
                                        <div className='ai-agent__conf-header'>
                                            <span className='ai-agent__conf-label'>Confidence</span>
                                            <span className='ai-agent__conf-value'>{confidence}%</span>
                                        </div>
                                        <div className='ai-agent__conf-track'>
                                            <div className='ai-agent__conf-bar' style={{ width: `${confidence}%` }} />
                                        </div>
                                    </div>

                                    {/* Digit frequency chart */}
                                    <div>
                                        <p className='ai-agent__section-label'>Digit Frequency (Last 100 Ticks)</p>
                                        <div className='ai-agent__freq-chart'>
                                            {stats.pct.map((p, d) => {
                                                const cls = p >= 14 ? 'hot' : p >= 9 ? 'warm' : 'cold';
                                                return (
                                                    <div key={d} className='ai-agent__freq-row'>
                                                        <span className='ai-agent__freq-digit'>{d}</span>
                                                        <div className='ai-agent__freq-track'>
                                                            <div className={`ai-agent__freq-fill ai-agent__freq-fill--${cls}`} style={{ width: `${Math.min(p * 4, 100)}%` }} />
                                                        </div>
                                                        <span className='ai-agent__freq-pct'>{p.toFixed(1)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Insights */}
                                    <div>
                                        <p className='ai-agent__section-label'>Analysis Insights</p>
                                        <div className='ai-agent__insights'>
                                            {insights.map((ins, i) => (
                                                <div key={i} className='ai-agent__insight'>{ins}</div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Disclaimer */}
                                    <p className='ai-agent__disclaimer'>
                                        Trading involves risk. Signals are based on statistical analysis of historical tick data and do not guarantee future results. Trade responsibly.
                                    </p>

                                    <button className='ai-agent__reset' onClick={reset}>↺ New Analysis</button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAgent;
