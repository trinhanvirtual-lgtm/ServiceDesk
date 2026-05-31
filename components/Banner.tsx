
import React from 'react';
import { useLanguage } from './LanguageContext';

interface BannerProps {
  userName: string;
}

const Banner: React.FC<BannerProps> = ({ userName }) => {
  const { t } = useLanguage();
  return (
    <div className="relative py-4 px-8 rounded-xl bg-gradient-to-br from-[--color-accent-400] to-[--color-accent-gradient-secondary] text-white overflow-hidden shadow-lg">
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full opacity-50 z-0"></div>
      <div className="absolute top-4 left-4 w-24 h-24 bg-white/10 rounded-full opacity-50 z-0"></div>
      <div className="relative z-10">
        <h1 className="text-3xl font-bold">{t('welcomeUser', { userName })}</h1>
        <p className="mt-2 text-white/80 max-w-lg">
          {t('welcomeDesc')}
        </p>
        <button className="mt-6 bg-white text-[--color-accent-600] font-semibold px-6 py-2.5 rounded-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105 shadow-md">
          {t('viewAnalytics')}
        </button>
      </div>
    </div>
  );
};

export default Banner;
