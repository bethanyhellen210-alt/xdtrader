import React from 'react';
import { Localize } from '@deriv-com/translations';
import './free-bots.scss';

const FreeBots = () => {
    return (
        <div className='free-bots'>
            <div className='free-bots__header'>
                <h2 className='free-bots__title'>
                    <Localize i18n_default_text='Free Bots' />
                </h2>
                <p className='free-bots__subtitle'>
                    <Localize i18n_default_text='Ready-made trading strategies you can load directly into the Bot Builder.' />
                </p>
            </div>

            <div className='free-bots__empty'>
                <div className='free-bots__empty-icon'>🤖</div>
                <h3 className='free-bots__empty-title'>
                    <Localize i18n_default_text='Bots coming soon' />
                </h3>
                <p className='free-bots__empty-desc'>
                    <Localize i18n_default_text='Your Q-Trades strategy bots will appear here once uploaded. Stay tuned.' />
                </p>
            </div>
        </div>
    );
};

export default FreeBots;
