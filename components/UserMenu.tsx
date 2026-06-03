import React, { useState, useEffect, useRef } from 'react';
import { User, View } from '../App';
import { useLanguage } from './LanguageContext';

import { SettingsIcon, LogoutIcon } from './icons';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: View, section?: string) => void;
  direction?: 'up' | 'down';
}

const MenuItem: React.FC<{ icon?: React.ReactNode; label: string; onClick?: () => void; isDestructive?: boolean }> = ({ icon, label, onClick, isDestructive }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isDestructive 
            ? 'text-red-500 hover:bg-red-500/10'
            : 'text-[--color-text-primary] hover:bg-[--color-surface-secondary]'
        }`}
    >
        <div className="flex items-center gap-3">
            {icon}
            <span>{label}</span>
        </div>
    </button>
  );

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onNavigate, direction = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-[--color-accent-500] text-white flex items-center justify-center font-bold text-sm ring-2 ring-white/50 hover:ring-[--color-accent-400] transition-all"
        aria-label="Open user menu"
      >
        {user.avatar ? <img src={user.avatar} alt={user.name} className="rounded-full w-full h-full object-cover" /> : getInitials(user.name)}
      </button>
      {isOpen && (
        <div className={`absolute left-0 w-64 bg-[--color-surface-tertiary] backdrop-blur-xl rounded-lg shadow-2xl ring-1 ring-black/5 z-[9999] overflow-hidden animate-fade-in-up ${direction === 'up' ? 'bottom-full mb-2' : 'mt-2'}`}>
          <div className="p-4 border-b border-[--color-border-secondary]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[--color-accent-500] text-white flex items-center justify-center font-bold text-lg">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="rounded-full w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
              <div>
                <p className="font-semibold text-[--color-text-primary] truncate">{user.name}</p>
                <p className="text-sm text-[--color-text-secondary] truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <MenuItem icon={<SettingsIcon className="w-4 h-4 text-slate-500" />} label={t('settings')} onClick={() => { onNavigate('settings'); setIsOpen(false); }} />
            <div className="w-full border-t my-1 border-[--color-border-secondary]"></div>
            <MenuItem icon={<LogoutIcon className="w-4 h-4 text-red-500" />} label={t('logout')} onClick={onLogout} isDestructive />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
