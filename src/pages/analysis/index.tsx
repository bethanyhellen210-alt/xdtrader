import React from 'react';
import { Localize } from '@deriv-com/translations';
import './analysis.scss';

type TIndicator = {
    id: string;
    name: string;
    description: string;
    category: string;
    value?: string;
    signal?: 'Buy' | 'Sell' | 'Neutral';
};

const INDICATORS: TIndicator[] = [
    {
        id: 'rsi',
        name: 'Relative Strength Index (RSI)',
        description: 'Measures the speed and magnitude of price changes to identify overbought or oversold conditions.',
        category: 'Momentum',
        signal: 'Neutral',
    },
    {
        id: 'macd',
        name: 'MACD',
        description: 'Moving Average Convergence Divergence — shows the relationship between two moving averages.',
        category: 'Trend',
        signal: 'Buy',
    },
    {
        id: 'bollinger',
        name: 'Bollinger Bands',
        description: 'A volatility indicator consisting of a moving average and two standard deviation bands.',
        category: 'Volatility',
        signal: 'Neutral',
    },
    {
        id: 'stochastic',
        name: 'Stochastic Oscillator',
        description: 'Compares a closing price to a price range over time to predict reversals.',
        category: 'Momentum',
        signal: 'Sell',
    },
    {
        id: 'ema',
        name: 'Exponential Moving Average (EMA)',
        description: 'Gives more weight to recent prices, making it more responsive to new information.',
        category: 'Trend',
        signal: 'Buy',
    },
    {
        id: 'atr',
        name: 'Average True Range (ATR)',
        description: 'Measures market volatility by decomposing the entire range of an asset price.',
        category: 'Volatility',
        signal: 'Neutral',
    },
];

const MARKET_SUMMARY = [
    { label: 'Volatility 75 Index', change: '+0.45%', direction: 'up' as const },
    { label: 'Volatility 100 Index', change: '-0.12%', direction: 'down' as const },
    { label: 'Boom 1000 Index', change: '+1.23%', direction: 'up' as const },
    { label: 'Crash 500 Index', change: '-0.88%', direction: 'down' as const },
    { label: 'EUR/USD', change: '+0.07%', direction: 'up' as const },
    { label: 'GBP/USD', change: '-0.33%', direction: 'down' as const },
];

const SIGNAL_CLASS: Record<NonNullable<TIndicator['signal']>, string> = {
    Buy: 'analysis__signal--buy',
    Sell: 'analysis__signal--sell',
    Neutral: 'analysis__signal--neutral',
};

const Analysis = () => {
    const [active_category, setActiveCategory] = React.useState('All');
    const categories = ['All', ...Array.from(new Set(INDICATORS.map(i => i.category)))];

    const filtered = INDICATORS.filter(
        ind => active_category === 'All' || ind.category === active_category
    );

    return (
        <div className='analysis'>
            <div className='analysis__header'>
                <h2 className='analysis__title'>
                    <Localize i18n_default_text='Analysis' />
                </h2>
                <p className='analysis__subtitle'>
                    <Localize i18n_default_text='Market overview and technical indicators to support your trading decisions.' />
                </p>
            </div>

            {/* Market Summary */}
            <section className='analysis__section'>
                <h3 className='analysis__section-title'>
                    <Localize i18n_default_text='Market Summary' />
                </h3>
                <div className='analysis__market-grid'>
                    {MARKET_SUMMARY.map(item => (
                        <div key={item.label} className='analysis__market-card'>
                            <span className='analysis__market-label'>{item.label}</span>
                            <span
                                className={`analysis__market-change analysis__market-change--${item.direction}`}
                            >
                                {item.change}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Technical Indicators */}
            <section className='analysis__section'>
                <div className='analysis__section-header'>
                    <h3 className='analysis__section-title'>
                        <Localize i18n_default_text='Technical Indicators' />
                    </h3>
                    <div className='analysis__categories'>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`analysis__category-btn${active_category === cat ? ' analysis__category-btn--active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='analysis__indicators-grid'>
                    {filtered.map(ind => (
                        <div key={ind.id} className='analysis__indicator-card'>
                            <div className='analysis__indicator-header'>
                                <span className='analysis__indicator-name'>{ind.name}</span>
                                {ind.signal && (
                                    <span className={`analysis__signal ${SIGNAL_CLASS[ind.signal]}`}>
                                        {ind.signal}
                                    </span>
                                )}
                            </div>
                            <span className='analysis__indicator-category'>{ind.category}</span>
                            <p className='analysis__indicator-description'>{ind.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Disclaimer */}
            <div className='analysis__disclaimer'>
                <Localize i18n_default_text='Note: Signals shown are illustrative. Always conduct your own research before trading.' />
            </div>
        </div>
    );
};

export default Analysis;
