import React from 'react';
import { CheckCircleIcon, ChevronLeftIcon, XIcon, BellIcon } from './icons';
import { useLanguage } from './LanguageContext';
import { ActivityItem, AppNotification, User } from '../App';

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const renderNotificationIcon = (item: AppNotification, allUsers?: User[]) => {
    const matchedUser = allUsers?.find(u => 
        (item.title && item.title.toLowerCase().includes(u.name.toLowerCase())) ||
        (item.message && item.message.toLowerCase().includes(u.name.toLowerCase()))
    );

    const avatarUrl = item.avatar || matchedUser?.avatar;

    if (avatarUrl) {
        return (
            <img 
                src={avatarUrl} 
                alt={matchedUser?.name || 'User Avatar'} 
                className="w-10 h-10 rounded-full object-cover border-2 border-[--color-accent-400]/40 shadow-sm"
                referrerPolicy="no-referrer"
            />
        );
    }

    if (item.type === 'mention' || item.link === 'chat') {
        const initials = matchedUser ? getInitials(matchedUser.name) : 'C';
        return (
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-bold border border-indigo-200 dark:border-indigo-800 shadow-sm">
                {initials}
            </div>
        );
    }

    if (item.type === 'task') {
        return (
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm">
                <CheckCircleIcon className="w-5 h-5" />
            </div>
        );
    }

    return (
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
            <BellIcon className="w-5 h-5" />
        </div>
    );
};

const NotificationItemCard: React.FC<{ item: AppNotification, onClick: () => void, allUsers?: User[] }> = ({ item, onClick, allUsers }) => {
    return (
        <div 
            onClick={onClick}
            className={`flex items-start gap-3 p-[5px] rounded-lg hover:bg-[--color-surface-secondary] transition-colors cursor-pointer ${item.read ? 'bg-[--color-surface-primary] opacity-70' : 'bg-[--color-surface-secondary] border-l-2 border-[--color-accent-500]'}`}
        >
            <div className="relative shrink-0 mt-0.5">
                {renderNotificationIcon(item, allUsers)}
            </div>
            <div className="overflow-hidden flex-1">
                <p className="text-sm">
                    <strong className="font-semibold text-[--color-text-primary] block">{item.title}</strong>
                    <span className="text-[--color-text-secondary] block line-clamp-2 mt-0.5 leading-snug">{item.message}</span>
                </p>
                <p className="text-xs text-[--color-text-subtle] mt-1">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
            </div>
        </div>
    );
}

interface RightSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  activityLog: ActivityItem[];
  notifications: AppNotification[];
  onNotificationClick: (notif: AppNotification) => void;
  onCreateDemoNotification?: () => void;
  allUsers?: User[];
}

const RightSidebar: React.FC<RightSidebarProps> = (props) => {
  const { isCollapsed, isMobileOpen, onClose, onToggle, notifications, onNotificationClick, onCreateDemoNotification, allUsers } = props;
  const { t } = useLanguage();
  return (
    <div className={`fixed inset-y-0 right-0 z-40 md:relative md:z-auto shrink-0 transition-all duration-300 ease-in-out md:transform-none ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'} ${isCollapsed ? 'md:w-0' : 'md:w-80'}`}>
      <aside className={`relative flex flex-col bg-transparent backdrop-blur-lg h-full transition-all duration-300 ease-in-out w-72 md:w-full ${isCollapsed ? 'p-0 border-l-0 overflow-hidden' : 'p-[5px] border-l border-[--color-border-secondary]'}`}>
        <div className="md:hidden flex items-center justify-end mb-4">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10">
                <XIcon className="w-6 h-6 text-[--color-text-secondary]" />
            </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
            {/* Expanded View */}
            <div className={`flex flex-col flex-1 min-h-0 transition-opacity duration-200 ${isCollapsed && !isMobileOpen ? 'opacity-0 pointer-events-none absolute' : 'opacity-100 relative'}`}>
                <div className="flex items-center justify-between mb-4 pr-2">
                    <h2 className="text-lg font-semibold text-[--color-text-primary] whitespace-nowrap shrink-0">{t('notifications') || 'Thông báo'}</h2>
                    {onCreateDemoNotification && (
                        <button onClick={onCreateDemoNotification} className="text-xs text-[--color-accent-600] font-semibold bg-[--color-accent-500]/10 px-2 py-1 rounded hover:bg-[--color-accent-500]/20 transition-colors">
                            Demo
                        </button>
                    )}
                </div>
                <div className="flex-1 flex flex-col gap-[5px] overflow-y-auto -mr-4 pr-4 no-scrollbar">
                    {notifications.length === 0 ? (
                        <p className="text-sm text-[--color-text-subtle] text-center mt-6">Không có thông báo nào</p>
                    ) : notifications.map(item => (
                        <NotificationItemCard key={item.id} item={item} onClick={() => onNotificationClick(item)} allUsers={allUsers} />
                    ))}
                </div>
            </div>

            {/* Collapsed View - Icons */}
            <div className={`absolute top-6 left-0 right-0 flex-col items-center justify-start gap-4 transition-opacity duration-200 hidden md:flex ${isCollapsed && !isMobileOpen ? 'opacity-100 delay-150' : 'opacity-0 pointer-events-none'}`}>
                 <h2 className="text-xs font-bold text-[--color-text-subtle] uppercase px-2 whitespace-nowrap shrink-0 mb-2">Feed</h2>
                 {notifications.slice(0, 5).map(item => {
                    return (
                        <div key={item.id} className="relative cursor-pointer group" title={`${item.title} - ${item.message}`} onClick={() => { onToggle(); onNotificationClick(item); }}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.read ? 'opacity-50' : 'ring-2 ring-[--color-accent-500]'}`}>
                                {renderNotificationIcon(item, allUsers)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </aside>

      <button
          onClick={onToggle}
          className="absolute top-1/2 -left-3 -translate-y-1/2 bg-[--color-surface-secondary] hover:bg-[--color-accent-500] text-[--color-text-secondary] hover:text-white w-6 h-6 rounded-full hidden md:flex items-center justify-center z-30 ring-4 ring-[--color-background-body] transition-all duration-300 ease-in-out"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} />
        </button>
    </div>
  );
};

export default RightSidebar;
