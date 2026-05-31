import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification, User } from '../App';
import { BellIcon, CheckCircleIcon, XIcon } from './icons';

interface NotificationToastProps {
  notifications: AppNotification[];
  onClose: (id: string) => void;
  onClick: (notification: AppNotification) => void;
  allUsers?: User[];
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const renderNotificationIcon = (notif: AppNotification, allUsers?: User[]) => {
    const matchedUser = allUsers?.find(u => 
        (notif.title && notif.title.toLowerCase().includes(u.name.toLowerCase())) ||
        (notif.message && notif.message.toLowerCase().includes(u.name.toLowerCase()))
    );

    const avatarUrl = notif.avatar || matchedUser?.avatar;

    if (avatarUrl) {
        return (
            <img 
                src={avatarUrl} 
                alt={matchedUser?.name || 'User Avatar'} 
                className="w-10 h-10 rounded-full object-cover border border-[--color-accent-400]/40 shadow-sm"
                referrerPolicy="no-referrer"
            />
        );
    }

    if (notif.type === 'mention' || notif.link === 'chat') {
        const initials = matchedUser ? getInitials(matchedUser.name) : 'C';
        return (
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-bold border border-indigo-200 dark:border-indigo-800 shadow-sm">
                {initials}
            </div>
        );
    }

    if (notif.type === 'task') {
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

const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onClose, onClick, allUsers }) => {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <motion.div
            layout
            key={notif.id}
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
            className="bg-[--color-surface-primary] border border-[--color-border-secondary] shadow-2xl rounded-xl p-4 w-80 md:w-96 flex items-start gap-4 cursor-pointer pointer-events-auto ring-1 ring-black/5"
            onClick={() => onClick(notif)}
          >
            <div className="shrink-0 mt-0.5">
              {renderNotificationIcon(notif, allUsers)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[--color-text-primary] text-sm truncate">{notif.title}</h4>
              <p className="text-sm text-[--color-text-secondary] mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(notif.id); }}
                className="shrink-0 text-[--color-text-subtle] hover:text-[--color-text-primary] p-2 rounded-lg hover:bg-[--color-surface-secondary] transition-colors"
                aria-label="Close notification"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;
