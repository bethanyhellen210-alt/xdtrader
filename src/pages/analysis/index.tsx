import React from 'react';
import './analysis.scss';

const Analysis = () => {
    return (
        <div className='analysis-iframe-wrapper'>
            <iframe
                src='https://digitpulse.lovable.app'
                title='Q-Trades Analysis'
                className='analysis-iframe'
                allow='clipboard-write'
                sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox'
            />
        </div>
    );
};

export default Analysis;
