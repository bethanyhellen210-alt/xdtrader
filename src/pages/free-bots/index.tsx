import React from 'react';
import { Localize } from '@deriv-com/translations';
import './free-bots.scss';

type TFreeBot = {
    id: string;
    name: string;
    description: string;
    category: string;
    risk: 'Low' | 'Medium' | 'High';
    market: string;
    xml_url?: string;
};

const FREE_BOTS: TFreeBot[] = [
    {
        id: 'rise-fall-simple',
        name: 'Rise/Fall Simple',
        description: 'A straightforward bot that predicts whether the market will rise or fall. Ideal for beginners.',
        category: 'Trend',
        risk: 'Low',
        market: 'Volatility Indices',
    },
    {
        id: 'martingale-strategy',
        name: 'Martingale Strategy',
        description: 'Doubles the stake after each loss and resets on a win, aiming to recover losses quickly.',
        category: 'Martingale',
        risk: 'High',
        market: 'Forex & Indices',
    },
    {
        id: 'dalembert',
        name: "D'Alembert",
        description: 'Increases stake by one unit after a loss and decreases by one unit after a win.',
        category: 'Progressive',
        risk: 'Medium',
        market: 'Volatility Indices',
    },
    {
        id: 'oscar-grind',
        name: 'Oscar Grind',
        description: 'A positive progression system that increases stakes during winning streaks.',
        category: 'Progressive',
        risk: 'Medium',
        market: 'Even/Odd',
    },
    {
        id: 'digit-differs',
        name: 'Digit Differs',
        description: 'Predicts that the last digit of the spot price will not match a selected digit.',
        category: 'Digits',
        risk: 'Low',
        market: 'Volatility Indices',
    },
    {
        id: 'over-under',
        name: 'Over/Under Bot',
        description: 'Trades on whether the last digit will be over or under a chosen number.',
        category: 'Digits',
        risk: 'Low',
        market: 'Volatility Indices',
    },
    {
        id: 'accumulators-bot',
        name: 'Accumulators Bot',
        description: 'Accumulates profit by holding positions as long as the price stays within range.',
        category: 'Accumulators',
        risk: 'Medium',
        market: 'Volatility Indices',
    },
    {
        id: 'rsi-strategy',
        name: 'RSI Strategy',
        description: 'Uses the Relative Strength Index indicator to identify overbought/oversold conditions.',
        category: 'Indicator',
        risk: 'Medium',
        market: 'Forex & Indices',
    },
];

const RISK_COLOR: Record<TFreeBot['risk'], string> = {
    Low: 'free-bots__badge--low',
    Medium: 'free-bots__badge--medium',
    High: 'free-bots__badge--high',
};

const FreeBots = () => {
    const [search, setSearch] = React.useState('');
    const [selected_category, setSelectedCategory] = React.useState('All');

    const categories = ['All', ...Array.from(new Set(FREE_BOTS.map(b => b.category)))];

    const filtered = FREE_BOTS.filter(bot => {
        const matches_search =
            bot.name.toLowerCase().includes(search.toLowerCase()) ||
            bot.description.toLowerCase().includes(search.toLowerCase());
        const matches_category = selected_category === 'All' || bot.category === selected_category;
        return matches_search && matches_category;
    });

    const handleLoad = (bot: TFreeBot) => {
        // Placeholder: in a full integration, this would load the bot XML into the workspace
        alert(`"${bot.name}" will be available to load into the Bot Builder soon.`);
    };

    return (
        <div className='free-bots'>
            <div className='free-bots__header'>
                <div className='free-bots__header-text'>
                    <h2 className='free-bots__title'>
                        <Localize i18n_default_text='Free Bots' />
                    </h2>
                    <p className='free-bots__subtitle'>
                        <Localize i18n_default_text='Ready-made trading strategies you can load directly into the Bot Builder.' />
                    </p>
                </div>
                <div className='free-bots__controls'>
                    <input
                        className='free-bots__search'
                        type='text'
                        placeholder='Search bots...'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className='free-bots__categories'>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`free-bots__category-btn${selected_category === cat ? ' free-bots__category-btn--active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className='free-bots__grid'>
                {filtered.length === 0 ? (
                    <div className='free-bots__empty'>
                        <Localize i18n_default_text='No bots found. Try a different search or category.' />
                    </div>
                ) : (
                    filtered.map(bot => (
                        <div key={bot.id} className='free-bots__card'>
                            <div className='free-bots__card-header'>
                                <span className='free-bots__card-name'>{bot.name}</span>
                                <span className={`free-bots__badge ${RISK_COLOR[bot.risk]}`}>{bot.risk} Risk</span>
                            </div>
                            <p className='free-bots__card-description'>{bot.description}</p>
                            <div className='free-bots__card-meta'>
                                <span className='free-bots__meta-item'>
                                    <span className='free-bots__meta-label'>Category:</span> {bot.category}
                                </span>
                                <span className='free-bots__meta-item'>
                                    <span className='free-bots__meta-label'>Market:</span> {bot.market}
                                </span>
                            </div>
                            <button className='free-bots__load-btn' onClick={() => handleLoad(bot)}>
                                <Localize i18n_default_text='Load Bot' />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FreeBots;
