import React from 'react';
import { useLanguage } from './LanguageContext';

const AnimatedProjectIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 100"
        className="w-12 h-12 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .node { animation: nodePulse 4s ease-in-out infinite; }
            @keyframes nodePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
            .line-draw { stroke-dasharray: 100; stroke-dashoffset: 100; animation: draw 3s ease-out forwards; }
            @keyframes draw { to { stroke-dashoffset: 0; } }
        `}</style>
        <circle cx="60" cy="25" r="10" fill="white" className="node" />
        <line x1="60" y1="35" x2="60" y2="55" stroke="white" strokeWidth="3" className="line-draw" />
        <line x1="60" y1="55" x2="30" y2="55" stroke="white" strokeWidth="3" className="line-draw" />
        <line x1="60" y1="55" x2="90" y2="55" stroke="white" strokeWidth="3" className="line-draw" />
        <line x1="30" y1="55" x2="30" y2="75" stroke="white" strokeWidth="3" className="line-draw" />
        <line x1="90" y1="55" x2="90" y2="75" stroke="white" strokeWidth="3" className="line-draw" />
        <circle cx="30" cy="80" r="8" fill="white" className="node" style={{ animationDelay: '0.5s' }} />
        <circle cx="90" cy="80" r="8" fill="white" className="node" style={{ animationDelay: '1s' }} />
        <circle cx="60" cy="80" r="8" fill="white" className="node" style={{ animationDelay: '1.5s' }} />
        <line x1="60" y1="55" x2="60" y2="75" stroke="white" strokeWidth="3" className="line-draw" />
    </svg>
);

const ProjectBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="relative py-1.5 px-4 md:py-2.5 md:px-6 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-700 to-green-800 text-white overflow-hidden shadow-xl w-full">
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/5 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-16 h-16 bg-white/5 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-2">
                <div className="text-center md:text-left">
                    <h1 className="text-xl sm:text-2xl font-bold">{t('projects') || 'Dự án'}</h1>
                    <p className="mt-0.5 text-xs text-teal-100 max-w-lg">
                        Quản lý các dự án, tiến độ công việc và phân bổ nguồn lực hiệu quả.
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedProjectIcon />
                </div>
            </div>
        </div>
    );
};

export default ProjectBanner;
