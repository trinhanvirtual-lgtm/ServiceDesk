import React, { useState } from 'react';
import { HomeIcon, CalendarIcon, StickyNoteIcon, ChecklistIcon, UsersIcon, FolderIcon, BookOpenIcon, RssIcon, GraduationCapIcon, XIcon, ClipboardListIcon, ChevronDownIcon, ChevronUpIcon, SitemapIcon, WorkflowIcon } from './icons';
import { View, RecentItem } from '../App';
import { useLanguage } from './LanguageContext';

// --- Sidebar Components ---

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, isCollapsed, onClick }) => (
  <button onClick={onClick} className={`flex items-center w-full gap-3 px-4 py-[8px] rounded-lg transition-colors ${active ? 'bg-[--color-surface-tertiary] text-[--color-accent-700] dark:text-[--color-accent-400] font-semibold shadow-sm' : 'text-[--color-text-secondary] hover:bg-[--color-surface-secondary] hover:text-[--color-text-primary]'} ${isCollapsed ? 'justify-center' : ''}`}>
    <div className="flex-center-icon w-5 h-5 shrink-0">
      {icon}
    </div>
    <span className={`whitespace-nowrap font-medium text-sm transition-opacity duration-200 leading-none ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
  </button>
);

interface LeftSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeView: View;
  onNavigate: (view: View, section?: string) => void;
  recentlyViewed: RecentItem[];
  onAiClick?: () => void;
  isAiOpen?: boolean;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isCollapsed, isMobileOpen, onClose, onMouseEnter, onMouseLeave, activeView, onNavigate, recentlyViewed, onAiClick, isAiOpen }) => {
  const { t } = useLanguage();
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);

  return (
    <div 
        className={`fixed inset-y-0 left-0 z-40 md:relative md:z-20 shrink-0 transition-transform duration-300 ease-in-out md:transform-none ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
      <aside className={`flex flex-col p-[5px] bg-transparent backdrop-blur-lg border-r border-[--color-border-secondary] h-full transition-all duration-300 ease-in-out w-64 md:${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-end mb-6 md:hidden">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10">
                <XIcon className="w-6 h-6 text-[--color-text-secondary]" />
            </button>
        </div>
        <nav className="flex-grow flex flex-col justify-center gap-[5px] overflow-y-auto no-scrollbar">
          <NavItem icon={<HomeIcon className="w-5 h-5 shrink-0 text-indigo-500" />} label={t('dashboard')} active={activeView === 'dashboard'} isCollapsed={isCollapsed} onClick={() => onNavigate('dashboard')} />
          <NavItem icon={<RssIcon className="w-5 h-5 shrink-0 text-orange-500" />} label={t('newsfeed')} active={activeView === 'newsfeed'} isCollapsed={isCollapsed} onClick={() => onNavigate('newsfeed')} />
          
          <NavItem icon={<ChecklistIcon className="w-5 h-5 shrink-0 text-teal-600" />} label={t('projects') || 'Dự án'} active={activeView === 'projects'} isCollapsed={isCollapsed} onClick={() => onNavigate('projects')} />
          <NavItem icon={<FolderIcon className="w-5 h-5 shrink-0 text-yellow-500" />} label={t('drive')} active={activeView === 'drive'} isCollapsed={isCollapsed} onClick={() => onNavigate('drive')} />
          <NavItem icon={<ChecklistIcon className="w-5 h-5 shrink-0 text-green-500" />} label={t('tasklist')} active={activeView === 'tasklist'} isCollapsed={isCollapsed} onClick={() => onNavigate('tasklist')} />
          <NavItem icon={<UsersIcon className="w-5 h-5 shrink-0 text-cyan-500" />} label={t('contacts')} active={activeView === 'contacts'} isCollapsed={isCollapsed} onClick={() => onNavigate('contacts')} />
          <NavItem icon={<CalendarIcon className="w-5 h-5 shrink-0 text-red-500" />} label={t('calendar')} active={activeView === 'calendar'} isCollapsed={isCollapsed} onClick={() => onNavigate('calendar')} />
          <NavItem icon={<StickyNoteIcon className="w-5 h-5 shrink-0 text-amber-500" />} label={t('notes')} active={activeView === 'notes'} isCollapsed={isCollapsed} onClick={() => onNavigate('notes')} />
          <NavItem icon={<BookOpenIcon className="w-5 h-5 shrink-0 text-emerald-500" />} label={t('blog')} active={activeView === 'blog'} isCollapsed={isCollapsed} onClick={() => onNavigate('blog')} />
          <NavItem icon={<GraduationCapIcon className="w-5 h-5 shrink-0 text-violet-500" />} label={t('training')} active={activeView === 'training'} isCollapsed={isCollapsed} onClick={() => onNavigate('training')} />
          <NavItem icon={<ClipboardListIcon className="w-5 h-5 shrink-0 text-rose-500" />} label={t('requestsAndApprovals')} active={activeView === 'requests'} isCollapsed={isCollapsed} onClick={() => onNavigate('requests')} />
          <NavItem icon={<SitemapIcon className="w-5 h-5 shrink-0 text-cyan-600" />} label={t('orgChartConfig')} active={activeView === 'org-chart'} isCollapsed={isCollapsed} onClick={() => onNavigate('org-chart')} />
          <NavItem icon={<WorkflowIcon className="w-5 h-5 shrink-0 text-fuchsia-500" />} label="Quy trình" active={activeView === 'process'} isCollapsed={isCollapsed} onClick={() => onNavigate('process')} />

          {recentlyViewed.length > 0 && (
            <div className="shrink-0 mt-2">
              <div className="w-full border-t my-2 border-[--color-border-secondary]"></div>
              <button 
                onClick={() => setIsRecentExpanded(!isRecentExpanded)}
                className={`w-full flex items-center justify-between px-4 py-1 text-xs font-bold uppercase tracking-wider text-[--color-text-subtle] hover:text-[--color-text-primary] transition-colors ${isCollapsed ? 'justify-center opacity-0 h-0 hidden' : 'opacity-100'}`}
              >
                <span>{t('recentlyViewed') || 'RECENT'}</span>
                {isRecentExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 flex flex-col gap-[5px] mt-1 ${isRecentExpanded || isCollapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {recentlyViewed.map(item => (
                  <NavItem
                    key={item.id}
                    icon={React.cloneElement(item.icon, { className: "w-5 h-5 shrink-0" })}
                    label={item.name}
                    isCollapsed={isCollapsed}
                    onClick={() => onNavigate(item.type, item.itemId)}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {onAiClick && (
          <div className={`mt-auto pt-4 border-t border-[--color-border-secondary]/60 flex flex-col items-center shrink-0 ${isCollapsed ? 'opacity-100' : ''}`}>
            {!isCollapsed ? (
              <button
                onClick={onAiClick}
                className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${
                  isAiOpen 
                    ? 'from-indigo-500/20 to-purple-500/20 border-[--color-accent-500]' 
                    : 'from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/18 hover:to-purple-500/18 border-[--color-border-secondary]'
                } border transition-all duration-300 transform active:scale-95 text-left`}
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-purple-500/30">
                  <img 
                    src="https://i.ibb.co/x8Spz9Qm/Avata-AI-POW.gif" 
                    alt="AI Assistant"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[--color-text-primary] flex items-center gap-1.5">
                    Trợ lý ảo AI
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  </div>
                  <div className="text-xs text-[--color-text-subtle] truncate">Trò chuyện & hỗ trợ...</div>
                </div>
              </button>
            ) : (
              <button
                onClick={onAiClick}
                className={`w-12 h-12 rounded-full overflow-hidden shrink-0 border transition-all duration-300 ${
                  isAiOpen ? 'border-[--color-accent-500] ring-2 ring-[--color-accent-500]/50' : 'border-purple-500/30 hover:shadow-lg hover:scale-105'
                }`}
                title="Trợ lý ảo AI"
              >
                <img 
                  src="https://i.ibb.co/x8Spz9Qm/Avata-AI-POW.gif" 
                  alt="AI Assistant"
                  className="w-full h-full object-cover" 
                />
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};

export default LeftSidebar;