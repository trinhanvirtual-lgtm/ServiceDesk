import React from 'react';
import { useLanguage } from './LanguageContext';

const AnimatedWebsiteIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .globe { animation: rotate 20s linear infinite; transform-origin: 60px 50px; }
            @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .orbit { animation: orbit 8s linear infinite; transform-origin: 60px 50px; }
            @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        <circle cx="60" cy="50" r="30" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" className="globe" />
        <circle cx="60" cy="50" r="20" fill="white" opacity="0.2" />
        <path d="M60 20 L60 80 M30 50 L90 50" stroke="white" strokeWidth="2" opacity="0.5" />
        <ellipse cx="60" cy="50" rx="30" ry="10" fill="none" stroke="white" strokeWidth="2" opacity="0.3" transform="rotate(45 60 50)" />
        <ellipse cx="60" cy="50" rx="30" ry="10" fill="none" stroke="white" strokeWidth="2" opacity="0.3" transform="rotate(-45 60 50)" />
        <g className="orbit">
            <circle cx="90" cy="50" r="4" fill="white" />
        </g>
    </svg>
);

const WebsiteBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="relative py-3 px-6 md:py-4 md:px-8 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 text-white overflow-hidden shadow-xl">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold">{t('websiteDataManagement') || 'Quản trị trang Web'}</h1>
                    <p className="mt-2 text-blue-100 max-w-lg">
                        Quản lý nội dung, hình ảnh và cấu hình hệ thống website doanh nghiệp tập trung.
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedWebsiteIcon />
                </div>
            </div>
        </div>
    );
};

export default WebsiteBanner;
