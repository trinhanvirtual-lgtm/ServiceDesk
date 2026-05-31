
import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, LogoutIcon, NotificationScreenIcon } from './icons';
import WeatherClock from './WeatherClock';
import { User } from '../App';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm ring-2 ring-white/50 hover:ring-cyan-400 transition-all"
        aria-label="Open user menu"
      >
        {user.avatar ? <img src={user.avatar} alt={user.name} className="rounded-full w-full h-full object-cover" /> : getInitials(user.name)}
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white/80 backdrop-blur-xl rounded-lg shadow-2xl ring-1 ring-black/5 z-[9999] animate-fade-in-down">
          <div className="p-4 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-lg">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="rounded-full w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-sm text-slate-600 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-red-500/10 hover:text-red-600 transition-colors">
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TopBarProps {
  user: User;
  onLogout: () => void;
  onNotificationClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ user, onLogout, onNotificationClick }) => {
  return (
    <header className="flex items-center h-16 px-6 bg-white/40 backdrop-blur-lg border-b border-white/50 shrink-0 z-[60]">
      
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <UserMenu user={user} onLogout={onLogout} />
        <div className="w-px h-7 bg-slate-300/80"></div>
        <WeatherClock />
      </div>
      
      {/* Center Section */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-white/50 border border-transparent focus:bg-white/70 focus:border-cyan-400 focus:ring-0 focus:outline-none placeholder-slate-500 text-slate-800 rounded-full py-2 pl-11 pr-4 transition-all duration-300"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onNotificationClick}
          className="relative p-2 rounded-full hover:bg-white/50 transition-colors" 
          aria-label="View notifications"
        >
          <NotificationScreenIcon className="w-6 h-6 text-slate-700" />
          <span className="absolute top-1.5 right-1.5 block w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white/60"></span>
          <span className="sr-only">You have new notifications</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;