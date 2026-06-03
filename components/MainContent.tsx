import React, { useState, useEffect, useMemo } from 'react';
import Banner from './Banner';
import { User, RecentItem, View, CheckInEntry, ActivityItem } from '../App';
import { useLanguage } from './LanguageContext';
import { CalendarEvent } from './CalendarView';
import { mockTaskLists } from './TasklistView';
import { mockNotes } from './NotesView';
import { initialFileSystem } from './DriveView';
import { mockEmails } from './EmailClient';
import { initialMeetings } from './MeetingView';
import { mockClasses } from './TrainingDashboardView';
import { SettingsIcon, XIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, FileTextIcon, GripVerticalIcon, RssIcon, FolderIcon, ChecklistIcon, CalendarIcon, StickyNoteIcon, BookOpenIcon, GraduationCapIcon, MailIcon, ChatIcon } from './icons';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Post } from './NewsfeedView';

// --- WIDGET COMPONENTS ---

const WidgetCard: React.FC<{ title: string; icon?: React.ReactNode; onNavigate?: () => void; children: React.ReactNode; className?: string }> = ({ title, icon, onNavigate, children, className = '' }) => {
    const { t } = useLanguage();
    return (
        <div className={`p-4 bg-[--color-surface-secondary] rounded-xl ring-1 ring-[--color-border-primary] shadow-md flex flex-col animate-fade-in-up break-inside-avoid ${className}`}>
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-bold text-[--color-text-primary] text-lg">{title}</h3>
                </div>
                {onNavigate && (
                    <button onClick={onNavigate} className="text-sm font-semibold text-[--color-accent-600] hover:underline flex items-center gap-1">
                        {t('viewAll')} <ChevronRightIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    );
};

// --- DATA PREVIEW WIDGETS ---

const LatestNewsfeedWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [latestPost, setLatestPost] = useState<Post | null>(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        const fetchLatestPost = async () => {
            try {
                const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(5));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const pinnedPosts = snapshot.docs.filter(d => d.data().isPinned);
                    const postToDisplay = pinnedPosts.length > 0 ? pinnedPosts[0] : snapshot.docs[0];
                    const data = postToDisplay.data();
                    setLatestPost({ id: postToDisplay.id, ...data } as Post);
                } else {
                    setLatestPost(null);
                }
            } catch (err) {
                console.error("Error fetching latest post:", err);
            }
        };
        fetchLatestPost();
    }, []);

    return (
        <WidgetCard title={t('newsfeed')} icon={<RssIcon className="w-5 h-5 text-orange-500" />} onNavigate={onNavigate}>
            {latestPost ? (
                <div className="p-2 bg-[--color-surface-primary] rounded-md space-y-1">
                    <p className="text-xs font-bold text-[--color-text-subtle]">{latestPost.author?.name || 'Đồng nghiệp'}</p>
                    <p className="font-semibold text-sm text-[--color-text-secondary] line-clamp-2">{latestPost.content?.substring(0, 100)}...</p>
                </div>
            ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">Không có bài đăng nào.</p>}
        </WidgetCard>
    );
};



const RecentFilesWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const recentFiles = useMemo(() => initialFileSystem.filter(f => f.type !== 'folder').slice(0, 4), []);
    return (
        <WidgetCard title={t('drive')} icon={<FolderIcon className="w-5 h-5 text-yellow-500" />} onNavigate={onNavigate}>
            <div className="space-y-2">
                {recentFiles.map(file => (
                    <div key={file.id} className="flex items-center gap-3 p-2 bg-[--color-surface-primary] rounded-md">
                        <FileTextIcon className="w-5 h-5 text-[--color-accent-600] shrink-0" />
                        <p className="text-sm text-[--color-text-secondary] font-medium truncate">{file.name}</p>
                    </div>
                ))}
            </div>
        </WidgetCard>
    );
};

const TaskSummaryWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const pendingTasks = useMemo(() => mockTaskLists.flatMap(list => list.tasks.filter(t => !t.completed)).slice(0, 5), []);
    return (
        <WidgetCard title={t('tasklist')} icon={<ChecklistIcon className="w-5 h-5 text-green-500" />} onNavigate={onNavigate}>
            {pendingTasks.length > 0 ? (
                <div className="space-y-2">
                    {pendingTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 p-2 bg-[--color-surface-primary] rounded-md">
                            <input type="checkbox" className="w-4 h-4 rounded text-[--color-accent-600] focus:ring-[--color-accent-500] shrink-0" />
                            <p className="text-sm text-[--color-text-secondary] flex-1 truncate">{task.text}</p>
                        </div>
                    ))}
                </div>
             ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">{t('noPendingTasks')}</p>}
        </WidgetCard>
    );
};

const EventsAndMeetingsWidget: React.FC<{ events: CalendarEvent[], onNavigate: () => void }> = ({ events, onNavigate }) => {
    const { t, language } = useLanguage();
    const upcoming = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = events.filter(e => e.date >= today).sort((a, b) => a.date.getTime() - b.date.getTime());
        const upcomingMeetings = initialMeetings.filter(m => m.status === 'Sắp diễn ra' && m.date >= today).sort((a,b) => a.date.getTime() - b.date.getTime());
        // Simple merge and slice for demo
        return [...upcomingEvents, ...upcomingMeetings].slice(0, 4);
    }, [events]);

    return (
        <WidgetCard title={t('calendar')} icon={<CalendarIcon className="w-5 h-5 text-red-500" />} onNavigate={onNavigate}>
            {upcoming.length > 0 ? (
                <div className="space-y-2">
                    {upcoming.map((item, index) => (
                        <div key={index} className="p-2 bg-[--color-surface-primary] rounded-md flex items-start gap-3">
                             <div className={`mt-1.5 w-2 h-2 rounded-full ${(item as CalendarEvent).color ? `bg-${(item as CalendarEvent).color}-500` : 'bg-purple-500'} shrink-0`}></div>
                             <div>
                                <p className="font-semibold text-sm text-[--color-text-secondary]">{item.title}</p>
                                <p className="text-xs text-[--color-text-subtle]">
                                    {item.date.toLocaleDateString(language, { month: 'short', day: 'numeric'})} &bull; {item.startTime}
                                </p>
                             </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">{t('noUpcomingEvents')}</p>}
        </WidgetCard>
    );
};

const RecentNotesWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const recentNotes = useMemo(() => mockNotes.slice(0, 4), []);
    return (
        <WidgetCard title={t('notes')} icon={<StickyNoteIcon className="w-5 h-5 text-amber-500" />} onNavigate={onNavigate}>
            {recentNotes.length > 0 ? (
                 <div className="space-y-2">
                    {recentNotes.map(note => (
                        <div key={note.id} className="p-2 bg-[--color-surface-primary] rounded-md">
                            <p className="font-semibold text-sm text-[--color-text-secondary] truncate">{note.title || note.content?.split('\n')[0]}</p>
                        </div>
                    ))}
                 </div>
            ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">{t('noRecentNotes')}</p>}
        </WidgetCard>
    );
};

const LatestArticleWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [latestArticle, setLatestArticle] = useState<{ title: string; authorName: string } | null>(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        const fetchLatestArticle = async () => {
            try {
                const q = query(collection(db, 'blogArticles'), orderBy('createdAt', 'desc'), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    setLatestArticle({ title: data.title, authorName: data.authorName });
                } else {
                    setLatestArticle(null);
                }
            } catch (err) {
                console.error("Error fetching latest article:", err);
            }
        };
        fetchLatestArticle();
    }, []);

     return (
        <WidgetCard title={t('blog')} icon={<BookOpenIcon className="w-5 h-5 text-emerald-500" />} onNavigate={onNavigate}>
            {latestArticle ? (
                 <div className="p-2 bg-[--color-surface-primary] rounded-md space-y-1">
                    <p className="font-bold text-sm text-[--color-text-primary] truncate">{latestArticle.title}</p>
                    <p className="text-xs text-[--color-text-subtle]">By {latestArticle.authorName}</p>
                </div>
            ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">Không có bài viết nào.</p>}
        </WidgetCard>
    );
};

const UpcomingClassWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const upcomingClass = mockClasses[0]; // Simple logic for demo
    return (
         <WidgetCard title={t('training')} icon={<GraduationCapIcon className="w-5 h-5 text-violet-500" />} onNavigate={onNavigate}>
            {upcomingClass ? (
                 <div className="p-2 bg-[--color-surface-primary] rounded-md space-y-1">
                    <p className="font-bold text-sm text-[--color-text-primary] truncate">{upcomingClass.name}</p>
                    <p className="text-xs text-[--color-text-subtle]">GV: {upcomingClass.teacher}</p>
                </div>
            ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">Không có lớp học nào.</p>}
        </WidgetCard>
    );
};

const UnreadEmailsWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const unread = useMemo(() => mockEmails.filter(e => !e.read).slice(0, 4), []);
    return (
        <WidgetCard title={t('email')} icon={<MailIcon className="w-5 h-5 text-orange-600" />} onNavigate={onNavigate}>
            {unread.length > 0 ? (
                <div className="space-y-2">
                    {unread.map(email => (
                        <div key={email.id} className="p-2 bg-[--color-surface-primary] rounded-md">
                            <p className="font-semibold text-sm text-[--color-text-secondary] truncate">{email.subject}</p>
                            <p className="text-xs text-[--color-text-subtle] truncate">From: {email.sender.name}</p>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">Không có email mới.</p>}
        </WidgetCard>
    );
};

const UnreadChatWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const mockChannels = [ // This is duplicated from ChatView, should be in a shared location.
        { id: 'c1', name: 'general', type: 'channel', unreadCount: 3 },
        { id: 'c3', name: 'project-alpha', type: 'channel', unreadCount: 1 },
        { id: 'd2', name: 'Bob Williams', type: 'dm', avatar: 'B', online: false, unreadCount: 2 },
    ];
    const unread = mockChannels.filter(c => c.unreadCount && c.unreadCount > 0);
    return (
        <WidgetCard title={t('chat')} icon={<ChatIcon className="w-5 h-5 text-blue-400" />} onNavigate={onNavigate}>
            {unread.length > 0 ? (
                <div className="space-y-2">
                    {unread.map(channel => (
                        <div key={channel.id} className="flex justify-between items-center p-2 bg-[--color-surface-primary] rounded-md">
                            <p className="font-semibold text-sm text-[--color-text-secondary] truncate">{channel.name}</p>
                            <span className="text-xs font-bold bg-cyan-500 text-white px-2 py-0.5 rounded-full">{channel.unreadCount}</span>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-center text-[--color-text-subtle] mt-8">Không có tin nhắn mới.</p>}
        </WidgetCard>
    );
}

// --- MAIN COMPONENT ---
interface MainContentProps {
  user: User;
  recentlyViewed: RecentItem[];
  events: CalendarEvent[];
  onNavigate: (view: View, itemId?: string) => void;
  checkInLog: CheckInEntry[];
  activityLog: ActivityItem[];
}

interface WidgetConfig {
    id: string;
    name: string;
    description: string;
    component: React.ComponentType<{ onNavigate: () => void; events?: CalendarEvent[] }>;
    defaultVisible: boolean;
    props?: { onNavigate: () => void; events?: CalendarEvent[] };
}

interface WidgetSettings {
  id: string;
  visible: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MainContent: React.FC<MainContentProps> = ({ user, recentlyViewed, events, onNavigate, checkInLog, activityLog }) => {
  const { t } = useLanguage();
  
  const ALL_WIDGETS: WidgetConfig[] = useMemo(() => [
      { id: 'widget_newsfeed', name: t('newsfeed'), description: t('widget_newsfeed_desc'), component: LatestNewsfeedWidget, defaultVisible: true, props: { onNavigate: () => onNavigate('newsfeed') } },
      { id: 'widget_drive', name: t('drive'), description: t('widget_drive_desc'), component: RecentFilesWidget, defaultVisible: true, props: { onNavigate: () => onNavigate('drive') } },
      { id: 'widget_tasks', name: t('tasklist'), description: t('widget_tasks_link_desc'), component: TaskSummaryWidget, defaultVisible: true, props: { onNavigate: () => onNavigate('tasks') } },
      { id: 'widget_calendar', name: t('calendar'), description: t('widget_calendar_link_desc'), component: EventsAndMeetingsWidget, defaultVisible: true, props: { events: events, onNavigate: () => onNavigate('calendar') } },
      { id: 'widget_notes', name: t('notes'), description: t('widget_notes_link_desc'), component: RecentNotesWidget, defaultVisible: true, props: { onNavigate: () => onNavigate('notes') } },
      { id: 'widget_blog', name: t('blog'), description: t('widget_blog_desc'), component: LatestArticleWidget, defaultVisible: true, props: { onNavigate: () => onNavigate('blog') } },
      { id: 'widget_training', name: t('training'), description: t('widget_training_desc'), component: UpcomingClassWidget, defaultVisible: false, props: { onNavigate: () => onNavigate('training') } },
      { id: 'widget_email', name: t('email'), description: t('widget_email_desc'), component: UnreadEmailsWidget, defaultVisible: true, props: { onNavigate: () => onNavigate('email') } },
      { id: 'widget_chat', name: t('chat'), description: t('widget_chat_desc'), component: UnreadChatWidget, defaultVisible: true, props: { onNavigate: () => onNavigate('chat') } },
  ], [t, events, onNavigate]);

  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings[]>([]);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  
  useEffect(() => {
    try {
      const savedSettingsJSON = localStorage.getItem('dashboardWidgetSettings');
      let finalSettings: WidgetSettings[];
      const allWidgetConfigs = new Map(ALL_WIDGETS.map(w => [w.id, w]));

      if (savedSettingsJSON) {
        const savedSettings: WidgetSettings[] = JSON.parse(savedSettingsJSON);
        
        // Keep order and settings from saved config, but only for widgets that still exist
        finalSettings = savedSettings.filter(s => allWidgetConfigs.has(s.id));
        const finalSettingsIds = new Set(finalSettings.map(s => s.id));

        // Add any new widgets that are not in the saved config to the end
        const newWidgets = ALL_WIDGETS
          .filter(w => !finalSettingsIds.has(w.id))
          .map(w => ({ id: w.id, visible: w.defaultVisible }));
        
        finalSettings.push(...newWidgets);

      } else {
        // Fallback for migration from old format
        const savedOldConfigJSON = localStorage.getItem('dashboardWidgetConfig');
        if (savedOldConfigJSON) {
            const oldConfig = JSON.parse(savedOldConfigJSON);
            finalSettings = ALL_WIDGETS.map(w => ({
                id: w.id,
                visible: oldConfig[w.id] ?? w.defaultVisible,
            }));
        } else {
            // No settings found at all, use defaults
            finalSettings = ALL_WIDGETS.map(w => ({
                id: w.id,
                visible: w.defaultVisible,
            }));
        }
      }
      setWidgetSettings(finalSettings);
    } catch (error) {
      console.error("Failed to initialize widget settings:", error);
      const defaultSettings = ALL_WIDGETS.map(w => ({
        id: w.id,
        visible: w.defaultVisible,
      }));
      setWidgetSettings(defaultSettings);
    }
}, [ALL_WIDGETS]);


  const handleSettingsChange = (newSettings: WidgetSettings[]) => {
      setWidgetSettings(newSettings);
      localStorage.setItem('dashboardWidgetSettings', JSON.stringify(newSettings));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSettings = [...widgetSettings];
    const temp = newSettings[index];
    newSettings[index] = newSettings[index - 1];
    newSettings[index - 1] = temp;
    handleSettingsChange(newSettings);
  };

  const moveDown = (index: number) => {
    if (index === widgetSettings.length - 1) return;
    const newSettings = [...widgetSettings];
    const temp = newSettings[index];
    newSettings[index] = newSettings[index + 1];
    newSettings[index + 1] = temp;
    handleSettingsChange(newSettings);
  };

  const handleToggleVisibility = (id: string) => {
    const newSettings = widgetSettings.map(s => 
        s.id === id ? { ...s, visible: !s.visible } : s
    );
    handleSettingsChange(newSettings);
  };
  
  const orderedVisibleWidgets = useMemo(() => {
    return widgetSettings
        .filter(s => s.visible)
        .map(s => ALL_WIDGETS.find(w => w.id === s.id))
        .filter((w): w is WidgetConfig => w !== undefined);
  }, [widgetSettings, ALL_WIDGETS]);

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[5px] pb-24 md:pb-8">
        {isCustomizeModalOpen && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center p-4" aria-modal="true">
                <div className="absolute inset-0" onClick={() => setIsCustomizeModalOpen(false)}></div>
                <div className="relative w-full max-w-lg bg-[--color-surface-tertiary] rounded-xl shadow-2xl animate-fade-in-up">
                    <header className="p-4 border-b border-[--color-border-secondary] flex justify-between items-center">
                        <h2 className="text-lg font-bold text-[--color-text-primary]">{t('customizeDashboard')}</h2>
                        <button onClick={() => setIsCustomizeModalOpen(false)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary]"><XIcon className="w-5 h-5"/></button>
                    </header>
                    <div className="p-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                        <p className="text-sm text-[--color-text-secondary] mb-4">Bạn có thể bật/tắt và kéo thả để sắp xếp lại các tiện ích trên trang tổng quan.</p>
                        <Reorder.Group axis="y" values={widgetSettings} onReorder={handleSettingsChange} className="space-y-1">
                            {widgetSettings.map((setting, index) => {
                                const widget = ALL_WIDGETS.find(w => w.id === setting.id);
                                if (!widget) return null;
                                return (
                                    <Reorder.Item
                                        key={setting.id}
                                        value={setting}
                                        className="flex items-center justify-between p-3 rounded-lg cursor-grab hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-[--color-surface-tertiary] border border-transparent active:border-[--color-accent-400] active:shadow-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <GripVerticalIcon className="w-5 h-5 text-[--color-text-subtle] cursor-grab shrink-0"/>
                                            <div>
                                                <span className="font-medium text-md text-[--color-text-primary]">{widget.name}</span>
                                                <p className="text-xs text-[--color-text-subtle]">{widget.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); moveUp(index); }} disabled={index === 0} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary] disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <ChevronUpIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); moveDown(index); }} disabled={index === widgetSettings.length - 1} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary] disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <ChevronDownIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="relative" onClick={(e) => { e.stopPropagation(); handleToggleVisibility(setting.id); }}>
                                                <input type="checkbox" className="sr-only" checked={setting.visible} readOnly />
                                                <div className={`block w-10 h-5 rounded-full transition-colors cursor-pointer ${setting.visible ? 'bg-[--color-accent-500]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                                <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform cursor-pointer ${setting.visible ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    </div>
                </div>
            </div>
        )}
        <div className="overflow-y-auto no-scrollbar flex-1 flex flex-col gap-[5px]">
            <div className="p-[5px] space-y-4">
              <Banner userName={user.name} />
              
              {/* AI Support Chat Section */}
              <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/50 animate-fade-in">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">AI</div>
                      <h3 className="font-bold text-[--color-text-primary]">Trợ lý hỗ trợ AI</h3>
                  </div>
                  <div className="flex gap-2">
                       <input 
                          type="text" 
                          placeholder="Bạn cần hỗ trợ gì hôm nay?" 
                          className="flex-1 bg-white/70 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none rounded-xl px-4 py-2 text-sm"
                       />
                       <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all shadow-md active:scale-95">
                           <ChatIcon className="w-5 h-5"/>
                       </button>
                  </div>
                  <p className="text-[10px] text-[--color-text-subtle] mt-2 italic px-1">AI có thể trả lời các câu hỏi về quy trình, hỗ trợ kỹ thuật và quản lý công việc.</p>
              </div>

            </div>
            <div className="px-[5px] pb-3">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[--color-text-primary]">{t('dashboard')}</h2>
                    <button onClick={() => setIsCustomizeModalOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-[--color-text-secondary] hover:text-[--color-accent-600] p-2 rounded-lg transition-colors">
                        <SettingsIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">{t('customizeDashboard')}</span>
                    </button>
                </div>
                <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  <AnimatePresence mode="popLayout">
                    {orderedVisibleWidgets.map(widget => {
                      const WidgetComponent = widget.component;
                      return (
                        <motion.div
                          key={widget.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        >
                            <WidgetComponent {...widget.props} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
            </div>
        </div>
    </main>
  );
};

export default MainContent;