
import React, { useState, useEffect } from 'react';
import { User, ServiceState, ServiceName, View } from '../App';
import { useLanguage } from './LanguageContext';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { linkWithPopup, GoogleAuthProvider, unlink } from 'firebase/auth';
import { 
    GoogleIcon, SettingsIcon, UserCircleIcon, SunIcon, GlobeIcon, ZapIcon, RobotIcon,
    CheckIcon, MoonIcon, LaptopIcon, ChevronDownIcon,
    SaveIcon, MailIcon, XIcon as CloseIcon
} from './icons';
import UserManagementView from './UserManagementView';
import AccountSettingsBanner from './AccountSettingsBanner';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// --- Reusable Setting Components ---
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] dark:focus:ring-offset-slate-800 ${
        checked ? 'bg-[--color-accent-500]' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

const ServiceCard: React.FC<{
  service: ServiceState;
  onToggleSync: (id: ServiceName) => void;
  onToggleConnection: (id: ServiceName) => void;
}> = ({ service, onToggleSync, onToggleConnection }) => {
    const { t } = useLanguage();
    return (
        <div className="p-5 bg-[--color-surface-secondary] rounded-xl ring-1 ring-[--color-border-primary] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[--color-surface-solid] rounded-lg">{React.cloneElement(service.icon, { className: "w-6 h-6 text-[--color-accent-600]" })}</div>
                    <h3 className="font-bold text-lg text-[--color-text-primary]">{service.name}</h3>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${service.isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {service.isConnected ? t('connected') : t('notConnected')}
                </span>
            </div>
            <div className="mt-4 pt-4 border-t border-[--color-border-secondary] flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={service.isSyncEnabled && service.isConnected} onChange={() => service.isConnected && onToggleSync(service.id)} />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${service.isSyncEnabled && service.isConnected ? 'bg-[--color-accent-500]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${service.isSyncEnabled && service.isConnected ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </label>
                    <span className={`text-sm font-medium ${service.isConnected ? 'text-[--color-text-secondary]' : 'text-slate-400'}`}>{t('sync')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button disabled={!service.isConnected} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"><SettingsIcon className="w-5 h-5 text-[--color-text-subtle]"/></button>
                    <button
                        onClick={() => onToggleConnection(service.id)}
                        className={`text-sm font-semibold py-1.5 px-4 rounded-lg transition-colors ${service.isConnected ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                        {service.isConnected ? t('disconnect') : t('connect')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Settings View ---

interface SettingsViewProps {
    user: User;
    services: ServiceState[];
    onToggleSync: (id: ServiceName) => void;
    onToggleConnection: (id: ServiceName) => void;
    allUsers: User[];
    onUsersChange: (users: User[]) => void;
    initialSection?: string | null;
    onNavigate: (view: View, section?: string) => void;
}
type Theme = 'light' | 'dark' | 'system';
const THEMES: { name: Theme, icon: React.ReactNode }[] = [
    { name: 'light', icon: <SunIcon className="w-5 h-5" /> },
    { name: 'dark', icon: <MoonIcon className="w-5 h-5" /> },
    { name: 'system', icon: <LaptopIcon className="w-5 h-5" /> },
];
const ACCENT_COLORS = [
    { name: 'cyan', color: '#06b6d4' },
    { name: 'rose', color: '#f43f5e' },
    { name: 'orange', color: '#f97316' },
    { name: 'green', color: '#22c55e' },
    { name: 'purple', color: '#a855f7' },
];

const mockFetchedArticles = [
    {
      id: 'blogger-1',
      title: 'Khám phá ẩm thực đường phố Sài Gòn',
      author: 'Travel Blogger',
      tags: ['Du lịch', 'Ẩm thực'],
      previewImage: 'https://images.unsplash.com/photo-1595233543958-f9359a3e5126?q=80&w=800',
      source: 'Blogger',
      isPinned: false,
      date: 'July 29, 2024'
    },
];

const SettingsView: React.FC<SettingsViewProps> = ({ user, services, onToggleSync, onToggleConnection, allUsers, onUsersChange, initialSection, onNavigate }) => {
    const { language, setLanguage, t } = useLanguage();
    const [activeSection, setActiveSection] = useState('profile');

    // Profile States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user.name);
    const [editAvatar, setEditAvatar] = useState(user.avatar || '');
    const [editPhone, setEditPhone] = useState(user.phoneNumber || '');
    const [profileMessage, setProfileMessage] = useState('');

    const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(user.isGoogleLinked || false);
    const [googleEmail, setGoogleEmail] = useState<string>(user.googleEmail || '');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (auth.currentUser) {
            const linked = auth.currentUser.providerData.some(p => p.providerId === 'google.com');
            setIsGoogleLinked(linked);
            const googleProvider = auth.currentUser.providerData.find(p => p.providerId === 'google.com');
            if (googleProvider) {
                setGoogleEmail(googleProvider.email || '');
            }
        }
    }, [auth.currentUser]);

    const handleLinkGoogle = async () => {
        if (!auth.currentUser) return;
        setIsLoading(true);
        setProfileMessage('');
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/calendar.events');
            provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
            provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const result = await linkWithPopup(auth.currentUser, provider);
            
            // Caching token to window for Google APIs
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                (window as unknown as { _googleAccessToken?: string })._googleAccessToken = credential.accessToken;
            }
            
            setIsGoogleLinked(true);
            setGoogleEmail(result.user.email || '');

            // Update user in Firestore
            if (!user.id.startsWith('user-') && !user.id.startsWith('demo-')) {
                await updateDoc(doc(db, 'users', user.id), {
                    isGoogleLinked: true,
                    googleEmail: result.user.email || ''
                });
            }
            
            // Sync current user status
            const updatedUser: User = {
                ...user,
                isGoogleLinked: true,
                googleEmail: result.user.email || ''
            };
            onUsersChange(allUsers.map(u => u.id === user.id ? updatedUser : u));

            setProfileMessage('Liên kết tài khoản Google thành công!');
        } catch (err) {
            console.error("Link Google Error:", err);
            const errCode = (err as { code?: string }).code || '';
            const errMsg = (err as Error).message || 'Lỗi không xác định';
            if (errCode === 'auth/credential-already-in-use') {
                setProfileMessage('Tài khoản Google này đã được liên kết với một tài khoản khác.');
            } else {
                setProfileMessage('Liên kết tài khoản Google thất bại: ' + errMsg);
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setProfileMessage(''), 4000);
        }
    };

    const handleUnlinkGoogle = async () => {
        if (!auth.currentUser) return;
        setIsLoading(true);
        setProfileMessage('');
        try {
            await unlink(auth.currentUser, 'google.com');
            setIsGoogleLinked(false);
            setGoogleEmail('');
            
            // Update user in Firestore
            if (!user.id.startsWith('user-') && !user.id.startsWith('demo-')) {
                await updateDoc(doc(db, 'users', user.id), {
                    isGoogleLinked: false,
                    googleEmail: ''
                });
            }

            // Sync current user status
            const updatedUser: User = {
                ...user,
                isGoogleLinked: false,
                googleEmail: ''
            };
            onUsersChange(allUsers.map(u => u.id === user.id ? updatedUser : u));

            setProfileMessage('Đã hủy liên kết tài khoản Google thành công!');
        } catch (err) {
            console.error("Unlink Google Error:", err);
            const errMsg = (err as Error).message || 'Lỗi không xác định';
            setProfileMessage('Hủy liên kết tài khoản Google thất bại: ' + errMsg);
        } finally {
            setIsLoading(false);
            setTimeout(() => setProfileMessage(''), 4000);
        }
    };

    const handleSaveProfile = async () => {
        const updatedUser: User = {
            ...user,
            name: editName,
            avatar: editAvatar,
            phoneNumber: editPhone
        };

        // Update local state first
        const updatedUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
        onUsersChange(updatedUsers);

        // Update Firestore if not mock user
        if (user.id !== 'user-1' && !user.id.startsWith('demo-')) {
            try {
                await updateDoc(doc(db, 'users', user.id), {
                    name: editName,
                    avatar: editAvatar,
                    phoneNumber: editPhone
                });
                setProfileMessage(t('profileUpdated'));
            } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
                setProfileMessage(t('profileUpdateError'));
            }
        } else {
            setProfileMessage(t('profileUpdated'));
        }
        setIsEditingProfile(false);
        setTimeout(() => setProfileMessage(''), 4000);
    };

    // General Settings States
    const [theme, setTheme] = useState<Theme>('system');
    const [accentColor, setAccentColor] = useState('cyan');
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const [isRobotEffectEnabled, setIsRobotEffectEnabled] = useState(false);
    const [isSoundEffectsEnabled, setIsSoundEffectsEnabled] = useState(true);
    const [isCursorTrailsEnabled, setIsCursorTrailsEnabled] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);

    // Blog Settings States
    const [blogUrl, setBlogUrl] = useState('');
    const [blogFrequency, setBlogFrequency] = useState('manual');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchMessage, setFetchMessage] = useState('');

    // Drive Settings States
    const [driveUrl, setDriveUrl] = useState('');
    const [driveFrequency, setDriveFrequency] = useState('manual');
    const [isFetchingDrive, setIsFetchingDrive] = useState(false);
    const [fetchDriveMessage, setFetchDriveMessage] = useState('');

    // Zimbra Settings States
    const [zimbraEmail, setZimbraEmail] = useState('');
    const [zimbraPassword, setZimbraPassword] = useState('');
    const [zimbraServer, setZimbraServer] = useState('');
    const [zimbraFrequency, setZimbraFrequency] = useState('manual');
    const [isSyncingZimbra, setIsSyncingZimbra] = useState(false);
    const [zimbraSyncMessage, setZimbraSyncMessage] = useState('');

    useEffect(() => {
        if(initialSection) {
            setActiveSection(initialSection);
        }
    }, [initialSection]);

    // Load settings from localStorage on mount
    useEffect(() => {
        setTheme((localStorage.getItem('theme') as Theme) || 'system');
        setAccentColor(localStorage.getItem('accentColor') || 'cyan');
        setIsSpeechEnabled(localStorage.getItem('aiSpeechEnabled') !== 'false');
        setIsRobotEffectEnabled(localStorage.getItem('aiRobotEffectEnabled') === 'true');
        setIsSoundEffectsEnabled(localStorage.getItem('soundEffectsEnabled') !== 'false');
        setIsCursorTrailsEnabled(localStorage.getItem('cursorTrailsEnabled') === 'true');
        setSelectedVoiceURI(localStorage.getItem('selectedVoiceURI'));
        setBlogUrl(localStorage.getItem('blog_settings_url') || '');
        setBlogFrequency(localStorage.getItem('blog_settings_frequency') || 'manual');
        setDriveUrl(localStorage.getItem('drive_settings_url') || '');
        setDriveFrequency(localStorage.getItem('drive_settings_frequency') || 'manual');
        setZimbraEmail(localStorage.getItem('zimbra_email') || '');
        setZimbraPassword(localStorage.getItem('zimbra_password') || '');
        setZimbraServer(localStorage.getItem('zimbra_server') || '');
        setZimbraFrequency(localStorage.getItem('zimbra_frequency') || 'manual');

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            const filtered = availableVoices.filter(v => v.lang.startsWith('vi') || v.lang.startsWith('en'));
            setVoices(filtered);
            if (!localStorage.getItem('selectedVoiceURI') && filtered.length > 0) {
                 const namMinhVoice = filtered.find(v => v.name === 'Nam Minh' && v.lang === 'vi-VN');
                const googleVietnameseVoice = filtered.find(v => v.lang === 'vi-VN' && v.name.includes('Google'));
                const defaultVoice = namMinhVoice || googleVietnameseVoice || filtered[0];
                if(defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
            }
        };

        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Effect to apply theme
    useEffect(() => {
        localStorage.setItem('theme', theme);
        const doc = document.documentElement;
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        doc.classList.add('dark');
        } else {
        doc.classList.remove('dark');
        }
    }, [theme]);

    // Effect to apply accent color
    useEffect(() => {
        localStorage.setItem('accentColor', accentColor);
        document.documentElement.setAttribute('data-accent-color', accentColor);
    }, [accentColor]);

    // Effects for other settings
    useEffect(() => { localStorage.setItem('aiSpeechEnabled', String(isSpeechEnabled)); }, [isSpeechEnabled]);
    useEffect(() => { localStorage.setItem('aiRobotEffectEnabled', String(isRobotEffectEnabled)); }, [isRobotEffectEnabled]);
    useEffect(() => { localStorage.setItem('soundEffectsEnabled', String(isSoundEffectsEnabled)); }, [isSoundEffectsEnabled]);
    useEffect(() => { localStorage.setItem('cursorTrailsEnabled', String(isCursorTrailsEnabled)); }, [isCursorTrailsEnabled]);
    useEffect(() => { if (selectedVoiceURI) localStorage.setItem('selectedVoiceURI', selectedVoiceURI); }, [selectedVoiceURI]);

    // Blog Settings Logic
    const handleSaveBlogSettings = () => {
        localStorage.setItem('blog_settings_url', blogUrl);
        localStorage.setItem('blog_settings_frequency', blogFrequency);
        setFetchMessage('Cài đặt đã được lưu!');
        setTimeout(() => setFetchMessage(''), 3000);
    };

    const handleFetchBlogPosts = async () => {
        setIsFetching(true);
        setFetchMessage('');
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        try {
            const existingArticlesRaw = localStorage.getItem('blog_articles');
            const existingArticles: { id: string }[] = existingArticlesRaw ? JSON.parse(existingArticlesRaw) : [];
            const existingIds = new Set(existingArticles.map((a: { id: string }) => a.id));
            const newArticles = mockFetchedArticles.filter(a => !existingIds.has(a.id));

            if (newArticles.length > 0) {
                localStorage.setItem('blog_articles', JSON.stringify([...existingArticles, ...newArticles]));
                window.dispatchEvent(new Event('storage'));
            }
            
            setFetchMessage(t('fetchSuccess', { count: newArticles.length }));
        } catch (err) {
            console.error('Fetch Blog Error:', err);
            setFetchMessage(t('fetchError'));
        } finally {
            setIsFetching(false);
            setTimeout(() => setFetchMessage(''), 4000);
        }
    };

    // Drive Settings Logic
    const handleSaveDriveSettings = () => {
        localStorage.setItem('drive_settings_url', driveUrl);
        localStorage.setItem('drive_settings_frequency', driveFrequency);
        setFetchDriveMessage(t('saveSuccess') || 'Cài đặt đã được lưu!');
        setTimeout(() => setFetchDriveMessage(''), 3000);
    };

    const handleFetchDriveFiles = async () => {
        setIsFetchingDrive(true);
        setFetchDriveMessage('');
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        try {
            setFetchDriveMessage(t('syncSuccess') || 'Đồng bộ thành công!');
        } catch (err) {
            console.error('Fetch Drive Error:', err);
            setFetchDriveMessage(t('fetchDriveError') || 'Có lỗi xảy ra.');
        } finally {
            setIsFetchingDrive(false);
            setTimeout(() => setFetchDriveMessage(''), 4000);
        }
    };

    // Zimbra Settings Logic
    const handleSaveZimbraSettings = () => {
        localStorage.setItem('zimbra_email', zimbraEmail);
        localStorage.setItem('zimbra_password', zimbraPassword);
        localStorage.setItem('zimbra_server', zimbraServer);
        localStorage.setItem('zimbra_frequency', zimbraFrequency);
        setZimbraSyncMessage(t('saveSuccess') || 'Cài đặt đã được lưu!');
        setTimeout(() => setZimbraSyncMessage(''), 3000);
    };

    const handleSyncZimbra = async () => {
        setIsSyncingZimbra(true);
        setZimbraSyncMessage('');
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        try {
            setZimbraSyncMessage(t('syncSuccess') || 'Đồng bộ Zimbra thành công!');
        } catch (err) {
            console.error('Zimbra Sync Error:', err);
            setZimbraSyncMessage('Lỗi kết nối Zimbra. Vui lòng kiểm tra lại cấu hình.');
        } finally {
            setIsSyncingZimbra(false);
            setTimeout(() => setZimbraSyncMessage(''), 4000);
        }
    };


    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const sections = [
        { id: 'profile', label: t('profile'), icon: <UserCircleIcon className="w-5 h-5"/>, description: t('manageYourProfile') },
        { id: 'appearance', label: t('appearance'), icon: <SunIcon className="w-5 h-5"/>, description: t('customizeAppearance') },
        { id: 'language', label: t('language'), icon: <GlobeIcon className="w-5 h-5"/>, description: t('chooseLanguage') },
        { id: 'effects', label: t('effectsAndSound'), icon: <ZapIcon className="w-5 h-5"/>, description: t('manageEffects') },
        { id: 'ai_voice', label: t('aiVoiceSettings'), icon: <RobotIcon className="w-5 h-5"/>, description: t('configureAiAssistant') },
        { id: 'zimbra', label: t('zimbraSettings'), icon: <MailIcon className="w-5 h-5"/>, description: t('zimbraSettingsDesc') },
    ];

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'profile': return (
                <div className="flex flex-col items-center gap-6 p-8 bg-[--color-surface-secondary] rounded-xl shadow-inner border border-[--color-border-primary]">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full bg-[--color-accent-500] text-white flex items-center justify-center font-bold text-4xl ring-4 ring-white shadow-xl overflow-hidden">
                            {isEditingProfile ? (
                                editAvatar ? <img src={editAvatar} alt="editing" className="w-full h-full object-cover" /> : getInitials(editName)
                            ) : (
                                user.avatar ? <img src={user.avatar} alt={user.name} className="rounded-full w-full h-full object-cover" /> : getInitials(user.name)
                            )}
                        </div>
                        {isEditingProfile && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <span className="text-white text-xs font-bold uppercase tracking-wider">{t('changeAvatar') || 'Thay đổi'}</span>
                            </div>
                        )}
                    </div>

                    {!isEditingProfile ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                            <h3 className="text-2xl font-bold text-[--color-text-primary] mt-2">{user.name}</h3>
                            <p className="text-[--color-text-secondary] flex items-center gap-2 font-medium">
                                <GlobeIcon className="w-4 h-4 opacity-70" /> {user.email}
                            </p>
                            {user.phoneNumber && (
                                <p className="text-sm text-[--color-text-secondary] flex items-center gap-2">
                                    <ZapIcon className="w-4 h-4 opacity-70" /> {user.phoneNumber}
                                </p>
                            )}
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs font-bold px-3 py-1 bg-[--color-accent-600] text-white rounded-full uppercase tracking-tighter">{user.role}</span>
                                <span className="text-xs font-bold px-3 py-1 bg-green-500 text-white rounded-full uppercase tracking-tighter">Verified</span>
                            </div>
                            <button 
                                onClick={() => {
                                    setEditName(user.name);
                                    setEditAvatar(user.avatar || '');
                                    setEditPhone(user.phoneNumber || '');
                                    setIsEditingProfile(true);
                                }}
                                className="mt-8 w-full max-w-xs flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white bg-gradient-to-r from-[--color-accent-600] to-[--color-accent-400] hover:scale-[1.02] active:scale-[0.98] transition-all font-bold shadow-lg shadow-[--color-accent-500]/20"
                            >
                                <SettingsIcon className="w-5 h-5"/> {t('editProfile')}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-md space-y-5 animate-fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[--color-text-secondary] px-1">{t('fullName')}</label>
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-[--color-surface-primary] p-3 rounded-xl border-2 border-[--color-border-secondary] focus:border-[--color-accent-500] outline-none transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[--color-text-secondary] px-1">{t('avatarUrl')}</label>
                                <input 
                                    type="text" 
                                    value={editAvatar} 
                                    onChange={(e) => setEditAvatar(e.target.value)}
                                    className="w-full bg-[--color-surface-primary] p-3 rounded-xl border-2 border-[--color-border-secondary] focus:border-[--color-accent-500] outline-none transition-all font-medium"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[--color-text-secondary] px-1">{t('phoneNumber')}</label>
                                <input 
                                    type="text" 
                                    value={editPhone} 
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    className="w-full bg-[--color-surface-primary] p-3 rounded-xl border-2 border-[--color-border-secondary] focus:border-[--color-accent-500] outline-none transition-all font-medium"
                                    placeholder="+84..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setIsEditingProfile(false)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-[--color-text-primary] bg-[--color-surface-solid] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold"
                                >
                                    <CloseIcon className="w-5 h-5"/> {t('cancel')}
                                </button>
                                <button 
                                    onClick={handleSaveProfile}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all font-bold shadow-lg shadow-green-500/20"
                                >
                                    <SaveIcon className="w-5 h-5"/> {t('saveProfile')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Section: Google Account Link (Consistent display below) */}
                    <div className="w-full max-w-md mt-6 p-5 rounded-2xl border border-[--color-border-secondary] bg-[--color-surface-primary] space-y-4 shadow-sm animate-fade-in text-left">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500 dark:bg-red-500/20">
                                    <GoogleIcon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-sm text-[--color-text-primary]">Liên kết Google Account</h4>
                                    <p className="text-xs text-[--color-text-subtle] mt-0.5">
                                        {isGoogleLinked ? 'Lưu lịch sử & tác vụ qua Gmail, Calendar' : 'Kích hoạt đồng bộ hoá Lịch & Gmail của bạn'}
                                    </p>
                                </div>
                            </div>
                            {isGoogleLinked ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md border border-green-500/20 uppercase tracking-wider">Đã kết nối</span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md border border-amber-500/20 uppercase tracking-wider">Chưa kết nối</span>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs pt-3 border-t border-[--color-border-primary]/50">
                            <span className="font-mono text-[--color-text-secondary] truncate max-w-[180px] self-center">
                                {isGoogleLinked ? (googleEmail || user.email) : 'Chưa liên kết tài khoản Google'}
                            </span>
                            {isGoogleLinked ? (
                                <button
                                    type="button"
                                    onClick={handleUnlinkGoogle}
                                    disabled={isLoading}
                                    className="font-bold text-xs text-red-650 dark:text-red-400 bg-red-500/10 hover:bg-red-500/15 active:scale-95 transition-all px-3 py-1.5 rounded-lg border border-red-500/20 cursor-pointer"
                                >
                                    {isLoading ? 'Đang xử lý...' : 'Hủy liên kết'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleLinkGoogle}
                                    disabled={isLoading}
                                    className="font-bold text-xs text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all px-4 py-2 rounded-xl shadow-md hover:shadow-lg shadow-red-500/10 duration-150 cursor-pointer flex items-center gap-1.5"
                                >
                                    <GoogleIcon className="w-3.5 h-3.5 fill-white" />
                                    {isLoading ? 'Đang kết nối...' : 'Liên kết tài khoản Google'}
                                </button>
                            )}
                        </div>
                    </div>
                    {profileMessage && (
                        <div className={`w-full max-w-md p-3 text-center rounded-lg font-bold border animate-fade-in ${profileMessage === t('profileUpdateError') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                            {profileMessage}
                        </div>
                    )}
                </div>
            );
            case 'appearance': return (
                <>
                    <div className="p-6 bg-[--color-surface-secondary] rounded-xl">
                        <label className="text-lg font-bold text-[--color-text-primary]">{t('mode')}</label>
                        <p className="text-sm text-[--color-text-subtle] mb-4">Chọn giao diện sáng, tối hoặc theo hệ thống.</p>
                        <div className="flex items-center bg-[--color-surface-primary] p-1 rounded-lg">
                            {THEMES.map(t_item => (
                                <button key={t_item.name} onClick={() => setTheme(t_item.name)} className={`w-full flex justify-center items-center gap-2 text-sm capitalize p-2 rounded-md transition-colors ${theme === t_item.name ? 'bg-[--color-surface-solid] text-[--color-text-primary] shadow-sm' : 'text-[--color-text-secondary] hover:bg-[--color-surface-secondary]'}`}>
                                    {t_item.icon} <span>{t(t_item.name)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="p-6 bg-[--color-surface-secondary] rounded-xl">
                        <label className="text-lg font-bold text-[--color-text-primary]">{t('accent')}</label>
                         <p className="text-sm text-[--color-text-subtle] mb-4">Chọn màu nhấn cho ứng dụng.</p>
                        <div className="flex justify-around p-2">
                            {ACCENT_COLORS.map(c => (
                                <button key={c.name} onClick={() => setAccentColor(c.name)} className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 dark:ring-offset-slate-800 transition-all" style={{ backgroundColor: c.color, borderColor: accentColor === c.name ? c.color : 'transparent'}}>
                                    {accentColor === c.name && <CheckIcon className="w-6 h-6 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            );
             case 'language': return (
                 <div className="p-6 bg-[--color-surface-secondary] rounded-xl space-y-2">
                    <button onClick={() => setLanguage('vi')} className={`w-full text-left flex items-center justify-between p-3 rounded-lg text-md transition-colors ${language === 'vi' ? 'bg-[--color-surface-solid] text-[--color-text-primary] font-semibold shadow-sm' : 'text-[--color-text-secondary] hover:bg-[--color-surface-secondary]'}`}>
                        <span>Tiếng Việt</span> {language === 'vi' && <CheckIcon className="w-5 h-5 text-[--color-accent-500]" />}
                    </button>
                    <button onClick={() => setLanguage('en')} className={`w-full text-left flex items-center justify-between p-3 rounded-lg text-md transition-colors ${language === 'en' ? 'bg-[--color-surface-solid] text-[--color-text-primary] font-semibold shadow-sm' : 'text-[--color-text-secondary] hover:bg-[--color-surface-secondary]'}`}>
                        <span>English</span> {language === 'en' && <CheckIcon className="w-5 h-5 text-[--color-accent-500]" />}
                    </button>
                 </div>
            );
            case 'effects': return (
                <>
                    <h3 className="text-xl font-bold text-[--color-text-primary] mb-4">{t('visualEffects')}</h3>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[--color-surface-secondary]">
                        <div>
                            <p className="font-medium text-[--color-text-primary]">{t('cursorTrails')}</p>
                            <p className="text-sm text-[--color-text-subtle]">{t('cursorTrailsDesc')}</p>
                        </div>
                        <ToggleSwitch checked={isCursorTrailsEnabled} onChange={setIsCursorTrailsEnabled} />
                    </div>
                     <h3 className="text-xl font-bold text-[--color-text-primary] mt-6 mb-4">{t('soundEffects')}</h3>
                     <div className="flex items-center justify-between p-4 rounded-xl bg-[--color-surface-secondary]">
                        <div>
                            <p className="font-medium text-[--color-text-primary]">{t('enableSoundEffects')}</p>
                            <p className="text-sm text-[--color-text-subtle]">{t('enableSoundEffectsDesc')}</p>
                        </div>
                        <ToggleSwitch checked={isSoundEffectsEnabled} onChange={setIsSoundEffectsEnabled} />
                    </div>
                </>
            );
            case 'ai_voice': return (
                 <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 rounded-xl bg-[--color-surface-secondary]">
                        <div>
                            <p className="font-medium text-[--color-text-primary]">{t('enableAiVoice')}</p>
                            <p className="text-sm text-[--color-text-subtle]">{t('enableAiVoiceDesc')}</p>
                        </div>
                        <ToggleSwitch checked={isSpeechEnabled} onChange={setIsSpeechEnabled} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[--color-surface-secondary]">
                        <div>
                            <p className="font-medium text-[--color-text-primary]">{t('robotEffect')}</p>
                            <p className="text-sm text-[--color-text-subtle]">{t('robotEffectDesc')}</p>
                        </div>
                        <ToggleSwitch checked={isRobotEffectEnabled} onChange={setIsRobotEffectEnabled} />
                    </div>
                     <div className="p-4 rounded-xl bg-[--color-surface-secondary]">
                        <label htmlFor="voice-select" className="font-medium text-[--color-text-primary]">{t('voiceModel')}</label>
                        <p className="text-sm text-[--color-text-subtle] mb-2">{t('voiceModelDesc')}</p>
                        <select
                            id="voice-select"
                            value={selectedVoiceURI || ''}
                            onChange={(e) => setSelectedVoiceURI(e.target.value)}
                            className="w-full mt-1 bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        >
                            {voices.length > 0 ? voices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
                            )) : <option disabled>{t('loadingVoices')}</option>}
                        </select>
                    </div>
                </div>
            );
            case 'sync': return (
                <>
                    <div className="mb-6 p-6 bg-[--color-surface-secondary] rounded-xl ring-1 ring-[--color-border-primary] shadow-sm flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <GoogleIcon className="w-10 h-10 shrink-0"/>
                            <div>
                                <h3 className="text-lg font-bold text-[--color-text-primary]">{t('connectGoogleAccount')}</h3>
                                <p className="text-sm text-[--color-text-secondary]">{t('connectedAs')}: <span className="font-semibold">{user.email}</span></p>
                            </div>
                        </div>
                        <button className="py-2 px-5 rounded-lg text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                            {t('disconnect')}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {services.map(service => (
                            <ServiceCard key={service.id} service={service} onToggleSync={onToggleSync} onToggleConnection={onToggleConnection} />
                        ))}
                    </div>
                </>
            );
            case 'zimbra':
                return (
                 <div className="bg-[--color-surface-secondary] rounded-xl shadow-lg p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MailIcon className="w-8 h-8 text-[--color-accent-600]"/>
                        <div>
                             <h2 className="text-xl font-bold text-[--color-text-primary]">{t('zimbraSettings')}</h2>
                             <p className="text-sm text-[--color-text-subtle]">{t('zimbraSettingsDesc')}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="zimbra-email" className="text-sm font-semibold text-[--color-text-secondary]">{t('zimbraEmail')}</label>
                            <input
                                id="zimbra-email"
                                type="email"
                                value={zimbraEmail}
                                onChange={e => setZimbraEmail(e.target.value)}
                                placeholder="user@zimbra.example.com"
                                className="w-full bg-[--color-surface-primary] p-2.5 rounded-lg border border-[--color-border-secondary] focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="zimbra-password" className="text-sm font-semibold text-[--color-text-secondary]">{t('zimbraPassword')}</label>
                            <input
                                id="zimbra-password"
                                type="password"
                                value={zimbraPassword}
                                onChange={e => setZimbraPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[--color-surface-primary] p-2.5 rounded-lg border border-[--color-border-secondary] focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="zimbra-server" className="text-sm font-semibold text-[--color-text-secondary]">{t('zimbraServer')}</label>
                        <input
                            id="zimbra-server"
                            type="url"
                            value={zimbraServer}
                            onChange={e => setZimbraServer(e.target.value)}
                            placeholder="https://mail.zimbra.example.com"
                            className="w-full bg-[--color-surface-primary] p-2.5 rounded-lg border border-[--color-border-secondary] focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="zimbra-frequency" className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('fetchFrequency')}</label>
                        <select
                            id="zimbra-frequency"
                            value={zimbraFrequency}
                            onChange={e => setZimbraFrequency(e.target.value)}
                            className="w-full bg-[--color-surface-primary] p-2.5 rounded-lg border border-[--color-border-secondary] focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none transition-all"
                        >
                            <option value="manual">{t('manual')}</option>
                            <option value="daily">{t('daily')}</option>
                            <option value="weekly">{t('weekly')}</option>
                        </select>
                    </div>

                    <div className="border-t border-[--color-border-secondary] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <button
                            onClick={handleSaveZimbraSettings}
                            className="w-full sm:w-auto text-sm font-bold py-2.5 px-8 rounded-xl text-white bg-gradient-to-r from-slate-600 to-slate-800 shadow-lg shadow-slate-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {t('saveSettings')}
                        </button>
                        <button
                            onClick={handleSyncZimbra}
                            disabled={isSyncingZimbra || !zimbraEmail}
                            className="w-full sm:w-auto text-sm font-bold py-2.5 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSyncingZimbra ? t('syncing') : 'Sync Zimbra Now'}
                        </button>
                    </div>
                    
                    {zimbraSyncMessage && (
                        <div className="p-4 text-center rounded-xl bg-cyan-50 text-cyan-800 font-bold border border-cyan-100 animate-fade-in">
                            {zimbraSyncMessage}
                        </div>
                    )}
                </div>
            );
             case 'drive':
                const driveService = services.find(s => s.id === 'Drive');
                return (
                 <div className="bg-[--color-surface-secondary] rounded-xl shadow-lg p-6 space-y-6">
                    {driveService && (
                        <ServiceCard service={driveService} onToggleSync={onToggleSync} onToggleConnection={onToggleConnection} />
                    )}
                    <div>
                        <label htmlFor="drive-url" className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('driveFolderUrl') || 'Drive Folder URL'}</label>
                        <input
                            id="drive-url"
                            type="url"
                            value={driveUrl}
                            onChange={e => setDriveUrl(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="drive-fetch-frequency" className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('fetchFrequency')}</label>
                        <select
                            id="drive-fetch-frequency"
                            value={driveFrequency}
                            onChange={e => setDriveFrequency(e.target.value)}
                            className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        >
                            <option value="manual">{t('manual')}</option>
                            <option value="daily">{t('daily')}</option>
                            <option value="weekly">{t('weekly')}</option>
                        </select>
                    </div>

                    <div className="border-t border-[--color-border-secondary] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <button
                            onClick={handleSaveDriveSettings}
                            className="w-full sm:w-auto text-sm font-semibold py-2.5 px-6 rounded-lg text-[--color-text-primary] bg-[--color-surface-primary] hover:bg-[--color-surface-tertiary] transition-colors"
                        >
                            {t('saveSettings')}
                        </button>
                        <button
                            onClick={handleFetchDriveFiles}
                            disabled={isFetchingDrive || !driveService?.isConnected}
                            className="w-full sm:w-auto text-sm font-semibold py-2.5 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFetchingDrive ? (t('fetchingFiles') || 'Fetching...') : (t('fetchFiles') || 'Fetch Files')}
                        </button>
                    </div>
                    
                    {fetchDriveMessage && (
                        <div className="p-3 text-center rounded-md bg-[--color-surface-primary] text-[--color-text-primary] font-medium">
                            {fetchDriveMessage}
                        </div>
                    )}
                </div>
            );
             case 'blog':
                const bloggerService = services.find(s => s.id === 'Blogger');
                return (
                 <div className="bg-[--color-surface-secondary] rounded-xl shadow-lg p-6 space-y-6">
                    {bloggerService && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-slate-100 dark:bg-slate-800/50">
                            <div className={`w-3 h-3 rounded-full ${bloggerService.isConnected ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                            <p className="text-sm font-semibold text-[--color-text-secondary]">
                                Blogger Status: <span className={bloggerService.isConnected ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                                    {bloggerService.isConnected ? t('connected') : t('notConnected')}
                                </span>
                            </p>
                        </div>
                    )}
                    <div>
                        <label htmlFor="blogger-url" className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('bloggerUrl')}</label>
                        <input
                            id="blogger-url"
                            type="url"
                            value={blogUrl}
                            onChange={e => setBlogUrl(e.target.value)}
                            placeholder="https://yourblog.blogspot.com"
                            className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="fetch-frequency" className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('fetchFrequency')}</label>
                        <select
                            id="fetch-frequency"
                            value={blogFrequency}
                            onChange={e => setBlogFrequency(e.target.value)}
                            className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        >
                            <option value="manual">{t('manual')}</option>
                            <option value="daily">{t('daily')}</option>
                            <option value="weekly">{t('weekly')}</option>
                        </select>
                    </div>

                    <div className="border-t border-[--color-border-secondary] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <button
                            onClick={handleSaveBlogSettings}
                            className="w-full sm:w-auto text-sm font-semibold py-2.5 px-6 rounded-lg text-[--color-text-primary] bg-[--color-surface-primary] hover:bg-[--color-surface-tertiary] transition-colors"
                        >
                            {t('saveSettings')}
                        </button>
                        <button
                            onClick={handleFetchBlogPosts}
                            disabled={isFetching || !bloggerService?.isConnected}
                            className="w-full sm:w-auto text-sm font-semibold py-2.5 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFetching ? t('fetchingPosts') : t('fetchNow')}
                        </button>
                    </div>
                    
                    {fetchMessage && (
                        <div className="p-3 text-center rounded-md bg-[--color-surface-primary] text-[--color-text-primary] font-medium">
                            {fetchMessage}
                        </div>
                    )}
                </div>
            );
            case 'administration':
                return (
                    <div className="bg-[--color-surface-secondary] p-8 rounded-2xl border border-[--color-border-primary] shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
                            <GlobeIcon className="w-8 h-8"/>
                        </div>
                        <h3 className="text-xl font-bold text-[--color-text-primary]">{t('websiteDataManagement')}</h3>
                        <p className="text-[--color-text-secondary] max-w-sm mx-auto">Chuyển đến trang Quản trị hệ thống để quản lý nội dung website và phân quyền người dùng.</p>
                        <button 
                            onClick={() => onNavigate('website-data')}
                            className="mt-4 px-8 py-3 bg-[--color-accent-600] text-white rounded-xl font-bold hover:bg-[--color-accent-700] transition-all shadow-lg shadow-[--color-accent-500]/20"
                        >
                            Truy cập Quản trị
                        </button>
                    </div>
                );
            case 'user-management':
                return (
                    <UserManagementView currentUser={user} users={allUsers} onUsersChange={onUsersChange} />
                );
            default: return null;
        }
    };
    
    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] gap-3 pb-24 md:pb-8">
            <div className="shrink-0">
                <AccountSettingsBanner />
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
                {/* Left Navigation (Desktop) */}
                <aside className="w-full md:w-1/4 lg:w-1/5 shrink-0 hidden md:block">
                    <nav className="flex flex-col gap-1">
                        {sections.map(section => (
                             <button 
                                key={section.id} 
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3 ${activeSection === section.id ? 'bg-[--color-surface-secondary]' : 'hover:bg-[--color-surface-secondary]/60'}`}
                            >
                                <div className={`mt-0.5 ${activeSection === section.id ? 'text-[--color-accent-600]' : 'text-[--color-text-subtle]'}`}>{section.icon}</div>
                                <div>
                                    <h3 className={`font-bold ${activeSection === section.id ? 'text-[--color-text-primary]' : 'text-[--color-text-secondary]'}`}>{section.label}</h3>
                                    <p className="text-xs text-[--color-text-subtle] hidden lg:block">{section.description}</p>
                                </div>
                            </button>
                        ))}
                    </nav>
                </aside>

                 {/* Top Navigation (Mobile) */}
                <div className="relative block md:hidden mb-4">
                     <select 
                        value={activeSection}
                        onChange={(e) => setActiveSection(e.target.value)}
                        className="w-full appearance-none bg-[--color-surface-secondary] text-[--color-text-primary] font-bold p-3 rounded-lg border border-[--color-border-secondary] focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none"
                    >
                        {sections.map(section => (
                            <option key={section.id} value={section.id}>{section.label}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="w-5 h-5 text-[--color-text-subtle] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                </div>


                {/* Right Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
                    <div className="space-y-6">
                        {renderSectionContent()}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SettingsView;
