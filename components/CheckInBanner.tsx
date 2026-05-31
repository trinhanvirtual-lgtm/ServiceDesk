import React from 'react';
import { useLanguage } from './LanguageContext';

const AnimatedCheckInIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .group-float { animation: float 6s ease-in-out infinite; }
            @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
            
            .fingerprint-line {
                stroke-dasharray: 20;
                stroke-dashoffset: 20;
                animation: draw-line 4s ease-in-out infinite alternate;
            }
            .line-1 { animation-delay: 0s; }
            .line-2 { animation-delay: 0.2s; }
            .line-3 { animation-delay: 0.4s; }
            .line-4 { animation-delay: 0.6s; }

            @keyframes draw-line {
                from { stroke-dashoffset: 20; }
                to { stroke-dashoffset: 0; }
            }
            .clock-hand {
                transform-origin: center;
                animation: tick 12s linear infinite;
            }
            @keyframes tick {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
        <g className="group-float">
            {/* Clock */}
            <circle cx="60" cy="50" r="38" fill="#fff" />
            <circle cx="60" cy="50" r="35" fill="none" stroke="#e0e7ff" strokeWidth="4" />
            <line className="clock-hand" x1="60" y1="50" x2="60" y2="30" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
            <line className="clock-hand" style={{animationDuration: '144s'}} x1="60" y1="50" x2="80" y2="50" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="50" r="4" fill="#a5b4fc" />

            {/* Fingerprint */}
            <g transform="translate(60, 50) scale(0.6)">
                <path className="fingerprint-line line-1" d="M0 -22 a 22 22 0 1 1 -0.1 0" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
                <path className="fingerprint-line line-2" d="M0 -15 a 15 15 0 1 1 -0.1 0" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <path className="fingerprint-line line-3" d="M0 -8 a 8 8 0 1 1 -0.1 0" fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
                <path className="fingerprint-line line-4" d="M0 0 a 2 2 0 1 1 -0.1 0" fill="none" stroke="#a5b4fc" strokeWidth="3" strokeLinecap="round" />
            </g>
        </g>
    </svg>
);

const CheckInBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-700 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">{t('timekeeping')}</h1>
                    <p className="mt-2 text-cyan-100 max-w-lg italic">
                        “Mọi khoảnh khắc đều được ghi nhận – chính xác, minh bạch.”
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedCheckInIcon />
                </div>
            </div>
        </div>
    );
};

export default CheckInBanner;