import React, { useEffect, useState } from 'react';
import './qt-loader.scss';

type TQTLoaderProps = {
    message?: string;
};

const BOOT_LINES = [
    'Initializing Q-Trades engine…',
    'Connecting to Deriv WebSocket…',
    'Loading strategy modules…',
    'Calibrating signal processors…',
    'System ready.',
];

const QTLoader = ({ message }: TQTLoaderProps) => {
    const [progress, setProgress] = useState(0);
    const [line_index, setLineIndex] = useState(0);
    const [show_cursor, setShowCursor] = useState(true);

    useEffect(() => {
        // Animate progress bar
        const progress_interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progress_interval);
                    return 100;
                }
                return prev + 0.6;
            });
        }, 30);

        // Cycle through boot lines
        const line_interval = setInterval(() => {
            setLineIndex(prev => Math.min(prev + 1, BOOT_LINES.length - 1));
        }, 600);

        // Blinking cursor
        const cursor_interval = setInterval(() => {
            setShowCursor(prev => !prev);
        }, 530);

        return () => {
            clearInterval(progress_interval);
            clearInterval(line_interval);
            clearInterval(cursor_interval);
        };
    }, []);

    const display_message = message || BOOT_LINES[line_index];

    return (
        <div className='qt-loader'>
            {/* Animated grid background */}
            <div className='qt-loader__grid' aria-hidden />

            {/* Horizontal scan line */}
            <div className='qt-loader__scan' aria-hidden />

            {/* Core content */}
            <div className='qt-loader__body'>
                {/* Logo mark */}
                <div className='qt-loader__logo'>
                    <div className='qt-loader__logo-ring qt-loader__logo-ring--outer' />
                    <div className='qt-loader__logo-ring qt-loader__logo-ring--inner' />
                    <span className='qt-loader__logo-letter'>Q</span>
                </div>

                {/* Brand name */}
                <div className='qt-loader__brand'>
                    <span className='qt-loader__brand-q'>Q</span>
                    <span className='qt-loader__brand-hyphen'>-</span>
                    <span className='qt-loader__brand-trades'>TRADES</span>
                </div>

                {/* Tagline */}
                <p className='qt-loader__tagline'>ADVANCED DIGIT ANALYSIS SYSTEM</p>

                {/* Progress track */}
                <div className='qt-loader__track'>
                    <div
                        className='qt-loader__bar'
                        style={{ width: `${progress}%` }}
                    />
                    <div
                        className='qt-loader__bar-glow'
                        style={{ left: `${progress}%` }}
                    />
                </div>

                {/* Boot message */}
                <div className='qt-loader__terminal'>
                    <span className='qt-loader__prompt'>{'>'}</span>
                    <span className='qt-loader__msg'>{display_message}</span>
                    <span
                        className='qt-loader__cursor'
                        style={{ opacity: show_cursor ? 1 : 0 }}
                    />
                </div>

                {/* Hex corner decorations */}
                <div className='qt-loader__corner qt-loader__corner--tl' aria-hidden />
                <div className='qt-loader__corner qt-loader__corner--tr' aria-hidden />
                <div className='qt-loader__corner qt-loader__corner--bl' aria-hidden />
                <div className='qt-loader__corner qt-loader__corner--br' aria-hidden />
            </div>
        </div>
    );
};

export default QTLoader;
