import React from 'react';
import { useLanguage } from './LanguageContext';

const AnimatedAccountIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .account-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .gear {
                transform-origin: center;
                animation: spin 8s linear infinite;
            }
            .gear-2 {
                animation-direction: reverse;
                animation-duration: 6s;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
        <g className="account-group">
            {/* User Profile Icon */}
            <circle cx="60" cy="50" r="35" fill="#fff" />
            <circle cx="60" cy="42" r="12" fill="#c7d2fe" />
            <path d="M40 72 a 20 12 0 0 1 40 0 Z" fill="#c7d2fe"/>

            {/* Spinning Gears */}
            <g className="gear" transform="translate(25, 65)">
                <path fill="#a5b4fc" d="M12.7.2c-.4-.1-.8.2-1 .6l-2.2 3.8c-.2.4-.1.9.3 1.1l2.9 1.7c.4.2.9.1 1.1-.3l2.2-3.8c.2-.4.1-.9-.3-1.1L12.7.2z M23.3 5.4l-2.9 1.7c-.4.2-.9.1-1.1-.3L17.1 3c-.2-.4-.1-.9.3-1.1l2.9-1.7c.4-.2.9-.1 1.1.3l2.2 3.8c.3.4.2.9-.2 1.1z M22.2 16.5l-2.2 3.8c-.2.4-.7.6-1.1.3l-2.9-1.7c-.4-.2-.6-.7-.3-1.1l2.2-3.8c.2-.4.7-.6 1.1-.3l2.9 1.7c.4.3.5.8.3 1.1z M7.8 16.5c.2-.4.7-.6 1.1-.3l2.9 1.7c.4.2.6.7.3 1.1l-2.2 3.8c-.2.4-.7.6-1.1.3l-2.9-1.7c-.4-.2-.6-.7-.3-1.1l2.2-3.8z M.2 12.7c.1-.4.5-.7.9-.6l3.8 2.2c.4.2.6.7.4 1.1l-1.7 2.9c-.2.4-.7.6-1.1.4l-3.8-2.2c-.4-.2-.6-.7-.4-1.1l1.7-2.9z M17.4 23.3l3.8 2.2c.4.2.6.7.4 1.1l-1.7 2.9c-.2.4-.7.6-1.1.4l-3.8-2.2c-.4-.2-.6-.7-.4-1.1l1.7-2.9c.2-.4.6-.7 1-.6z"/>
                <circle fill="#a5b4fc" cx="15" cy="15" r="5" />
            </g>
             <g className="gear gear-2" transform="translate(75, 20) scale(0.6)">
                <path fill="#a5b4fc" d="M12.7.2c-.4-.1-.8.2-1 .6l-2.2 3.8c-.2.4-.1.9.3 1.1l2.9 1.7c.4.2.9.1 1.1-.3l2.2-3.8c.2-.4.1-.9-.3-1.1L12.7.2z M23.3 5.4l-2.9 1.7c-.4.2-.9.1-1.1-.3L17.1 3c-.2-.4-.1-.9.3-1.1l2.9-1.7c.4-.2.9-.1 1.1.3l2.2 3.8c.3.4.2.9-.2 1.1z M22.2 16.5l-2.2 3.8c-.2.4-.7.6-1.1.3l-2.9-1.7c-.4-.2-.6-.7-.3-1.1l2.2-3.8c.2-.4.7-.6 1.1-.3l2.9 1.7c.4.3.5.8.3 1.1z M7.8 16.5c.2-.4.7-.6 1.1-.3l2.9 1.7c.4.2.6.7.3 1.1l-2.2 3.8c-.2.4-.7.6-1.1.3l-2.9-1.7c-.4-.2-.6-.7-.3-1.1l2.2-3.8z M.2 12.7c.1-.4.5-.7.9-.6l3.8 2.2c.4.2.6.7.4 1.1l-1.7 2.9c-.2.4-.7.6-1.1.4l-3.8-2.2c-.4-.2-.6-.7-.4-1.1l1.7-2.9z M17.4 23.3l3.8 2.2c.4.2.6.7.4 1.1l-1.7 2.9c-.2.4-.7.6-1.1.4l-3.8-2.2c-.4-.2-.6-.7-.4-1.1l1.7-2.9c.2-.4.6-.7 1-.6z"/>
                <circle fill="#a5b4fc" cx="15" cy="15" r="5" />
            </g>
        </g>
    </svg>
);


const GoogleSyncBanner: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-slate-700 via-gray-800 to-slate-900 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">{t('accountSettings')}</h1>
                    <p className="mt-2 text-slate-300 max-w-lg italic">
                       {t('accountSlogan')}
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedAccountIcon />
                </div>
            </div>
        </div>
    );
};

export default GoogleSyncBanner;