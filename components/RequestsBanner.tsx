import React from 'react';
import { useLanguage } from './LanguageContext';

const AnimatedRequestsIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 100"
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .doc-float { animation: floatDoc 6s ease-in-out infinite; }
            @keyframes floatDoc { 0% { transform: translateY(0px) rotate(-5deg); } 50% { transform: translateY(-8px) rotate(2deg); } 100% { transform: translateY(0px) rotate(-5deg); } }
            
            .check-pulse { animation: checkPulse 4s ease-in-out infinite; }
            @keyframes checkPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        `}</style>
        <g className="doc-float">
            <path d="M30 10 h50 a10 10 0 0 1 10 10 v60 a10 10 0 0 1 -10 10 h-60 a10 10 0 0 1 -10 -10 v-50 z" fill="#e0e7ff" />
            <path d="M30 10 v20 h-20" fill="#c7d2fe" />
            <line x1="30" y1="40" x2="70" y2="40" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
            <line x1="30" y1="55" x2="80" y2="55" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
            <line x1="30" y1="70" x2="60" y2="70" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
        </g>
        <g className="check-pulse" transform="translate(60, 50)">
            <circle cx="20" cy="20" r="25" fill="#4ade80" />
            <path d="M10 20 l8 8 l15 -15" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    </svg>
);

const RequestsBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="relative py-3 px-6 md:py-4 md:px-8 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-700 to-green-800 text-white overflow-hidden shadow-xl">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold">{t('requestsAndApprovals') || "Phê duyệt"}</h1>
                    <p className="mt-2 text-green-100 max-w-lg">
                        Quản lý và phê duyệt các yêu cầu, đề xuất của nhân viên và quy trình nội bộ.
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedRequestsIcon />
                </div>
            </div>
        </div>
    );
};

export default RequestsBanner;
