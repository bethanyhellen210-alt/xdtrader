import React from 'react';
import './welcome.scss';

type TWelcomePageProps = {
    onEnter: () => void;
};

const WelcomePage = ({ onEnter }: TWelcomePageProps) => {
    return (
        <div className='welcome'>
            {/* Animated background grid */}
            <div className='welcome__grid' aria-hidden />

            {/* Header */}
            <header className='welcome__header'>
                <div className='welcome__logo'>
                    <span className='welcome__logo-icon'>Q</span>
                    <span className='welcome__logo-text'>Q-Trades</span>
                </div>
            </header>

            {/* Hero */}
            <main className='welcome__hero'>
                <div className='welcome__badge'>
                    <span className='welcome__badge-dot' />
                    ADVANCED DIGIT ANALYSIS SYSTEM
                </div>

                <h1 className='welcome__title'>
                    Trade smarter with{' '}
                    <span className='welcome__title--accent'>Q-Trades</span>{' '}
                    Intelligence
                </h1>

                <p className='welcome__subtitle'>
                    A professional-grade Deriv digit analysis platform engineered for precision.
                    Real-time market data, statistical consensus engines, and institutional-grade
                    pattern recognition — all in one dashboard.
                </p>

                <div className='welcome__pills'>
                    {['Matches / Differs', 'Even / Odd', 'Over / Under', 'Rise / Fall'].map(label => (
                        <span key={label} className='welcome__pill'>
                            <span className='welcome__pill-dot' />
                            {label}
                        </span>
                    ))}
                </div>

                <div className='welcome__actions'>
                    <button className='welcome__btn welcome__btn--primary' onClick={onEnter}>
                        Launch Dashboard
                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                            <line x1='5' y1='12' x2='19' y2='12' />
                            <polyline points='12 5 19 12 12 19' />
                        </svg>
                    </button>
                </div>
            </main>

            {/* Feature cards */}
            <section className='welcome__features'>
                {[
                    { icon: '⚡', title: 'Live Deriv API Streaming', desc: 'Connect directly to the Deriv WebSocket for real-time tick data. No delays, no guesswork.' },
                    { icon: '📊', title: '100-Tick Deep Analysis', desc: 'Every signal is backed by a rolling window of 100 real-time ticks. Frequency, streaks, and patterns.' },
                    { icon: '🎯', title: 'Multi-Strategy Consensus', desc: 'Signals fire only when every active strategy agrees — Chi-Square, Markov Chains, Kalman Filter.' },
                    { icon: '🤖', title: 'Automated Bot Builder', desc: 'Drag-and-drop Blockly workspace to build, test, and run custom trading strategies instantly.' },
                ].map(card => (
                    <div key={card.title} className='welcome__card'>
                        <span className='welcome__card-icon'>{card.icon}</span>
                        <h3 className='welcome__card-title'>{card.title}</h3>
                        <p className='welcome__card-desc'>{card.desc}</p>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default WelcomePage;
