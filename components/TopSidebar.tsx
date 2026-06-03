import React, { useState, useEffect, useRef } from 'react';
import { 
    SearchIcon, BellIcon, MenuIcon, LogoIcon, ChatIcon, MailIcon, GlobeIcon
} from './icons';
import WeatherClock from './WeatherClock';
import { User, View } from '../App';
import { useLanguage } from './LanguageContext';
import { initialFileSystem } from './DriveView';
import { initialContacts } from './ContactsView';
import { mockTaskLists } from './TasklistView';
import { mockEvents } from './CalendarView';
import { mockMessages } from './ChatView';
import GlobalSearchResults from './GlobalSearchResults';
import UserMenu from './UserMenu';

interface TopSidebarProps {
  user: User;
  onLogout: () => void;
  onNotificationClick: () => void;
  onNavigate: (view: View, section?: string) => void;
  onToggleMobileNav: () => void;
  onToggleMobileActivity: () => void;
  unreadCount?: number;
}

interface SearchResults {
  articles?: unknown[];
  files?: unknown[];
  contacts?: unknown[];
  tasks?: unknown[];
  events?: unknown[];
  messages?: unknown[];
  empty?: boolean;
}

const TopSidebar: React.FC<TopSidebarProps> = ({ user, onLogout, onNotificationClick, onNavigate, onToggleMobileNav, onToggleMobileActivity, unreadCount = 0 }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);

  const performSearch = (query: string) => {
      if (!query) {
          setSearchResults(null);
          return;
      }
      const lowerQuery = query.toLowerCase();
      
      const results = {
          articles: [], // Removed mockArticles, will integrate Firestore search later if needed
          files: initialFileSystem.filter(f => f.name.toLowerCase().includes(lowerQuery) && f.type !== 'folder'),
          contacts: initialContacts.filter(c => c.name.toLowerCase().includes(lowerQuery)),
          tasks: mockTaskLists.flatMap(list => list.tasks.filter(t => !t.completed && t.text.toLowerCase().includes(lowerQuery))),
          events: mockEvents.filter(e => e.title.toLowerCase().includes(lowerQuery)),
          messages: mockMessages.filter(m => m.content.toLowerCase().includes(lowerQuery)),
      };

      const hasResults = Object.values(results).some(arr => arr.length > 0);
      setSearchResults(hasResults ? results : { empty: true });
  };
  
  // Debounce search
  useEffect(() => {
      const handler = setTimeout(() => {
          performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle click outside to close search
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleCloseSearch = () => {
    setIsSearchFocused(false);
    setSearchQuery('');
    setSearchResults(null);
  };


  return (
    <header className="flex items-center h-16 px-4 md:px-6 bg-transparent backdrop-blur-lg shrink-0 z-[60] border-b border-[--color-border-secondary]">
      
      {/* --- Desktop View --- */}
      <div className="hidden md:flex items-center h-full gap-4">
        <UserMenu user={user} onLogout={onLogout} onNavigate={onNavigate} />
        <div className="w-px h-8 bg-[--color-border-secondary] mx-1"></div>
        <WeatherClock />
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center px-4 h-full">
        <form onSubmit={(e) => { e.preventDefault(); performSearch(searchQuery); setIsSearchFocused(true); }} className="relative w-full max-w-lg flex items-center gap-2" ref={searchRef}>
          <div className="relative flex-1 flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-[--color-text-subtle]" />
            </div>
            <input
              type="search"
              placeholder={t('searchAllPlaceholder')}
              className="w-full bg-[--color-surface-primary] border border-transparent focus:bg-[--color-surface-secondary] focus:border-[--color-accent-400] focus:ring-0 focus:outline-none placeholder:text-[--color-text-subtle] text-[--color-text-primary] rounded-full py-2 pl-11 pr-4 transition-all duration-300 text-sm font-medium"
              aria-label={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
          </div>
          <button type="submit" className="flex items-center justify-center p-2 rounded-full bg-[--color-accent-500] text-white hover:bg-[--color-accent-600] transition-colors shrink-0 shadow-sm" aria-label={t('submitSearch')}>
            <SearchIcon className="h-5 w-5" />
          </button>
          
          {isSearchFocused && searchQuery && (
             <GlobalSearchResults
                results={searchResults}
                onNavigate={onNavigate}
                onClose={handleCloseSearch}
             />
          )}
        </form>
      </div>
      <div className="hidden md:flex items-center gap-2">
        {(user.role === 'superadmin' || user.role === 'admin') && (
          <button 
            onClick={() => onNavigate('website-data')}
            className="p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-sky-500"
            title="Quản trị website"
          >
            <GlobeIcon className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={() => onNavigate('email')}
          className="p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-red-500"
          title={t('email')}
        >
          <MailIcon className="w-5 h-5 fill-current" />
        </button>
        <button 
          onClick={() => onNavigate('chat')}
          className="p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-green-500"
          title={t('chat')}
        >
          <ChatIcon className="w-5 h-5 fill-current" />
        </button>
        <button 
          onClick={onNotificationClick}
          className="relative p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-yellow-500" 
          aria-label={t('newNotifications')}
        >
          <BellIcon className="w-6 h-6 fill-current" />
          {unreadCount > 0 && <span className="absolute -top-0 -right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 rounded-full text-white text-[10px] font-bold ring-2 ring-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          <span className="sr-only">{t('newNotifications')}</span>
        </button>
      </div>

      {/* --- Mobile View --- */}
      <div className="flex md:hidden items-center justify-between w-full">
         <button 
          onClick={onToggleMobileNav}
          className="p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors" 
          aria-label={t('openNavigationMenu')}
        >
          <MenuIcon className="w-6 h-6 text-[--color-text-secondary]" />
        </button>

         <div className="flex items-center gap-2 text-indigo-600">
            <LogoIcon className="w-7 h-7" />
            <span className="font-bold text-lg text-[--color-text-primary]">POW</span>
        </div>

        <div className="flex items-center gap-1">
            {(user.role === 'superadmin' || user.role === 'admin') && (
              <button 
                onClick={() => onNavigate('website-data')}
                className="p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-sky-500"
                title="Quản trị website"
              >
                <GlobeIcon className="w-6 h-6" />
              </button>
            )}
            <button 
              onClick={() => onNavigate('email')}
              className="p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-red-500"
              title={t('email')}
            >
              <MailIcon className="w-6 h-6 fill-current" />
            </button>
            <button 
              onClick={() => onNavigate('chat')}
              className="p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-green-500"
              title={t('chat')}
            >
              <ChatIcon className="w-6 h-6 fill-current" />
            </button>
            <button 
            onClick={onToggleMobileActivity}
            className="relative p-2 rounded-full hover:bg-[--color-surface-secondary] transition-colors text-yellow-500" 
            aria-label={t('newNotifications')}
            >
            <BellIcon className="w-6 h-6 fill-current" />
            {unreadCount > 0 && <span className="absolute -top-0 -right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 rounded-full text-white text-[10px] font-bold ring-2 ring-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            <span className="sr-only">{t('newNotifications')}</span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default TopSidebar;