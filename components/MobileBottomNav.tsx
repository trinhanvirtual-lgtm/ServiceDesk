import React from 'react';
// FIX: Import IconProps to correctly type the icon element.
import { HomeIcon, CalendarIcon, ChecklistIcon, RssIcon, MenuIcon, IconProps } from './icons';
import { View } from '../App';
import { useLanguage } from './LanguageContext';

interface MobileBottomNavProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onToggleMobileNav: () => void;
}

const NavButton: React.FC<{
    // FIX: Use React.ReactElement<IconProps> to give the icon prop a specific type, allowing cloneElement to know about 'className'.
    icon: React.ReactElement<IconProps>;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 w-full pt-2 pb-1 transition-colors ${isActive ? 'text-[--color-accent-600]' : 'text-[--color-text-subtle] hover:text-[--color-text-primary]'}`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
        <span className="text-xs font-medium">{label}</span>
    </button>
);


const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, onNavigate, onToggleMobileNav }) => {
    const { t } = useLanguage();
    
    return (
        <footer className="md:hidden fixed bottom-1 overflow-hidden h-16 bg-[--color-surface-tertiary]/80 backdrop-blur-lg border-t border-[--color-border-primary] z-30 flex items-center justify-around w-full">
            <NavButton icon={<HomeIcon />} label={t('dashboard')} isActive={activeView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
            <NavButton icon={<CalendarIcon />} label={t('calendar')} isActive={activeView === 'calendar'} onClick={() => onNavigate('calendar')} />
            <NavButton icon={<ChecklistIcon />} label={t('tasklist')} isActive={activeView === 'tasklist' || activeView === 'tasks'} onClick={() => onNavigate('tasks')} />
            <NavButton icon={<RssIcon />} label={t('newsfeed')} isActive={activeView === 'newsfeed'} onClick={() => onNavigate('newsfeed')} />
            <NavButton icon={<MenuIcon />} label={t('mode') || 'Menu'} isActive={false} onClick={onToggleMobileNav} />
        </footer>
    );
};

export default MobileBottomNav;