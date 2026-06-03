import React, { useState, useMemo } from 'react';
import { User, RecentItem } from '../App';
import { LinkIcon, ReplyIcon, ForwardIcon, TrashIcon, MailIcon, StarIcon, SyncIcon, TagIcon, UsersIcon, ChevronLeftIcon, MenuIcon } from './icons';
import ComposeModal from './ComposeModal';
import EmailBanner from './EmailBanner';
import { useLanguage } from './LanguageContext';

interface Email {
  id: string;
  sender: { name: string; email: string; avatar: string; };
  subject: string;
  body: string;
  snippet: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  category: 'primary' | 'promotions' | 'social';
}

export const mockEmails: Email[] = [
  {
    id: '1',
    sender: { name: 'Figma', email: 'team@figma.com', avatar: 'F' },
    subject: 'Weekly Design Digest - New plugins and tutorials',
    snippet: 'Hey Hung, check out the latest updates from the Figma community. We have new plugins for accessibility checking...',
    body: '<h2>Hey Hung,</h2><p>Check out the latest updates from the Figma community. We have new plugins for accessibility checking, advanced prototyping features, and a fresh batch of tutorials from top designers.</p><p>Explore new plugins now and enhance your workflow!</p><p>Best,<br>The Figma Team</p>',
    timestamp: '2h ago',
    read: false,
    starred: true,
    category: 'primary',
  },
  {
    id: '2',
    sender: { name: 'GitHub', email: 'noreply@github.com', avatar: 'G' },
    subject: '[WebApp-Project] New issue opened: #241',
    snippet: 'A new issue has been opened in your repository: "Footer does not render correctly on mobile devices".',
    body: '<p>A new issue has been opened in your repository WebApp-Project:</p><h3>#241 - Footer does not render correctly on mobile devices</h3><p>User "testuser123" reported that the footer icons overlap on screen widths below 375px.</p><p>Please investigate this issue.</p>',
    timestamp: '1d ago',
    read: true,
    starred: false,
    category: 'primary',
  },
  {
    id: '3',
    sender: { name: 'Alice Johnson', email: 'alice.j@example.com', avatar: 'A' },
    subject: 'Re: Project Alpha Meeting Minutes',
    snippet: 'Thanks for sending these over! I have a few comments on the action items for the marketing team.',
    body: '<p>Hi Hung,</p><p>Thanks for sending these over! I have a few comments on the action items for the marketing team. I\'ll add them to the shared document directly.</p><p>Regards,<br>Alice</p>',
    timestamp: '2d ago',
    read: true,
    starred: true,
    category: 'primary',
  },
  {
    id: '4',
    sender: { name: 'Google Cloud', email: 'alerts@google.com', avatar: 'G' },
    subject: 'Security Alert: New sign-in to your account',
    snippet: 'We noticed a new sign-in to your Google Account on a Windows device. If this was you, you don\'t need to do anything.',
    body: '<h2>Security Alert</h2><p>We noticed a new sign-in to your Google Account on a Windows device. If this was you, you don\'t need to do anything. If not, please secure your account immediately.</p>',
    timestamp: '3d ago',
    read: true,
    starred: false,
    category: 'social',
  },
  {
    id: '5',
    sender: { name: 'Lazada', email: 'noreply@lazada.vn', avatar: 'L' },
    subject: '🎉 Flash Sale 9.9 sắp bắt đầu!',
    snippet: 'Đừng bỏ lỡ hàng ngàn deal sốc giá chỉ từ 1K. Săn sale ngay!',
    body: '<h2>Flash Sale 9.9!</h2><p>Hàng ngàn deal sốc đang chờ bạn. Mua sắm ngay!</p>',
    timestamp: '4d ago',
    read: true,
    starred: false,
    category: 'promotions',
  }
];

const newSyncedEmails: Email[] = [
  {
    id: 'sync-1',
    sender: { name: 'Slack', email: 'feedback@slack.com', avatar: 'S' },
    subject: 'Your productivity stats for last week',
    snippet: 'Hey Hung, you sent 58 messages and received 120 reactions. Keep up the great work in the #general channel!',
    body: '<h2>Your weekly Slack summary is here!</h2><p>Great job last week. You were most active in the #general and #project-alpha channels.</p>',
    timestamp: '5m ago',
    read: false,
    starred: false,
    category: 'primary',
  },
  {
    id: 'sync-2',
    sender: { name: 'Coursera', email: 'no-reply@coursera.org', avatar: 'C' },
    subject: 'New course recommendation: Advanced React',
    snippet: 'Based on your profile, we think you\'ll love our new course on advanced React patterns and performance.',
    body: '<h3>Discover Advanced React</h3><p>Take your skills to the next level with our latest course taught by industry experts.</p>',
    timestamp: '15m ago',
    read: false,
    starred: false,
    category: 'promotions',
  },
];

interface EmailClientProps {
  user: User;
  onItemViewed: (item: RecentItem) => void;
}

const EmailClient: React.FC<EmailClientProps> = ({ user, onItemViewed }) => {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'primary' | 'promotions' | 'social' | 'starred'>('primary');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(true);
  const { t } = useLanguage();

  const zimbraEmail = localStorage.getItem('zimbra_email');

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e));
    onItemViewed({
        id: `email-${email.id}`,
        name: email.subject,
        type: 'email',
        icon: <MailIcon />,
        itemId: email.id
    });
  };

  const getSenderInitial = (name: string) => name.charAt(0).toUpperCase();
  
  const handleToggleStar = (emailId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent email selection when starring
      setEmails(emails.map(e => e.id === emailId ? { ...e, starred: !e.starred } : e));
  };
  
  const handleToggleEmailSelection = (emailId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSelected = new Set(selectedEmailIds);
      if (newSelected.has(emailId)) {
          newSelected.delete(emailId);
      } else {
          newSelected.add(emailId);
      }
      setSelectedEmailIds(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedEmailIds(new Set(filteredEmails.map(e => e.id)));
      } else {
          setSelectedEmailIds(new Set());
      }
  };

  const handleBulkMarkAsRead = () => {
      setEmails(emails.map(e => selectedEmailIds.has(e.id) ? { ...e, read: true } : e));
      setSelectedEmailIds(new Set());
  };

  const handleBulkStar = () => {
      setEmails(emails.map(e => selectedEmailIds.has(e.id) ? { ...e, starred: true } : e));
      setSelectedEmailIds(new Set());
  };

  const handleBulkDelete = () => {
      setEmails(emails.filter(e => !selectedEmailIds.has(e.id)));
      setSelectedEmailIds(new Set());
      if (selectedEmail && selectedEmailIds.has(selectedEmail.id)) {
          setSelectedEmail(null);
      }
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(t('syncing'));
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    setEmails(prevEmails => {
        const existingIds = new Set(prevEmails.map(e => e.id));
        const uniqueNewEmails = newSyncedEmails.filter(e => !existingIds.has(e.id));
        return [...uniqueNewEmails, ...prevEmails];
    });

    setIsSyncing(false);
    setSyncMessage(t('syncSuccess'));
    setTimeout(() => setSyncMessage(''), 3000);
  };

  const categories: { id: typeof activeCategory, name: string, icon: React.ReactNode }[] = [
    { id: 'primary', name: t('primary'), icon: <MailIcon className="w-5 h-5"/> },
    { id: 'promotions', name: t('promotions'), icon: <TagIcon className="w-5 h-5"/> },
    { id: 'social', name: t('social'), icon: <UsersIcon className="w-5 h-5"/> },
    { id: 'starred', name: t('starred'), icon: <StarIcon className="w-5 h-5"/> },
  ];

  const filteredEmails = useMemo(() => {
    let sorted = [...emails].sort((a, b) => (a.read ? 1 : -1) - (b.read ? 1 : -1));
    if (activeCategory === 'starred') {
        sorted = sorted.filter(e => e.starred);
    } else {
        sorted = sorted.filter(e => e.category === activeCategory);
    }
    
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        sorted = sorted.filter(e => 
            e.subject.toLowerCase().includes(lowerQ) || 
            e.sender.name.toLowerCase().includes(lowerQ) || 
            e.body.toLowerCase().includes(lowerQ) ||
            e.sender.email.toLowerCase().includes(lowerQ)
        );
    }
    return sorted;
  }, [emails, activeCategory, searchQuery]);

  const unreadCounts = useMemo(() => {
    return {
      primary: emails.filter(e => e.category === 'primary' && !e.read).length,
      promotions: emails.filter(e => e.category === 'promotions' && !e.read).length,
      social: emails.filter(e => e.category === 'social' && !e.read).length,
    }
  }, [emails]);

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {isComposing && <ComposeModal onClose={() => setIsComposing(false)} />}
        <EmailBanner />
        <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          <div className="flex flex-1 min-h-0 relative">
            {/* List Container */}
            <div className={`flex flex-col lg:flex-row flex-1 lg:flex-none lg:w-2/3 xl:w-1/2 border-r border-white/50 ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
              {/* Categories Pane */}
              <div className={`border-b lg:border-b-0 lg:border-r border-white/50 flex flex-col transition-all duration-300 ${isMenuCollapsed ? 'w-full lg:w-20' : 'w-full lg:w-1/2 xl:w-1/3'}`}>
                <div className={`p-4 border-b border-white/50 shrink-0 flex items-center justify-between gap-2`}>
                    <button onClick={() => setIsMenuCollapsed(!isMenuCollapsed)} className={`hidden lg:flex p-2.5 rounded-lg bg-white/60 hover:bg-white text-slate-700 shadow-sm transition-all text-center justify-center`}>
                        <span className="sr-only">Toggle Menu</span>
                        <MenuIcon className="w-5 h-5"/>
                    </button>
                    {!isMenuCollapsed && (
                        <button onClick={() => setIsComposing(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/40 transition-all transform hover:scale-105">
                            <MailIcon className="w-5 h-5"/>
                            <span className="hidden xl:inline">{t('compose')}</span>
                        </button>
                    )}
                    {isMenuCollapsed && (
                        <button onClick={() => setIsComposing(true)} className="p-2.5 w-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/40 transition-all transform hover:scale-105">
                            <MailIcon className="w-5 h-5"/>
                        </button>
                    )}
                    {!isMenuCollapsed && (
                        <button onClick={handleSync} disabled={isSyncing} className="p-2.5 rounded-lg bg-white/60 hover:bg-white text-blue-700 shadow-md transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-wait">
                            <SyncIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`}/>
                        </button>
                    )}
                </div>
                {syncMessage && !isMenuCollapsed && <div className="text-center text-sm font-semibold p-2 bg-blue-100 text-blue-800">{syncMessage}</div>}
                {zimbraEmail && !isMenuCollapsed && (
                    <div className="px-4 py-2 bg-slate-50 border-b border-white/50 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Zimbra: {zimbraEmail}</span>
                    </div>
                )}
                {isMenuCollapsed && (
                    <div className="p-4 border-b border-white/50 shrink-0 hidden lg:flex justify-center">
                        <button onClick={handleSync} disabled={isSyncing} className="p-2.5 rounded-lg bg-white/60 hover:bg-white text-blue-700 shadow-md transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-wait">
                            <SyncIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`}/>
                        </button>
                    </div>
                )}
                <div className={`p-2 flex ${isMenuCollapsed ? 'flex-row lg:flex-col overflow-x-auto gap-2 no-scrollbar' : 'flex-col'}`}>
                  {categories.map(cat => {
                      const unreadCount = cat.id !== 'starred' ? unreadCounts[cat.id] : 0;
                      return (
                          <button 
                            key={cat.id} 
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center transition-colors ${isMenuCollapsed ? 'justify-center p-3 rounded-xl flex-shrink-0 relative' : 'w-full justify-between gap-3 px-3 py-2.5 rounded-lg text-left'} ${activeCategory === cat.id ? 'bg-white/80 font-bold text-cyan-800' : 'text-slate-700 hover:bg-white/50 font-medium'}`}
                            title={isMenuCollapsed ? cat.name : undefined}
                          >
                              <div className={`flex items-center ${isMenuCollapsed ? 'justify-center' : 'gap-3'}`}>
                                  {cat.icon}
                                  {!isMenuCollapsed && <span>{cat.name}</span>}
                              </div>
                              {unreadCount > 0 && (
                                  isMenuCollapsed 
                                      ? <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-cyan-500 rounded-full"></span>
                                      : <span className="text-xs font-bold bg-cyan-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
                              )}
                          </button>
                      )
                  })}
                </div>
              </div>
              {/* Email List Pane */}
              <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <div className="p-4 border-b border-white/50 shrink-0 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 capitalize">{t(activeCategory)}</h1>
                            <p className="text-sm text-slate-600">{t('unreadMessages', { count: activeCategory !== 'starred' ? unreadCounts[activeCategory] : 0 })}</p>
                        </div>
                        {filteredEmails.length > 0 && (
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800">
                                <input 
                                    type="checkbox"
                                    checked={filteredEmails.length > 0 && selectedEmailIds.size === filteredEmails.length}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                                />
                                Select All
                            </label>
                        )}
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('searchEmails') || 'Search emails...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/60 p-2 rounded-md border border-slate-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                  {selectedEmailIds.size > 0 && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50/80 rounded-lg shadow-sm border border-blue-100">
                          <span className="text-sm font-semibold text-blue-800 ml-2">{selectedEmailIds.size} selected</span>
                          <div className="ml-auto flex gap-1">
                              <button onClick={handleBulkMarkAsRead} className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded shadow-sm transition-colors border border-slate-200">
                                  Đánh dấu đã đọc
                              </button>
                              <button onClick={handleBulkStar} className="px-3 py-1.5 text-xs font-semibold text-yellow-700 bg-white hover:bg-yellow-50 rounded shadow-sm transition-colors border border-yellow-200 border-l border-r">
                                  Đánh dấu sao
                              </button>
                              <button onClick={handleBulkDelete} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 rounded shadow-sm transition-colors border border-red-200">
                                  Xóa
                              </button>
                          </div>
                      </div>
                  )}
                  {filteredEmails.map(email => (
                    <div 
                      key={email.id} 
                      onClick={() => handleSelectEmail(email)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectEmail(email);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex gap-3 items-start group cursor-pointer ${selectedEmail?.id === email.id ? 'bg-white/80' : 'hover:bg-white/50'}`}
                    >
                      <div className="flex shrink-0 items-center justify-center pt-2 px-1" onClick={(e) => e.stopPropagation()}>
                          <input 
                              type="checkbox" 
                              checked={selectedEmailIds.has(email.id)}
                              onChange={() => {
                                  // The change event handles state conceptually but practically we can use onClick wrapper
                                  // We'll leave the onChange empty just for React warning prevention
                              }}
                              onClick={(e) => handleToggleEmailSelection(email.id, e as unknown as React.MouseEvent)}
                              className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                          />
                      </div>
                      <div className={`w-10 h-10 rounded-full ${email.read ? 'bg-slate-300' : 'bg-cyan-500'} text-white flex items-center justify-center font-bold text-sm shrink-0 mt-1`}>
                        {getSenderInitial(email.sender.name)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline">
                          <p className={`truncate font-semibold ${email.read ? 'text-slate-700' : 'text-slate-900'}`}>{email.sender.name}</p>
                          <p className={`text-xs shrink-0 ${email.read ? 'text-slate-500' : 'text-cyan-600 font-medium'}`}>{email.timestamp}</p>
                        </div>
                        <p className={`truncate text-sm font-medium ${email.read ? 'text-slate-600' : 'text-slate-800'}`}>{email.subject}</p>
                        <p className="truncate text-xs text-slate-500">{email.snippet}</p>
                      </div>
                      <button onClick={(e) => handleToggleStar(email.id, e)} className={`p-1 rounded-full transition-colors ${email.starred ? 'text-yellow-500' : 'text-slate-400 group-hover:text-yellow-400'}`}>
                          <StarIcon className={`w-5 h-5 ${email.starred ? 'fill-current' : ''}`}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Email View Pane */}
            {selectedEmail && (
            <div className="absolute lg:relative inset-0 lg:inset-auto flex flex-1 flex-col min-w-0 bg-white/40 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none">
                <div className="p-4 border-b border-white/50 shrink-0">
                    <button onClick={() => setSelectedEmail(null)} className="lg:hidden flex items-center gap-2 p-2 -ml-2 mb-2 rounded-lg hover:bg-white/50 text-slate-700 font-semibold">
                      <ChevronLeftIcon className="w-5 h-5" />
                      Hộp thư đến
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 truncate flex items-center gap-3">
                      {selectedEmail.subject}
                      <button onClick={(e) => handleToggleStar(selectedEmail.id, e)} className={`p-1 rounded-full transition-colors ${selectedEmail.starred ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-400'}`}>
                        <StarIcon className={`w-6 h-6 ${selectedEmail.starred ? 'fill-current' : ''}`}/>
                      </button>
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {getSenderInitial(selectedEmail.sender.name)}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{selectedEmail.sender.name}</p>
                            <p className="text-sm text-slate-600">to {user.name} &lt;{user.email}&gt;</p>
                        </div>
                        <div className="ml-auto items-center gap-1 hidden md:flex">
                            <button className="p-2 rounded-lg hover:bg-white/60 text-slate-600 transition-colors" title="Reply"><ReplyIcon className="w-5 h-5"/></button>
                            <button className="p-2 rounded-lg hover:bg-white/60 text-slate-600 transition-colors" title="Forward"><ForwardIcon className="w-5 h-5"/></button>
                            <button className="p-2 rounded-lg hover:bg-white/60 text-slate-600 hover:text-red-500 transition-colors" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                            <div className="w-px h-6 bg-slate-300/80 mx-2"></div>
                            <button className="flex items-center gap-2 py-2 px-3 bg-white/60 hover:bg-white/80 rounded-lg text-sm font-semibold text-slate-700 transition-colors" title="Link to Project">
                                <LinkIcon className="w-4 h-4 text-cyan-600"/> 
                                <span>{t('linkToProject')}</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                  <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: selectedEmail.body }}></div>
                </div>
            </div>
            )}
            
            {!selectedEmail && (
               <div className="flex-1 hidden lg:flex items-center justify-center text-slate-500">
                  <p>{t('selectEmailToRead')}</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default EmailClient;