import React, { useState } from 'react';
import TopSidebar from './components/TopSidebar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import MainContent from './components/MainContent';
import Auth from './components/Auth';
import EmailClient from './components/EmailClient';
import CalendarView, { CalendarEvent } from './components/CalendarView';
import ChatView from './components/ChatView';
import NotesView from './components/NotesView';
import TasklistView from './components/TasklistView';
import ContactsView from './components/ContactsView';
import MeetingView from './components/MeetingView';
import DriveView from './components/DriveView';
import BlogView from './components/BlogView';
import NewsfeedView from './components/NewsfeedView';
import AiChatWidget from './components/AiChatWidget';
import { LanguageProvider } from './components/LanguageContext';
import NewBlogPostView from './components/NewBlogPostView';
import BlogArticleView from './components/BlogArticleView';
import TaskView from './components/TaskView';
import TrainingDashboardView from './components/TrainingDashboardView';
import ClassDetailView from './components/ClassDetailView';
import SettingsView from './components/SettingsView';
import CheckInView from './components/CheckInView';
import UserManagementView from './components/UserManagementView';
import RequestsView from './components/RequestsView';
import WebsiteDataView from './components/WebsiteDataView';
import ProjectManagementView from './components/ProjectManagementView';
import { FolderIcon, StickyNoteIcon, ChecklistIcon, MailIcon, CalendarIcon, GraduationCapIcon, BloggerIcon, ChatIcon, VideoIcon, IconProps } from './components/icons';
import EventModal from './components/EventModal';
import MobileBottomNav from './components/MobileBottomNav';
import { getAccessToken } from './googleTasks';
import { db, auth } from './firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import NotificationToast from './components/NotificationToast';
import { handleFirestoreError, OperationType } from './firebase-errors';


export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  type: 'system' | 'mention' | 'task';
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'member';
  avatar?: string;
  phoneNumber?: string;
  isGoogleLinked?: boolean;
  googleEmail?: string;
}

export type View = 'dashboard' | 'drive' | 'meeting' | 'tasklist' | 'contacts' | 'calendar' | 'notes' | 'blog' | 'blog-article' | 'email' | 'chat' | 'newsfeed' | 'tasks' | 'new-blog-post' | 'training' | 'class-detail' | 'settings' | 'check-in' | 'user-management' | 'requests' | 'website-data' | 'projects' | 'team-chat';

export type ServiceName = 'Drive' | 'Keep' | 'Tasks' | 'Gmail' | 'Calendar' | 'Classroom' | 'Blogger' | 'Chat' | 'Meet';

export interface ServiceState {
  id: ServiceName;
  name: string;
  icon: React.ReactElement<IconProps>;
  isConnected: boolean;
  isSyncEnabled: boolean;
}

export interface CheckInEntry {
  id: number;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLocation: string;
  checkOutLocation?: string;
}

export interface RecentItem {
  id: string;
  name: string;
  type: View;
  icon: React.ReactElement<IconProps>;
  itemId?: string;
}

export interface ActivityItem {
  id: string;
  user: { name: string; avatar: string; };
  action: 'login' | 'file_edit' | 'task_complete' | 'meeting_scheduled' | 'comment_added';
  target: string;
  timestamp: string;
}


const mockUsers: User[] = [
    { id: 'user-1', name: 'Hung Thai', email: 'hungthai84@gmail.com', role: 'superadmin', avatar: 'https://i.pravatar.cc/150?u=8', phoneNumber: '0901234567' },
    { id: 'user-admin', name: 'Trí Nhân', email: 'trinhan.virtual@gmail.com', role: 'superadmin', avatar: 'https://i.pravatar.cc/150?u=10' },
    { id: 'user-2', name: 'Lê Thị Bình', email: 'binh.le@company.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=2', phoneNumber: '0912345678' },
    { id: 'user-3', name: 'Phạm Minh Cường', email: 'cuong.pham@company.com', role: 'member', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 'user-4', name: 'Vũ Thị Dung', email: 'dung.vu@company.com', role: 'member', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 'user-5', name: 'Hoàng Văn Em', email: 'em.hoang@company.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: 'user-an', name: 'Trần Văn An', email: 'an.tran@company.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=1' },
];

const mockActivityLog: ActivityItem[] = [
    { id: 'act-1', user: { name: 'Vũ Thị Dung', avatar: 'https://i.pravatar.cc/150?u=4' }, action: 'task_complete', target: 'Test A/B trang giá', timestamp: '5m ago' },
    { id: 'act-2', user: { name: 'Phạm Minh Cường', avatar: 'https://i.pravatar.cc/150?u=3' }, action: 'file_edit', target: 'Báo cáo tiến độ.pdf', timestamp: '25m ago' },
    { id: 'act-3', user: { name: 'Lê Thị Bình', avatar: 'https://i.pravatar.cc/150?u=2' }, action: 'comment_added', target: 'Ý tưởng chiến dịch CSKH 2025', timestamp: '1h ago' },
    { id: 'act-4', user: { name: 'Hoàng Văn Em', avatar: 'https://i.pravatar.cc/150?u=5' }, action: 'meeting_scheduled', target: 'Demo sản phẩm cho Đối tác Acme Inc.', timestamp: '3h ago' },
    { id: 'act-5', user: { name: 'Trần Văn An', avatar: 'https://i.pravatar.cc/150?u=1' }, action: 'login', target: 'system', timestamp: '8h ago' },
    { id: 'act-6', user: { name: 'Vũ Thị Dung', avatar: 'https://i.pravatar.cc/150?u=4' }, action: 'file_edit', target: 'Wireframes.png', timestamp: '1d ago' },
];


const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);

  // Listen for all users
  React.useEffect(() => {
    if (!user || user.id.startsWith('user-') || !auth.currentUser) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      if (usersFromDb.length > 0) {
        setAllUsers(prev => {
            // Merge mock users with real users, preferring real users
            const merged = [...prev];
            usersFromDb.forEach(dbUser => {
                const idx = merged.findIndex(u => u.id === dbUser.id || u.email.toLowerCase() === dbUser.email.toLowerCase());
                if (idx !== -1) {
                    merged[idx] = dbUser;
                } else {
                    merged.push(dbUser);
                }
            });
            return merged;
        });
      }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, [user]);

  const [isLeftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
  
  // Auth listener
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Try to find the user in local list first
        const found = allUsers.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
        if (found) {
          setUser({ ...found, id: firebaseUser.uid }); // Ensure UID matches Firebase
        } else {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: 'member',
            avatar: firebaseUser.photoURL || undefined
          });
        }
      } else {
        // Handled by manual logout or initial load
      }
    });
    return () => unsubscribe();
  }, [allUsers]);
  const [isRightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeSettingsSection, setActiveSettingsSection] = useState<string | null>(null);
  const [isAiWidgetOpen, setAiWidgetOpen] = useState(false);
  const [activeTaskListId, setActiveTaskListId] = useState<string | undefined>(undefined);
  const [checkInLog, setCheckInLog] = useState<CheckInEntry[]>([]);
  const [activityLog] = useState<ActivityItem[]>(mockActivityLog);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  
  React.useEffect(() => {
    if (!user) return;

    if (user.id.startsWith('user-') || !user.id || !auth.currentUser) {
       // Using mock user, don't execute Firestore query to avoid permissions error
       return;
    }
    
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as AppNotification));
      setNotifications(allNotifs);

      if (!isInitialLoad) {
        const newToasts: AppNotification[] = [];
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data() as AppNotification;
                newToasts.push({ ...data, id: change.doc.id });
            }
        });
        if (newToasts.length > 0) {
            setActiveToasts(prev => [...prev, ...newToasts]);
        }
      }
      isInitialLoad = false;
    }, (error) => {
       handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  const handleCloseToast = (id: string) => {
      setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = async (notif: AppNotification) => {
      handleCloseToast(notif.id);
      if (!notif.read) {
          if (user?.id === 'user-1' || notif.id.startsWith('demo-')) {
             setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
          } else {
              try {
                  await updateDoc(doc(db, 'notifications', notif.id), { read: true });
              } catch(e) {
                  console.error(e);
              }
          }
      }
      if (notif.link) {
          // Parse link and navigate
          // e.g., 'tasks', 'projects', etc.
          setActiveView(notif.link as View);
      }
  };

  // Mobile state
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobileActivityOpen, setMobileActivityOpen] = useState(false);

  // Global Modal States
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultEventTitle, setDefaultEventTitle] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([]);

  const handleItemViewed = (item: RecentItem) => {
    setRecentlyViewed(prev => {
        const filtered = prev.filter(i => i.id !== item.id);
        const newRecentList = [item, ...filtered].slice(0, 5); // Limit to 5
        return newRecentList;
    });
  };


  const [services, setServices] = useState<ServiceState[]>([
      { id: 'Drive', name: 'Lưu trữ', icon: <FolderIcon />, isConnected: true, isSyncEnabled: true },
      { id: 'Calendar', name: 'Lịch Google', icon: <CalendarIcon />, isConnected: true, isSyncEnabled: true },
      { id: 'Gmail', name: 'Gmail', icon: <MailIcon />, isConnected: true, isSyncEnabled: false },
      { id: 'Keep', name: 'Ghi chú Keep', icon: <StickyNoteIcon />, isConnected: true, isSyncEnabled: true },
      { id: 'Tasks', name: 'Việc cần làm (Tasks)', icon: <ChecklistIcon />, isConnected: false, isSyncEnabled: false },
      { id: 'Classroom', name: 'Lớp học Classroom', icon: <GraduationCapIcon />, isConnected: true, isSyncEnabled: false },
      { id: 'Blogger', name: 'Blog Blogger', icon: <BloggerIcon />, isConnected: true, isSyncEnabled: true },
      { id: 'Chat', name: 'Trao đổi Chat', icon: <ChatIcon />, isConnected: true, isSyncEnabled: true },
      { id: 'Meet', name: 'Cuộc họp Meet', icon: <VideoIcon />, isConnected: true, isSyncEnabled: true },
  ]);

  const handleToggleSync = (id: ServiceName) => {
      setServices(services.map(s => s.id === id ? { ...s, isSyncEnabled: !s.isSyncEnabled } : s));
  };

  const handleToggleConnection = async (id: ServiceName) => {
      const service = services.find(s => s.id === id);
      if (!service) return;

      if (!service.isConnected) {
          // Connecting
          if (['Drive', 'Calendar', 'Gmail', 'Keep', 'Tasks', 'Classroom', 'Blogger', 'Chat', 'Meet'].includes(id)) {
              try {
                  await getAccessToken();
                  setServices(services.map(s => s.id === id ? { ...s, isConnected: true, isSyncEnabled: true } : s));
              } catch (error) {
                  console.error(`Failed to connect to ${id}:`, error);
                  alert(`Không thể kết nối với ${id}. Vui lòng thử lại.`);
              }
          } else {
              setServices(services.map(s => s.id === id ? { ...s, isConnected: true } : s));
          }
      } else {
          // Disconnecting
          setServices(services.map(s => s.id === id ? { ...s, isConnected: false, isSyncEnabled: false } : s));
      }
  };

  const getLocationName = (coords: GeolocationCoordinates): Promise<string> => {
    return new Promise(async (resolve) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        if (!response.ok) throw new Error('Failed to fetch location');
        const data = await response.json();
        resolve(data.display_name || 'Unknown location');
      } catch (error) {
        console.error('Error fetching location name:', error);
        resolve('Location unavailable');
      }
    });
  };

  const handleCheckIn = () => {
    const doCheckIn = (locationName: string) => {
      const newEntry: CheckInEntry = {
        id: Date.now(),
        checkInTime: new Date(),
        checkInLocation: locationName,
      };
      setCheckInLog(prevLog => [...prevLog, newEntry]);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationName = await getLocationName(position.coords);
          doCheckIn(locationName);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          doCheckIn("Vị trí không xác định (Lỗi đăng ký quyền)");
        }
      );
    } else {
      doCheckIn("Vị trí không xác định");
    }
  };

  const handleCheckOut = () => {
    const doCheckOut = (locationName: string) => {
      setCheckInLog(prevLog => {
        const newLog = [...prevLog];
        const lastEntry = newLog.find(entry => !entry.checkOutTime);
        if (lastEntry) {
          lastEntry.checkOutTime = new Date();
          lastEntry.checkOutLocation = locationName;
        }
        return newLog;
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationName = await getLocationName(position.coords);
          doCheckOut(locationName);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          doCheckOut("Vị trí không xác định (Lỗi đăng ký quyền)");
        }
      );
    } else {
      doCheckOut("Vị trí không xác định");
    }
  };

  const handleUsersChange = (updatedUsers: User[]) => {
    setAllUsers(updatedUsers);
    if (user) {
        const updatedCurrentUser = updatedUsers.find(u => u.id === user.id);
        if (updatedCurrentUser) {
            setUser(updatedCurrentUser);
        }
    }
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id' | 'color'> & { id?: string; color?: CalendarEvent['color'] }) => {
      if (eventData.id) {
          // Editing existing event
          setEvents(prev => prev.map(e => e.id === eventData.id ? { 
              ...e, 
              title: eventData.title,
              date: eventData.date,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              recurrence: eventData.recurrence,
              color: eventData.color || e.color
          } : e));
      } else {
          // Creating new event
          const newEvent: CalendarEvent = {
              title: eventData.title,
              date: eventData.date,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              recurrence: eventData.recurrence,
              isGoogleEvent: (eventData as { isGoogleEvent?: boolean }).isGoogleEvent,
              id: `evt-${Date.now()}`,
              color: eventData.color || 'green'
          };
          setEvents(prev => [...prev, newEvent]);
      }
      setEventModalOpen(false);
      setEditingEvent(null);
      setDefaultEventTitle(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
      setEditingEvent(event);
      setEventModalOpen(true);
  };

  const handleScheduleFromArticle = (articleTitle: string) => {
    setDefaultEventTitle(`Thảo luận bài viết: ${articleTitle}`);
    setEventModalOpen(true);
  };


  const handleLogin = (loggedInUser: User) => {
    const userFromDb = allUsers.find(u => u.email.toLowerCase() === loggedInUser.email.toLowerCase());
    if (userFromDb) {
      setUser(userFromDb);
    } else {
      setUser(loggedInUser);
    }
  };
  
  const handleLogout = () => {
    setUser(null);
    signOut(auth).catch((err) => console.error("Sign out error:", err));
    setActiveView('dashboard');
  }

  const handleNavigate = (view: View, section?: string) => {
    setActiveView(view);
    if (view === 'settings' && section) {
      setActiveSettingsSection(section);
    } else {
      setActiveSettingsSection(null);
    }

    if (view === 'class-detail' && section) {
      setActiveClassId(section);
    }

    if (view === 'blog-article' && section) {
      setActiveArticleId(section);
    }
    
    if (view !== 'tasklist') {
        setActiveTaskListId(undefined);
    }
    
    setMobileNavOpen(false);
  }

  const handleNavigateToTasks = (taskListId: string) => {
      setActiveTaskListId(taskListId);
      setActiveView('tasklist');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderMainView = () => {
    switch(activeView) {
      case 'check-in':
        return <CheckInView user={user} log={checkInLog} activityLog={activityLog} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />;
      case 'requests':
        return <RequestsView user={user} users={allUsers} />;
      case 'website-data':
        return <WebsiteDataView user={user} allUsers={allUsers} onUsersChange={handleUsersChange} />;
      case 'projects':
        return <ProjectManagementView user={user} onNavigateToTasks={handleNavigateToTasks} onSendNotification={handleSendNotification} />;
      case 'user-management':
        return <UserManagementView currentUser={user} users={allUsers} onUsersChange={handleUsersChange} />;
      case 'drive':
        return <DriveView user={user} onItemViewed={handleItemViewed} />;
      case 'meeting':
        return <MeetingView user={user} onItemViewed={handleItemViewed} />;
      case 'tasklist':
        return <TasklistView user={user} allUsers={allUsers} initialListId={activeTaskListId} />;
      case 'contacts':
        return <ContactsView user={user} onItemViewed={handleItemViewed} onNavigate={handleNavigate} />;
      case 'calendar':
        return <CalendarView user={user} events={events} onSaveEvent={handleSaveEvent} onEditEvent={handleEditEvent} onOpenModal={() => { setEditingEvent(null); setEventModalOpen(true); }} onItemViewed={handleItemViewed} />;
      case 'notes':
        return <NotesView />;
      case 'blog':
        return <BlogView user={user} onNavigate={handleNavigate} onSchedule={handleScheduleFromArticle} onItemViewed={handleItemViewed} />;
      case 'blog-article':
        return <BlogArticleView user={user} articleId={activeArticleId} onNavigate={handleNavigate} />;
      case 'new-blog-post':
        return <NewBlogPostView user={user} onNavigate={handleNavigate} />;
      case 'email':
        return <EmailClient user={user} onItemViewed={handleItemViewed} />;
      case 'team-chat':
      case 'chat':
        return <ChatView user={user} allUsers={allUsers} />;
      case 'newsfeed':
        return <NewsfeedView user={user} />;
       case 'tasks':
        return <TaskView onItemViewed={handleItemViewed} onSendNotification={handleSendNotification} />;
      case 'training':
        return <TrainingDashboardView user={user} onNavigate={handleNavigate} />;
      case 'class-detail':
        return <ClassDetailView user={user} classId={activeClassId} onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsView user={user} services={services} onToggleSync={handleToggleSync} onToggleConnection={handleToggleConnection} allUsers={allUsers} onUsersChange={handleUsersChange} initialSection={activeSettingsSection} onNavigate={handleNavigate} />;
      case 'dashboard':
      default:
        return <MainContent user={user} recentlyViewed={recentlyViewed} events={events} onNavigate={handleNavigate} checkInLog={checkInLog} activityLog={activityLog} />;
    }
  }

  const closeAllDrawers = () => {
    setMobileNavOpen(false);
    setMobileActivityOpen(false);
  }

  const handleSendNotification = async (notifData: Omit<AppNotification, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    const demoNotification: AppNotification = {
        ...notifData,
        id: `notif-${Date.now()}-${Math.random()}`,
        createdAt: Date.now()
    };

    if (user.id === 'user-1') {
      setNotifications(prev => [demoNotification, ...prev]);
      setActiveToasts(prev => [...prev, demoNotification]);
      return;
    }
    
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: demoNotification.userId,
        title: demoNotification.title,
        message: demoNotification.message,
        read: demoNotification.read,
        createdAt: demoNotification.createdAt,
        type: demoNotification.type,
        link: demoNotification.link
      });
    } catch (error) {
       console.error("Error creating notification", error);
    }
  };

  const handleCreateDemoNotification = async () => {
    handleSendNotification({
        userId: user?.id || 'user-1',
        title: 'Hệ thống (Demo)',
        message: 'Bạn vừa nhận được phân công nhiệm vụ mới. Vui lòng kiểm tra.',
        read: false,
        type: 'task',
        link: 'tasklist'
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-screen w-screen bg-transparent p-[5px] font-sans text-[--color-text-primary] overflow-hidden">
      <div className="w-full h-full bg-[--color-surface-primary] rounded-[10px] shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-black/5">
        {(isMobileNavOpen || isMobileActivityOpen) && (
          <div 
              onClick={closeAllDrawers} 
              className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in-up"
              aria-hidden="true"
          />
        )}

        {isEventModalOpen && <EventModal 
            onClose={() => { setEventModalOpen(false); setEditingEvent(null); setDefaultEventTitle(null); }} 
            onSave={handleSaveEvent}
            initialEvent={editingEvent || undefined}
            defaultTitle={defaultEventTitle || undefined}
          />}
        
        <TopSidebar 
          user={user}
          onLogout={handleLogout}
          onNotificationClick={() => setRightSidebarCollapsed(!isRightSidebarCollapsed)}
          onNavigate={handleNavigate}
          onToggleMobileNav={() => setMobileNavOpen(!isMobileNavOpen)}
          onToggleMobileActivity={() => setMobileActivityOpen(!isMobileActivityOpen)}
          unreadCount={unreadCount}
        />
        <div className="flex flex-1 min-h-0">
          <LeftSidebar 
            user={user}
            isCollapsed={isLeftSidebarCollapsed}
            isMobileOpen={isMobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            onMouseEnter={() => setLeftSidebarCollapsed(false)}
            onMouseLeave={() => setLeftSidebarCollapsed(true)}
            activeView={activeView}
            onNavigate={handleNavigate}
            recentlyViewed={recentlyViewed}
            onAiClick={() => setAiWidgetOpen(!isAiWidgetOpen)}
            isAiOpen={isAiWidgetOpen}
          />
          {renderMainView()}
          <RightSidebar 
            isCollapsed={isRightSidebarCollapsed} 
            isMobileOpen={isMobileActivityOpen}
            onClose={() => setMobileActivityOpen(false)}
            onToggle={() => setRightSidebarCollapsed(!isRightSidebarCollapsed)}
            activityLog={activityLog}
            notifications={notifications}
            onNotificationClick={handleToastClick}
            onCreateDemoNotification={handleCreateDemoNotification}
            allUsers={allUsers}
          />
        </div>
        <MobileBottomNav 
          activeView={activeView}
          onNavigate={handleNavigate}
          onToggleMobileNav={() => setMobileNavOpen(true)}
        />

        {isAiWidgetOpen && <AiChatWidget user={user} onClose={() => setAiWidgetOpen(false)} isRightSidebarOpen={!isRightSidebarCollapsed} />}
        <NotificationToast notifications={activeToasts} onClose={handleCloseToast} onClick={handleToastClick} allUsers={allUsers} />
      </div>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
