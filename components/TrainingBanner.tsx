import React from 'react';
import { useLanguage } from './LanguageContext';

const AnimatedTrainingIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .cap-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .tassel {
                transform-origin: 50% 0%;
                animation: swing 4s ease-in-out infinite;
            }
            @keyframes swing {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(15deg); }
            }
            .sparkle {
                opacity: 0;
                animation: sparkle-anim 4s ease-in-out infinite;
            }
            @keyframes sparkle-anim {
                0% { opacity: 0; transform: scale(0.5); }
                25% { opacity: 1; transform: scale(1.1); }
                50% { opacity: 0; transform: scale(0.5); }
                100% { opacity: 0; }
            }
        `}</style>
        <g className="cap-group">
            {/* Cap Body */}
            <polygon points="10,40 60,20 110,40 60,60" fill="#6366f1"/>
            <path d="M10,40 C 10,50 110,50 110,40 L60,60 Z" fill="#4f46e5"/>
            <rect x="35" y="45" width="50" height="30" rx="5" fill="#4338ca"/>
            {/* Tassel */}
            <g className="tassel" transform="translate(60,20)">
                <line x1="0" y1="0" x2="0" y2="25" stroke="#f59e0b" strokeWidth="3"/>
                <circle cx="0" cy="0" r="4" fill="#fbbf24"/>
            </g>
        </g>
         <g>
            <path className="sparkle" style={{animationDelay: '0.5s'}} d="M20 20 L25 25 L20 30 L15 25Z" fill="#fff" />
            <path className="sparkle" style={{animationDelay: '1.5s'}} d="M95 60 L100 65 L95 70 L90 65Z" fill="#fff" />
        </g>
    </svg>
);


const TrainingBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">{t('trainingDashboard')}</h1>
                    <p className="mt-2 text-purple-100 max-w-lg italic">
                        {t('trainingSlogan')}
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedTrainingIcon />
                </div>
            </div>
        </div>
    );
};

export default TrainingBanner;
