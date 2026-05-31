import React from 'react';
import { useLanguage } from './LanguageContext';

const AnimatedUserManagementIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 100"
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .group-float { animation: float 6s ease-in-out infinite; }
            @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
            
            .shield-pulse { animation: pulse 4s ease-in-out infinite; }
            @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

            .key-swing { transform-origin: top center; animation: swing 4s ease-in-out infinite; }
            @keyframes swing { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
        `}</style>
        <g className="group-float">
            {/* Shield */}
            <path className="shield-pulse" d="M60 15 L10 35 L10 65 C 10 85, 60 100, 60 100 C 60 100, 110 85, 110 65 L110 35 Z" fill="#fff" />
            <path d="M60 20 L20 40 L20 65 C 20 80, 60 92, 60 92 C 60 92, 100 80, 100 65 L100 40 Z" fill="#818cf8" />
             <path d="M60 25 L30 45 L30 65 C 30 75, 60 85, 60 85 C 60 85, 90 75, 90 65 L90 45 Z" fill="#c7d2fe" />
            
            {/* Key */}
            <g className="key-swing" transform="translate(60, 45)">
                 <line x1="0" y1="0" x2="0" y2="20" stroke="#fbbf24" strokeWidth="4" />
                 <circle cx="0" cy="0" r="8" fill="none" stroke="#f59e0b" strokeWidth="4" />
                 <line x1="0" y1="15" x2="5" y2="15" stroke="#fbbf24" strokeWidth="4" />
                 <line x1="0" y1="20" x2="5" y2="20" stroke="#fbbf24" strokeWidth="4" />
            </g>
        </g>
    </svg>
);


const UserManagementBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-900 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">{t('userManagementTitle')}</h1>
                    <p className="mt-2 text-purple-200 max-w-lg italic">
                        {t('userManagementSlogan')}
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedUserManagementIcon />
                </div>
            </div>
        </div>
    );
};

export default UserManagementBanner;