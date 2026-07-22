// @ts-nocheck
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { load } from '@/external/bot-skeleton/scratch/utils';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { Localize } from '@deriv-com/translations';
import './free-bots.scss';

type TFreeBot = {
    id: string;
    name: string;
    filename: string;
    description: string;
    category: string;
    market: string;
    risk: 'Low' | 'Medium' | 'High';
};

const FREE_BOTS: TFreeBot[] = [
    {
        id: 'q-trades-differs-pro',
        name: 'Q-Trades Differs Pro v1',
        filename: 'Q-Trades_Differs_Pro_v1_1784719190138.xml',
        description: 'Pro-grade Differs strategy with dynamic stake management and smart prediction logic.',
        category: 'Differs',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'qtrades-digit-bot',
        name: 'QTrades Digit Bot v1',
        filename: 'QTrades-Digit_Bot_v1_1784719190204.xml',
        description: 'Versatile digit bot with configurable take profit and stop loss for digit markets.',
        category: 'Digits',
        market: 'Volatility Indices',
        risk: 'Low',
    },
    {
        id: 'marvel-ai-automation',
        name: 'Marvel AI – 3 Predictions + Automation',
        filename: 'Marvel_AI_with_3_predictions_Automation__1784719190235.xml',
        description: 'Marvel AI engine with 3-prediction consensus and full automation for hands-free trading.',
        category: 'AI',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'dp-entry-jm7',
        name: 'DP Entry Point Bot V1 JM7',
        filename: 'Dp_Entry_point_Bot_V1_JM7_1784719190267.xml',
        description: 'Entry point detector with take profit and stop loss, tuned for JM7 market conditions.',
        category: 'Entry Point',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'dollar-printer',
        name: 'Dollar Printer Bot (Original)',
        filename: '$DollarprinterbotOrignal$_(1)_1784719190301.xml',
        description: 'Original Dollar Printer strategy — aggressive stake management targeting consistent gains.',
        category: 'Aggressive',
        market: 'Volatility Indices',
        risk: 'High',
    },
    {
        id: 'auto-c4-volt-ai',
        name: 'Auto C4 Volt AI Premium',
        filename: 'Auto_C4_Volt_AI_Premium_(1)_1784719190328.xml',
        description: 'Premium C4 Volt AI system with automatic trade execution and multi-variable analysis.',
        category: 'AI',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'even-odd-pattern',
        name: 'Even & Odd Bot with Pattern Analysis',
        filename: 'Even_&_odd_BOT_with_pattern_analysis_.dbtraders_1784719190356.xml',
        description: 'Even/Odd strategy enhanced with pattern analysis engine for higher-accuracy entries.',
        category: 'Even / Odd',
        market: 'Volatility Indices',
        risk: 'Low',
    },
    {
        id: 'ai-premium-no-analysis',
        name: 'AI Premium (No Analysis Needed)',
        filename: 'AI_Premium_No_Analysis_Needed_1784719190390.xml',
        description: 'Plug-and-play AI bot — no manual analysis required. Smart tick-by-tick decision engine.',
        category: 'AI',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'marvel-ai-3-predictions',
        name: 'Marvel AI – 3 Predictions',
        filename: 'Marvel_AI_with_3_predictions_1784719190451.xml',
        description: 'Core Marvel AI with 3-prediction voting system for consensus-based trade entries.',
        category: 'AI',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'over-under-destroyer',
        name: 'Over/Under Destroyer + Entry Point',
        filename: 'Over_Under_Destroyer_with_an_Entry_point__1784719190490.xml',
        description: 'Powerful Over/Under bot with intelligent entry detection and recovery logic.',
        category: 'Over / Under',
        market: 'Volatility Indices',
        risk: 'High',
    },
    {
        id: 'alpha-ai-two',
        name: 'Alpha AI – Two Predictions',
        filename: 'Alpha_Ai_Two_Predictions__1784719190524.xml',
        description: 'Alpha AI with dual-prediction confirmation system for filtered, high-confidence trades.',
        category: 'AI',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'dp-entry-v1',
        name: 'DP Entry Point Bot V1',
        filename: 'Dp_Entry_point_Bot_V1_1784719190550.xml',
        description: 'Clean entry point bot detecting optimal trade timing with configurable stake sizing.',
        category: 'Entry Point',
        market: 'Volatility Indices',
        risk: 'Low',
    },
    {
        id: 'over1-over3-recovery',
        name: 'Over 1 Bot with Over 3 Recovery',
        filename: 'OVER1_BOT_WITH_OVER3_REVOVERY__1784719190577.xml',
        description: "Oscar's Grind-style Over 1 bot with Over 3 recovery to minimise drawdown.",
        category: 'Over / Under',
        market: 'Volatility Indices',
        risk: 'Medium',
    },
    {
        id: 'digit-even-2025',
        name: '2025 Updated Digit Even Bot',
        filename: '2025_UPDATED_DIGIT_EVEN_Version_Bot📈📉_1784719190607.xml',
        description: 'Fully updated 2025 edition of the Digit Even strategy with improved stake progression.',
        category: 'Even / Odd',
        market: 'Volatility Indices',
        risk: 'Low',
    },
    {
        id: 'algo-sniper',
        name: 'Algo Sniper 🇰🇪',
        filename: '1_Algo_Sniper_🇰🇪$$_1784719190637.xml',
        description: 'Precision sniper algorithm targeting high-probability entry windows across digit markets.',
        category: 'Digits',
        market: 'Volatility Indices',
        risk: 'High',
    },
];

const RISK_CLASS = {
    Low: 'free-bots__badge--low',
    Medium: 'free-bots__badge--medium',
    High: 'free-bots__badge--high',
};

const CATEGORIES = ['All', ...Array.from(new Set(FREE_BOTS.map(b => b.category)))];

const FreeBots = observer(() => {
    const { dashboard } = useStore();
    const { setActiveTab } = dashboard;

    const [search, setSearch] = useState('');
    const [active_category, setActiveCategory] = useState('All');
    const [loading_id, setLoadingId] = useState<string | null>(null);
    const [error_id, setErrorId] = useState<string | null>(null);

    const filtered = FREE_BOTS.filter(bot => {
        const matches_search =
            bot.name.toLowerCase().includes(search.toLowerCase()) ||
            bot.description.toLowerCase().includes(search.toLowerCase()) ||
            bot.category.toLowerCase().includes(search.toLowerCase());
        const matches_cat = active_category === 'All' || bot.category === active_category;
        return matches_search && matches_cat;
    });

    const handleLoad = async (bot: TFreeBot) => {
        if (loading_id) return; // prevent double-click
        setLoadingId(bot.id);
        setErrorId(null);
        try {
            const res = await fetch(`/bots/${encodeURIComponent(bot.filename)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const xml_string = await res.text();

            await load({
                block_string: xml_string,
                file_name: bot.name,
                workspace: window.Blockly?.derivWorkspace,
            });

            // Switch to Bot Builder tab
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch (err) {
            console.error('Failed to load bot:', err);
            setErrorId(bot.id);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className='free-bots'>
            <div className='free-bots__header'>
                <div>
                    <h2 className='free-bots__title'>
                        <Localize i18n_default_text='Free Bots' />
                    </h2>
                    <p className='free-bots__subtitle'>
                        <Localize i18n_default_text='Click "Load into Builder" to open any strategy directly in the Bot Builder.' />
                    </p>
                </div>
                <div className='free-bots__controls'>
                    <input
                        className='free-bots__search'
                        type='text'
                        placeholder='Search bots…'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className='free-bots__categories'>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`free-bots__cat-btn${active_category === cat ? ' free-bots__cat-btn--active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
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
                        <span className='free-bots__empty-icon'>🤖</span>
                        <Localize i18n_default_text='No bots match your search.' />
                    </div>
                ) : (
                    filtered.map(bot => {
                        const is_loading = loading_id === bot.id;
                        const has_error = error_id === bot.id;
                        return (
                            <div key={bot.id} className='free-bots__card'>
                                <div className='free-bots__card-top'>
                                    <span className='free-bots__card-name'>{bot.name}</span>
                                    <span className={`free-bots__badge ${RISK_CLASS[bot.risk]}`}>
                                        {bot.risk}
                                    </span>
                                </div>
                                <p className='free-bots__card-desc'>{bot.description}</p>
                                <div className='free-bots__card-meta'>
                                    <span className='free-bots__meta-pill'>{bot.category}</span>
                                    <span className='free-bots__meta-pill free-bots__meta-pill--market'>{bot.market}</span>
                                </div>
                                <button
                                    className={`free-bots__load-btn${is_loading ? ' free-bots__load-btn--loading' : ''}${has_error ? ' free-bots__load-btn--error' : ''}`}
                                    onClick={() => handleLoad(bot)}
                                    disabled={!!loading_id}
                                >
                                    {is_loading ? (
                                        <>
                                            <span className='free-bots__spinner' />
                                            Loading…
                                        </>
                                    ) : has_error ? (
                                        'Failed — Retry'
                                    ) : (
                                        <>
                                            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                                <polyline points='8 17 12 21 16 17' />
                                                <line x1='12' y1='3' x2='12' y2='21' />
                                            </svg>
                                            Load into Builder
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
});

export default FreeBots;
