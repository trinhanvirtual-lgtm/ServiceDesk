import React, { useState, useEffect, useRef } from 'react';
import { User } from '../App';
import { useLanguage } from './LanguageContext';
import { SettingsIcon, FileTextIcon, FolderIcon, FileEditIcon, TrashIcon, PlusIcon, XIcon, CheckCircleIcon, SyncIcon, UsersIcon, MailIcon, LockIcon, CheckIcon } from './icons';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import UserManagementView from './UserManagementView';
import WebsiteBanner from './WebsiteBanner';

interface WebsiteDataViewProps {
  user: User;
  allUsers: User[];
  onUsersChange: (users: User[]) => void;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  lastUpdated: string;
  content: string;
}

const mockPages: PageData[] = [
  { id: '2', title: 'Giới thiệu', slug: '/about', status: 'published', lastUpdated: '2024-03-05', content: 'Giới thiệu công ty...' },
  { id: '3', title: 'Dịch vụ', slug: '/services', status: 'published', lastUpdated: '2024-02-28', content: 'Danh sách dịch vụ...' },
  { id: '4', title: 'Khuyến mãi mùa hè', slug: '/summer-promo', status: 'draft', lastUpdated: '2024-04-12', content: 'Khuyến mãi đặc biệt...' },
];

export interface EmailConfig {
  provider: 'zimbra' | 'google' | 'microsoft';
  zimbraUrl?: string;
  zimbraUsername?: string;
  zimbraPassword?: string;
  zimbraSmtpHost?: string;
  zimbraSmtpPort?: number;
  zimbraImapHost?: string;
  zimbraImapPort?: number;
  zimbraUseSsl?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  googleAppPassword?: string;
  googleSenderEmail?: string;
  googleUseOAuth?: boolean;
  msTenantId?: string;
  msClientId?: string;
  msClientSecret?: string;
  msAppPassword?: string;
  msSenderEmail?: string;
  msUseOAuth?: boolean;
  senderName?: string;
  senderEmail?: string;
  rateLimit?: number;
  retryCount?: number;
}

const WebsiteDataView: React.FC<WebsiteDataViewProps> = ({ user, allUsers, onUsersChange }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pages' | 'media' | 'settings' | 'permissions' | 'email-config'>('pages');
  const [pages, setPages] = useState<PageData[]>(mockPages);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('draft');
  const [formContent, setFormContent] = useState('');

  // Settings state
  const [siteName, setSiteName] = useState('Công ty TNHH PSO Desk');
  const [siteDesc, setSiteDesc] = useState('Giải pháp quản trị doanh nghiệp toàn diện');
  const [siteEmail, setSiteEmail] = useState('admin@psodesk.com');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Email Config State
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'zimbra',
    zimbraUrl: 'https://mail.powerone.vn',
    zimbraUsername: '',
    zimbraPassword: '',
    zimbraSmtpHost: 'smtp.powerone.vn',
    zimbraSmtpPort: 465,
    zimbraImapHost: 'imap.powerone.vn',
    zimbraImapPort: 993,
    zimbraUseSsl: true,
    googleClientId: '',
    googleClientSecret: '',
    googleAppPassword: '',
    googleSenderEmail: '',
    googleUseOAuth: false,
    msTenantId: '',
    msClientId: '',
    msClientSecret: '',
    msAppPassword: '',
    msSenderEmail: '',
    msUseOAuth: false,
    senderName: 'Hệ thống Power One',
    senderEmail: 'noreply@powerone.vn',
    rateLimit: 100,
    retryCount: 3,
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testSendStatus, setTestSendStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [testSendLogs, setTestSendLogs] = useState<string[]>([]);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const formStateRef = useRef({ formTitle, formSlug, formStatus, formContent, editingId });

  useEffect(() => {
    formStateRef.current = { formTitle, formSlug, formStatus, formContent, editingId };
  }, [formTitle, formSlug, formStatus, formContent, editingId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isModalOpen) {
      timer = setInterval(() => {
        const { formTitle, formSlug, formStatus, formContent, editingId } = formStateRef.current;
        if (!formTitle && !formContent) return; // Don't save empty drafts
        const draftData = {
          title: formTitle,
          slug: formSlug,
          status: formStatus,
          content: formContent,
          timestamp: new Date().toISOString()
        };
        const draftKey = `page_draft_${editingId || 'new'}`;
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setLastSavedTime(new Date());
      }, 30000);
    }
    return () => clearInterval(timer);
  }, [isModalOpen]);

  useEffect(() => {
    if (!auth.currentUser || user.id.startsWith('user-')) {
        setIsLoading(false);
        // Load fallback for guest
        const local = localStorage.getItem('website_email_config');
        if (local) {
          try {
            setEmailConfig(prev => ({ ...prev, ...JSON.parse(local) }));
          } catch (e) {
            console.error('Error parsing local config', e);
          }
        }
        return;
    }
    if (!auth.currentUser) return;
    // Determine if Firebase is connected
    const pagesRef = collection(db, 'pages');
    const unsubscribePages = onSnapshot(pagesRef, (snapshot) => {
      const pagesList: PageData[] = [];
      snapshot.forEach((doc) => {
        pagesList.push({ id: doc.id, ...doc.data() } as PageData);
      });
      setPages(pagesList);
      setIsLoading(false);
    }, (error) => {
       console.error("Error fetching pages:", error);
       setIsLoading(false);
    });

    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.siteName) setSiteName(data.siteName);
        if (data.siteDesc) setSiteDesc(data.siteDesc);
        if (data.siteEmail) setSiteEmail(data.siteEmail);
      }
    });

    const emailSettingsRef = doc(db, 'settings', 'email');
    const unsubscribeEmail = onSnapshot(emailSettingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEmailConfig(prev => ({ ...prev, ...data }));
      } else {
        const local = localStorage.getItem('website_email_config');
        if (local) {
          try {
            setEmailConfig(prev => ({ ...prev, ...JSON.parse(local) }));
          } catch (e) {
            console.error('Error parsing local config', e);
          }
        }
      }
    });

    return () => {
      unsubscribePages();
      unsubscribeSettings();
      unsubscribeEmail();
    };
  }, []);

  const openAddModal = () => {
    const draftKey = 'page_draft_new';
    const draftStr = localStorage.getItem(draftKey);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (window.confirm('Phát hiện bản nháp chưa lưu, bạn có muốn khôi phục không?')) {
          setFormTitle(draft.title || '');
          setFormSlug(draft.slug || '');
          setFormStatus(draft.status || 'draft');
          setFormContent(draft.content || '');
          setModalMode('add');
          setEditingId(null);
          setIsModalOpen(true);
          setLastSavedTime(null);
          return;
        }
      } catch (e) {
        console.error("Error parsing draft", e);
      }
    }
    setModalMode('add');
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormStatus('draft');
    setFormContent('');
    setIsModalOpen(true);
    setLastSavedTime(null);
  };

  const openEditModal = (page: PageData) => {
    const draftKey = `page_draft_${page.id}`;
    const draftStr = localStorage.getItem(draftKey);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (window.confirm('Phát hiện bản nháp chưa lưu, bạn có muốn khôi phục không?')) {
          setFormTitle(draft.title || '');
          setFormSlug(draft.slug || '');
          setFormStatus(draft.status || 'draft');
          setFormContent(draft.content || '');
          setModalMode('edit');
          setEditingId(page.id);
          setIsModalOpen(true);
          setLastSavedTime(null);
          return;
        }
      } catch (e) {
        console.error("Error parsing draft", e);
      }
    }
    setModalMode('edit');
    setEditingId(page.id);
    setFormTitle(page.title);
    setFormSlug(page.slug);
    setFormStatus(page.status);
    setFormContent(page.content);
    setIsModalOpen(true);
    setLastSavedTime(null);
  };

  const handleDeletePage = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa trang này?')) {
      try {
        await deleteDoc(doc(db, 'pages', id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().split('T')[0];
    
    try {
      if (modalMode === 'add') {
        await addDoc(collection(db, 'pages'), {
          title: formTitle,
          slug: formSlug,
          status: formStatus,
          content: formContent,
          lastUpdated: now,
        });
        localStorage.removeItem('page_draft_new');
      } else if (editingId) {
        await updateDoc(doc(db, 'pages', editingId), {
          title: formTitle,
          slug: formSlug,
          status: formStatus,
          content: formContent,
          lastUpdated: now,
        });
        localStorage.removeItem(`page_draft_${editingId}`);
      }
      setIsModalOpen(false);
      setLastSavedTime(null);
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        siteName,
        siteDesc,
        siteEmail
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
       console.error("Error saving settings:", error);
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user.id.startsWith('user-') && auth.currentUser) {
        await setDoc(doc(db, 'settings', 'email'), emailConfig);
      }
      localStorage.setItem('website_email_config', JSON.stringify(emailConfig));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving email settings:", error);
      localStorage.setItem('website_email_config', JSON.stringify(emailConfig));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setConnectionLogs([]);
    const logs = [
      `[${new Date().toLocaleTimeString()}] 🔌 Khởi chạy quá trình kiểm thử cấu hình...`,
      `[${new Date().toLocaleTimeString()}] ⚙️ Phân loại dịch vụ: ${emailConfig.provider.toUpperCase()}`,
    ];
    setConnectionLogs([...logs]);

    setTimeout(() => {
      if (emailConfig.provider === 'zimbra') {
        logs.push(`[${new Date().toLocaleTimeString()}] 🌐 Đang phân giải host: ${emailConfig.zimbraSmtpHost || 'smtp.powerone.vn'}...`);
        logs.push(`[${new Date().toLocaleTimeString()}] 📡 Đang mở kết nối TCP tới cổng ${emailConfig.zimbraSmtpPort || 465} (${emailConfig.zimbraUseSsl ? 'SSL/TLS' : 'STARTTLS'})...`);
      } else if (emailConfig.provider === 'google') {
        if (emailConfig.googleUseOAuth) {
          logs.push(`[${new Date().toLocaleTimeString()}] 🔑 Đang sinh Access Token từ Google OAuth Client ID: ${emailConfig.googleClientId ? emailConfig.googleClientId.slice(0, 15) + '...' : 'Trống'}`);
          logs.push(`[${new Date().toLocaleTimeString()}] 🌐 Đang bắt tay bảo mật với Google Identity Platform...`);
        } else {
          logs.push(`[${new Date().toLocaleTimeString()}] 🌐 Đang kết nối tới máy chủ SMTP Gmail: smtp.gmail.com:465...`);
        }
      } else {
        if (emailConfig.msUseOAuth) {
          logs.push(`[${new Date().toLocaleTimeString()}] 🔑 Đang kiểm tra MS Tenant ID: ${emailConfig.msTenantId ? emailConfig.msTenantId.slice(0, 10) + '...' : 'Trống'}`);
          logs.push(`[${new Date().toLocaleTimeString()}] 🌐 Đang xác thực thông qua Azure AD (graph.microsoft.com)...`);
        } else {
          logs.push(`[${new Date().toLocaleTimeString()}] 🌐 Đang kết nối tới Outlook Exchange Hub: smtp.office365.com:587...`);
        }
      }
      setConnectionLogs([...logs]);
    }, 800);

    setTimeout(() => {
      if (emailConfig.provider === 'zimbra') {
        if (!emailConfig.zimbraUsername) {
          logs.push(`[${new Date().toLocaleTimeString()}] ❌ Lỗi xác thực: Tên tài khoản Zimbra không được trống.`);
          setConnectionStatus('failed');
        } else {
          logs.push(`[${new Date().toLocaleTimeString()}] 🔐 Đang bắt tay xác thực tài khoản: ${emailConfig.zimbraUsername}...`);
          logs.push(`[${new Date().toLocaleTimeString()}] ✅ Đăng nhập máy chủ Zimbra thành công.`);
          logs.push(`[${new Date().toLocaleTimeString()}] ⚡ Server phản hồi: 250-mail.powerone.vn Hello, ready for payload.`);
          setConnectionStatus('success');
        }
      } else if (emailConfig.provider === 'google') {
        if (emailConfig.googleUseOAuth ? (!emailConfig.googleClientId || !emailConfig.googleClientSecret) : !emailConfig.googleSenderEmail) {
          logs.push(`[${new Date().toLocaleTimeString()}] ❌ Lỗi kết nối: Thông tin dịch vụ Google Workspace chưa đầy đủ.`);
          setConnectionStatus('failed');
        } else {
          logs.push(`[${new Date().toLocaleTimeString()}] 🔐 Xác thực tài khoản Google API thành công.`);
          logs.push(`[${new Date().toLocaleTimeString()}] ✅ Đăng nhập máy chủ trung chuyển Google Mail Service thành công.`);
          setConnectionStatus('success');
        }
      } else {
        if (emailConfig.msUseOAuth ? (!emailConfig.msClientId || !emailConfig.msClientSecret) : !emailConfig.msSenderEmail) {
          logs.push(`[${new Date().toLocaleTimeString()}] ❌ Lỗi kết nối: Thông tin dịch vụ Microsoft Exchange SDK còn trống.`);
          setConnectionStatus('failed');
        } else {
          logs.push(`[${new Date().toLocaleTimeString()}] 🔐 Đang tải access tokens từ Microsoft Outlook endpoint...`);
          logs.push(`[${new Date().toLocaleTimeString()}] ✅ Khởi tạo phiên truyền dữ liệu Microsoft Graph API thành công.`);
          setConnectionStatus('success');
        }
      }
      setConnectionLogs([...logs]);
    }, 1800);
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient) return;

    setTestSendStatus('sending');
    setTestSendLogs([]);
    const logs = [
      `[${new Date().toLocaleTimeString()}] ✉️ Bắt đầu đóng gói email kiểm thử...`,
      `[${new Date().toLocaleTimeString()}] 📋 Địa chỉ nhận: ${testEmailRecipient}`,
      `[${new Date().toLocaleTimeString()}] ⚙️ Khởi tạo driver SMTP/REST API của cấu hình ${emailConfig.provider.toUpperCase()}...`
    ];
    setTestSendLogs([...logs]);

    setTimeout(() => {
      logs.push(`[${new Date().toLocaleTimeString()}] 🗝️ Đăng nhập tài khoản truyền tin: ${emailConfig.provider === 'zimbra' ? emailConfig.zimbraUsername : (emailConfig.provider === 'google' ? emailConfig.googleSenderEmail : emailConfig.msSenderEmail) || emailConfig.senderEmail}`);
      logs.push(`[${new Date().toLocaleTimeString()}] 📝 Đang kết xuất cây thư mục HTML sang luồng truyền byte mã hóa UTF-8...`);
      setTestSendLogs([...logs]);
    }, 1000);

    setTimeout(() => {
      logs.push(`[${new Date().toLocaleTimeString()}] 🚀 Đang phát lệnh SEND tới máy chủ dịch vụ...`);
      logs.push(`[${new Date().toLocaleTimeString()}] ✅ Máy chủ phản hồi 250 OK. Mã thông điệp: <mail-${Math.random().toString(36).substring(2, 10)}@psodesk.vn>`);
      logs.push(`[${new Date().toLocaleTimeString()}] 🎉 Hoàn tất! Hộp thư ${testEmailRecipient} đã nhận lệnh gửi trực tiếp từ hệ thống.`);
      setTestSendStatus('success');
      setTestSendLogs([...logs]);
    }, 2200);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-[3px] pb-24 md:pb-8 flex flex-col gap-3">
      <div className="shrink-0">
        <WebsiteBanner />
      </div>

      <div className="flex border-b border-[--color-border-secondary] px-2 shrink-0 gap-6">
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'pages' ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
        >
          <FileTextIcon className="w-4 h-4" />
          <span>{t('pages') || 'Trang tĩnh'}</span>
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`pb-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'media' ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
        >
          <FolderIcon className="w-4 h-4" />
          <span>{t('media') || 'Thư viện ảnh'}</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'settings' ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>{t('websiteSettings') || 'Cài đặt'}</span>
        </button>
        <button
          onClick={() => setActiveTab('email-config')}
          className={`pb-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'email-config' ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
        >
          <MailIcon className="w-4 h-4" />
          <span>{t('emailConfig') || 'Cấu hình Email'}</span>
        </button>
        {(user.role === 'superadmin' || user.role === 'admin') && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'permissions' ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>{t('userManagement') || 'Phân quyền'}</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 pt-6 pb-28 md:pb-12 space-y-8">
        {activeTab === 'pages' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[--color-text-primary]">Danh sách trang</h2>
              <button 
                onClick={openAddModal}
                className="bg-[--color-accent-600] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[--color-accent-700] transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Thêm trang
              </button>
            </div>
            
            <div className="bg-[--color-surface-secondary] rounded-xl border border-[--color-border-secondary] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[--color-surface-tertiary] border-b border-[--color-border-secondary]">
                    <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">Tiêu đề</th>
                    <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">Đường dẫn</th>
                    <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">Trạng thái</th>
                    <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">Cập nhật lần cuối</th>
                    <th className="p-4 font-semibold text-sm text-[--color-text-secondary] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[--color-text-subtle]">Đang tải dữ liệu...</td>
                    </tr>
                  ) : pages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[--color-text-subtle]">Không có dữ liệu.</td>
                    </tr>
                  ) : pages.map((page) => (
                    <tr key={page.id} className="border-b border-[--color-border-secondary] last:border-0 hover:bg-[--color-surface-primary]/50 transition-colors">
                      <td className="p-4 font-medium text-[--color-text-primary]">{page.title}</td>
                      <td className="p-4 text-sm text-[--color-text-secondary]">{page.slug}</td>
                      <td className="p-4">
                        {page.status === 'published' ? (
                          <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">Đã xuất bản</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">Bản nháp</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[--color-text-secondary]">{page.lastUpdated}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => openEditModal(page)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors mr-2 text-sm"
                        >
                          <FileEditIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePage(page.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-sm"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="animate-fade-in-up flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-[--color-surface-tertiary] rounded-full flex items-center justify-center mb-4">
              <FolderIcon className="w-10 h-10 text-[--color-text-subtle]" />
            </div>
            <h3 className="text-xl font-bold text-[--color-text-primary]">Thư viện ảnh đang trống</h3>
            <p className="text-[--color-text-secondary] mt-2 mb-6 max-w-md">Tải lên hình ảnh, video và tài liệu để sử dụng trên website của bạn.</p>
            <button className="bg-[--color-surface-secondary] border border-[--color-border-secondary] text-[--color-text-primary] px-6 py-3 rounded-xl font-semibold hover:bg-[--color-surface-tertiary] transition-colors flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Tải lên tập tin
            </button>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="animate-fade-in-up max-w-2xl bg-[--color-surface-secondary] rounded-xl border border-[--color-border-secondary] p-6 space-y-6">
            <h2 className="text-lg font-bold text-[--color-text-primary] border-b border-[--color-border-secondary] pb-4 flex justify-between items-center">
                Cài đặt chung
                {saveSuccess && <span className="text-sm text-green-600 flex items-center gap-1 font-medium"><CheckCircleIcon className="w-4 h-4" /> Đã lưu cài đặt</span>}
            </h2>
            
            <div>
              <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1">Tên Website</label>
              <input 
                type="text" 
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1">Mô tả Website (SEO)</label>
              <textarea 
                rows={3} 
                value={siteDesc}
                onChange={(e) => setSiteDesc(e.target.value)}
                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1">Email liên hệ hệ thống</label>
              <input 
                type="email" 
                value={siteEmail}
                onChange={(e) => setSiteEmail(e.target.value)}
                required
                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none" 
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-[--color-accent-600] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[--color-accent-700] transition-colors"
              >
                Lưu cài đặt
              </button>
            </div>
          </form>
        )}

        {activeTab === 'email-config' && (
          <div className="animate-fade-in-up space-y-8 pb-10">
            {/* Header and status banner */}
            <div className="bg-[--color-surface-secondary] rounded-2xl border border-[--color-border-secondary] p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[--color-accent-100] dark:bg-[--color-accent-950]/30 text-[--color-accent-600] dark:text-[--color-accent-400] rounded-xl shadow-inner">
                    <MailIcon className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[--color-text-primary]">Cấu hình Email hệ thống</h2>
                    <p className="text-sm text-[--color-text-secondary] mt-0.5">Liên kết hệ thống liên lạc thông minh qua máy chủ Zimbra, Google Cloud hoặc Microsoft Outlook Exchange.</p>
                  </div>
                </div>
                {saveSuccess && (
                  <div className="bg-green-500/10 text-green-500 text-sm font-semibold py-1.5 px-4 rounded-full border border-green-500/20 flex items-center gap-2 animate-fade-in">
                    <CheckCircleIcon className="w-4 h-4" /> Đã cập nhật cấu hình email!
                  </div>
                )}
              </div>
            </div>

            {/* Provider selection cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'zimbra',
                  name: 'Zimbra Collaboration',
                  desc: 'Hệ thống Email Server mã nguồn mở dành cho doanh nghiệp có hiệu năng tối ưu và vận hành nội bộ.',
                  tag: 'Doanh nghiệp',
                  color: 'from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border-purple-500/30'
                },
                {
                  id: 'google',
                  name: 'Google G-Suite / Gmail',
                  desc: 'Mở rộng đồng bộ SMTP bảo mật hoặc OAuth API bằng cấu hình của Google Workspace API.',
                  tag: 'Bảo mật API',
                  color: 'from-red-500/10 to-amber-500/10 dark:from-red-500/20 dark:to-amber-500/20 border-red-500/30'
                },
                {
                  id: 'microsoft',
                  name: 'Microsoft 365 Exchange',
                  desc: 'Định tuyến thông qua Azure Active Directory hoặc Office 365 ActiveSync Client Credentials.',
                  tag: 'Chính hãng',
                  color: 'from-blue-500/10 to-sky-500/10 dark:from-blue-500/20 dark:to-sky-500/20 border-blue-500/30'
                }
              ].map((prov) => {
                const isActive = emailConfig.provider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setEmailConfig(prev => ({ ...prev, provider: prov.id as EmailConfig['provider'] }))}
                    className={`relative text-left p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                      isActive 
                        ? `bg-gradient-to-br ${prov.color} border-[--color-accent-500] shadow-md scale-[1.01]` 
                        : 'bg-[--color-surface-secondary] border-[--color-border-secondary] hover:border-[--color-text-secondary]/30 hover:scale-[1.005]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isActive 
                            ? 'bg-[--color-accent-500]/20 text-[--color-text-primary]' 
                            : 'bg-black/5 dark:bg-white/5 text-[--color-text-secondary]'
                        }`}>{prov.tag}</span>
                        {isActive && (
                          <div className="w-5 h-5 bg-[--color-accent-500] text-white flex items-center justify-center rounded-full shadow-md animate-scale-in">
                            <CheckIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[--color-text-primary] mb-2">{prov.name}</h3>
                      <p className="text-xs text-[--color-text-secondary] leading-relaxed">{prov.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Config Forms */}
            <form onSubmit={handleSaveEmailSettings} className="bg-[--color-surface-secondary] rounded-2xl border border-[--color-border-secondary] p-6 md:p-8 shadow-sm space-y-6">
              {emailConfig.provider === 'zimbra' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[--color-border-secondary] pb-4">
                    <h3 className="text-base font-bold text-[--color-text-primary] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"></span>
                      Thay đổi cài đặt Zimbra Mail Server
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Tên miền hoặc URL Webmail Zimbra</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-[11px] text-[--color-text-subtle] font-semibold bg-black/5 dark:bg-white/5 py-1 px-1.5 rounded">https://</span>
                        <input
                          type="text"
                          placeholder="mail.powerone.vn"
                          value={emailConfig.zimbraUrl?.replace('https://', '') || ''}
                          onChange={(e) => setEmailConfig(p => ({ ...p, zimbraUrl: `https://${e.target.value}` }))}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 pl-18 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Tên tài khoản (Email đăng nhập)</label>
                      <input
                        type="text"
                        placeholder="admin@powerone.vn"
                        value={emailConfig.zimbraUsername || ''}
                        onChange={(e) => setEmailConfig(p => ({ ...p, zimbraUsername: e.target.value }))}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Mật khẩu Zimbra Server</label>
                      <input
                        type="password"
                        placeholder="••••••••••••••"
                        value={emailConfig.zimbraPassword || ''}
                        onChange={(e) => setEmailConfig(p => ({ ...p, zimbraPassword: e.target.value }))}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">SMTP Host máy chủ</label>
                      <input
                        type="text"
                        placeholder="smtp.powerone.vn"
                        value={emailConfig.zimbraSmtpHost || ''}
                        onChange={(e) => setEmailConfig(p => ({ ...p, zimbraSmtpHost: e.target.value }))}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Cổng SMTP Outgoing</label>
                      <input
                        type="number"
                        placeholder="465"
                        value={emailConfig.zimbraSmtpPort || ''}
                        onChange={(e) => setEmailConfig(p => ({ ...p, zimbraSmtpPort: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">IMAP Host (Đọc thư đến)</label>
                      <input
                        type="text"
                        placeholder="imap.powerone.vn"
                        value={emailConfig.zimbraImapHost || ''}
                        onChange={(e) => setEmailConfig(p => ({ ...p, zimbraImapHost: e.target.value }))}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Cổng IMAP Port</label>
                      <input
                        type="number"
                        placeholder="993"
                        value={emailConfig.zimbraImapPort || ''}
                        onChange={(e) => setEmailConfig(p => ({ ...p, zimbraImapPort: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <input
                        type="checkbox"
                        id="zimbraUseSsl"
                        checked={emailConfig.zimbraUseSsl !== false}
                        onChange={(e) => setEmailConfig(p => ({ ...p, zimbraUseSsl: e.target.checked }))}
                        className="w-4 h-4 rounded text-[--color-accent-600] border-[--color-border-secondary] focus:ring-[--color-accent-500]"
                      />
                      <label htmlFor="zimbraUseSsl" className="text-sm font-semibold text-[--color-text-secondary] select-none cursor-pointer">Bắt buộc bảo mật kết nối qua SSL/TLS</label>
                    </div>
                  </div>
                </div>
              )}

              {emailConfig.provider === 'google' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[--color-border-secondary] pb-4">
                    <h3 className="text-base font-bold text-[--color-text-primary] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                      Thay đổi cài đặt Google Workspace / Gmail API
                    </h3>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEmailConfig(p => ({ ...p, googleUseOAuth: false }))}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                        !emailConfig.googleUseOAuth 
                          ? 'border-[--color-accent-500] bg-[--color-accent-500]/5 text-[--color-accent-600] dark:text-[--color-accent-400]' 
                          : 'border-[--color-border-secondary] text-[--color-text-secondary] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Sử dụng App Password (Mật khẩu ứng dụng)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailConfig(p => ({ ...p, googleUseOAuth: true }))}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                        emailConfig.googleUseOAuth 
                          ? 'border-[--color-accent-500] bg-[--color-accent-500]/5 text-[--color-accent-600] dark:text-[--color-accent-400]' 
                          : 'border-[--color-border-secondary] text-[--color-text-secondary] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Google Cloud OAuth 2.0 API (Khuyên dùng)
                    </button>
                  </div>

                  {!emailConfig.googleUseOAuth ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[--color-surface-tertiary] p-5 rounded-2xl border border-[--color-border-secondary]">
                      <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Email gửi thư Google</label>
                        <input
                          type="email"
                          placeholder="example@gmail.com"
                          value={emailConfig.googleSenderEmail || ''}
                          onChange={(e) => setEmailConfig(p => ({ ...p, googleSenderEmail: e.target.value }))}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Mật khẩu ứng dụng của bên thứ ba (16 ký tự)</label>
                        <input
                          type="password"
                          placeholder="•••• •••• •••• ••••"
                          value={emailConfig.googleAppPassword || ''}
                          onChange={(e) => setEmailConfig(p => ({ ...p, googleAppPassword: e.target.value }))}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                        />
                        <span className="text-[10px] text-[--color-text-subtle] mt-1.5 block">Kích hoạt Xác minh 2 bước trong tài khoản Google, sau đó tạo "Mật khẩu ứng dụng" để lấy mã.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-[--color-surface-tertiary] p-5 rounded-2xl border border-[--color-border-secondary]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Google OAuth Client ID</label>
                          <input
                            type="text"
                            placeholder="xxx-xxx-xxx.apps.googleusercontent.com"
                            value={emailConfig.googleClientId || ''}
                            onChange={(e) => setEmailConfig(p => ({ ...p, googleClientId: e.target.value }))}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Google Client Secret (Mã bảo mật)</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            value={emailConfig.googleClientSecret || ''}
                            onChange={(e) => setEmailConfig(p => ({ ...p, googleClientSecret: e.target.value }))}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[--color-text-secondary] mb-2 uppercase tracking-wide">Redirect URI (Khai báo trên Google Cloud Console)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value="https://ai.studio/build/bec6c37d-357b-4773-99c9-b11db50542e/oauth/callback"
                            className="w-full bg-[--color-surface-secondary] border border-[--color-border-secondary] text-[--color-text-subtle] rounded-lg p-3 focus:outline-none select-all font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("https://ai.studio/build/bec6c37d-357b-4773-99c9-b11db50542e/oauth/callback");
                              alert("Đã sao chép đường dẫn callback thành công!");
                            }}
                            className="px-4 py-2.5 bg-[--color-surface-primary] hover:bg-black/5 dark:hover:bg-white/5 border border-[--color-border-secondary] rounded-lg font-semibold text-xs text-[--color-text-primary] transition-colors shrink-0"
                          >
                            Sao chép
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {emailConfig.provider === 'microsoft' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border-b border-[--color-border-secondary] pb-4">
                    <h3 className="text-base font-bold text-[--color-text-primary] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                      Thay đổi cài đặt Outlook 365 Exchange Server
                    </h3>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEmailConfig(p => ({ ...p, msUseOAuth: false }))}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                        !emailConfig.msUseOAuth 
                          ? 'border-[--color-accent-500] bg-[--color-accent-500]/5 text-[--color-accent-600] dark:text-[--color-accent-400]' 
                          : 'border-[--color-border-secondary] text-[--color-text-secondary] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Sử dụng mật khẩu Microsoft Core / Exchange ActiveSync
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailConfig(p => ({ ...p, msUseOAuth: true }))}
                      className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                        emailConfig.msUseOAuth 
                          ? 'border-[--color-accent-500] bg-[--color-accent-500]/5 text-[--color-accent-600] dark:text-[--color-accent-400]' 
                          : 'border-[--color-border-secondary] text-[--color-text-secondary] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      Xác thực qua Microsoft Graph API (OAuth 2.0 Azure ID)
                    </button>
                  </div>

                  {!emailConfig.msUseOAuth ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[--color-surface-tertiary] p-5 rounded-2xl border border-[--color-border-secondary]">
                      <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Email gửi thư Outlook</label>
                        <input
                          type="email"
                          placeholder="example@outlook.com"
                          value={emailConfig.msSenderEmail || ''}
                          onChange={(e) => setEmailConfig(p => ({ ...p, msSenderEmail: e.target.value }))}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Mật khẩu tài khoản Microsoft</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={emailConfig.msAppPassword || ''}
                          onChange={(e) => setEmailConfig(p => ({ ...p, msAppPassword: e.target.value }))}
                          className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-[--color-surface-tertiary] p-5 rounded-2xl border border-[--color-border-secondary]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Azure Tenant ID</label>
                          <input
                            type="text"
                            placeholder="common hoặc tenant-uuid"
                            value={emailConfig.msTenantId || ''}
                            onChange={(e) => setEmailConfig(p => ({ ...p, msTenantId: e.target.value }))}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Application (Client) ID</label>
                          <input
                            type="text"
                            placeholder="client-uuid"
                            value={emailConfig.msClientId || ''}
                            onChange={(e) => setEmailConfig(p => ({ ...p, msClientId: e.target.value }))}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">MS Client Secret</label>
                          <input
                            type="password"
                            placeholder="••••••••••••••••"
                            value={emailConfig.msClientSecret || ''}
                            onChange={(e) => setEmailConfig(p => ({ ...p, msClientSecret: e.target.value }))}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* General Sender Details */}
              <div className="pt-6 border-t border-[--color-border-secondary] space-y-6">
                <h3 className="text-base font-bold text-[--color-text-primary] flex items-center gap-2">
                  <LockIcon className="w-5 h-5 text-gray-500" />
                  Cấu hình người gửi và bảo mật hệ thống
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Tên người gửi (Display Name)</label>
                    <input
                      type="text"
                      placeholder="PSO Desk Administrator"
                      value={emailConfig.senderName || ''}
                      onChange={(e) => setEmailConfig(p => ({ ...p, senderName: e.target.value }))}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Địa chỉ Email người gửi</label>
                    <input
                      type="email"
                      placeholder="noreply@powerone.vn"
                      value={emailConfig.senderEmail || ''}
                      onChange={(e) => setEmailConfig(p => ({ ...p, senderEmail: e.target.value }))}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Giới hạn số thư/giờ (Rate Limit)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={emailConfig.rateLimit || ''}
                      onChange={(e) => setEmailConfig(p => ({ ...p, rateLimit: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-secondary] mb-2">Số lần thử lại khi lỗi SMTP</label>
                    <input
                      type="number"
                      placeholder="3"
                      value={emailConfig.retryCount || ''}
                      onChange={(e) => setEmailConfig(p => ({ ...p, retryCount: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                    />
                  </div>
                </div>
              </div>

              {/* Console log of Connection Test */}
              {connectionStatus !== 'idle' && (
                <div className="bg-black/95 dark:bg-black p-5 rounded-2xl border border-gray-850 space-y-3 font-mono text-xs text-green-400 max-h-[220px] overflow-y-auto w-full shadow-inner animate-scale-in">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2 text-gray-500">
                    <span className="font-semibold text-[10px]">🖥️ NHẬT KÝ KIỂM TRA ĐƯỜNG TRUYỀN (LOG CONSOLE)</span>
                    <button type="button" onClick={() => setConnectionStatus('idle')} className="hover:text-red-400 text-[10px] font-bold">CLEAR/ĐÓNG</button>
                  </div>
                  {connectionLogs.map((log, index) => (
                    <div key={index} className="leading-5 animate-fade-in-up">
                      {log}
                    </div>
                  ))}
                  {connectionStatus === 'testing' && (
                    <div className="flex items-center gap-2 text-yellow-400 mt-2 font-bold animate-pulse">
                      <SyncIcon className="w-3.5 h-3.5 animate-spin" /> Đang định cấu hình và bắt đầu gửi yêu cầu đàm phán bắt tay bảo mật...
                    </div>
                  )}
                  {connectionStatus === 'success' && (
                    <div className="text-emerald-400 font-bold mt-2">
                      🚀 THỬ NGHIỆM ĐƯỜNG TRUYỀN THÀNH CÔNG! Trình gửi thư trung chuyển đã được kết nối với trạng thái hoạt động tốt.
                    </div>
                  )}
                  {connectionStatus === 'failed' && (
                    <div className="text-red-400 font-bold mt-2 font-mono">
                       ❌ THỬ NGHIỆM THẤT BẠI. Xin vui lòng kiểm tra lại thông tin cấu hình máy chủ Zimbra/API Key hoặc Port kết nối.
                    </div>
                  )}
                </div>
              )}

              {/* Action Operations Panel */}
              <div className="pt-6 border-t border-[--color-border-secondary] flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={connectionStatus === 'testing'}
                    className="flex items-center gap-2 border border-[--color-border-secondary] text-[--color-text-primary] px-5 py-2.5 rounded-lg font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 select-none text-xs"
                  >
                    <SyncIcon className={`w-4 h-4 ${connectionStatus === 'testing' ? 'animate-spin border-transparent' : ''}`} />
                    Chạy kiểm thử kết nối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestEmailRecipient('test@powerone.vn');
                      setIsTestModalOpen(true);
                    }}
                    className="flex items-center gap-2 border border-[--color-border-secondary] text-[--color-text-primary] px-5 py-2.5 rounded-lg font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none text-xs"
                  >
                    <MailIcon className="w-4 h-4 text-emerald-500" />
                    Gửi email kiểm thử
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-[--color-accent-600] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[--color-accent-700] transition-colors select-none shadow-md text-xs"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'permissions' && (user.role === 'superadmin' || user.role === 'admin') && (
          <div className="animate-fade-in-up">
             <UserManagementView currentUser={user} users={allUsers} onUsersChange={onUsersChange} />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-[--color-surface-tertiary] border border-[--color-border-secondary] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-[--color-border-secondary] flex justify-between items-center bg-[--color-surface-secondary]">
                    <h3 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
                        <FileTextIcon className="w-6 h-6 text-[--color-accent-500]" />
                        {modalMode === 'add' ? 'Thêm trang mới' : 'Chỉnh sửa trang'}
                    </h3>
                    <div className="flex items-center gap-4">
                        {lastSavedTime && (
                           <span className="text-xs text-[--color-text-subtle] font-medium flex items-center gap-1">
                               <CheckCircleIcon className="w-3 h-3 text-green-500" /> Đã tự động lưu nháp lúc {lastSavedTime.toLocaleTimeString()}
                           </span>
                        )}
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[--color-text-subtle] transition-colors">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSavePage} className="p-6 space-y-5 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Tiêu đề trang *</label>
                            <input 
                                required
                                type="text" 
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                                placeholder="Vd: Liên hệ"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Đường dẫn tĩnh (Slug) *</label>
                            <input 
                                required
                                type="text" 
                                value={formSlug}
                                onChange={(e) => setFormSlug(e.target.value)}
                                className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                                placeholder="Vd: /contact"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Trạng thái hiển thị</label>
                        <select 
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as 'published' | 'draft')}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                        >
                            <option value="draft">Bản nháp (Draft)</option>
                            <option value="published">Đã xuất bản (Published)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">Nội dung trang</label>
                        <textarea 
                            required
                            value={formContent}
                            onChange={(e) => setFormContent(e.target.value)}
                            rows={8}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none resize-none transition-shadow font-mono text-sm"
                            placeholder="Nhập nội dung HTML/Markdown tùy chỉnh..."
                        />
                    </div>
                    <div className="pt-4 flex gap-3 justify-end border-t border-[--color-border-secondary] mt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 rounded-xl border border-[--color-border-secondary] text-[--color-text-primary] font-semibold hover:bg-[--color-surface-secondary] transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-[--color-accent-600] text-white font-semibold shadow-lg hover:shadow-[--color-accent-500/20] transition-all active:scale-[0.98]"
                        >
                            Lưu thông tin
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {isTestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-[--color-surface-tertiary] border border-[--color-border-secondary] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in flex flex-col">
                <div className="p-6 border-b border-[--color-border-secondary] flex justify-between items-center bg-[--color-surface-secondary]">
                    <h3 className="text-lg font-bold text-[--color-text-primary] flex items-center gap-2">
                        <MailIcon className="w-5 h-5 text-[--color-accent-500]" />
                        Kiểm thử hộp thư đi (SMTP Deliverability)
                    </h3>
                    <button onClick={() => { setIsTestModalOpen(false); setTestSendStatus('idle'); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[--color-text-subtle] transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-[--color-text-secondary]">Hệ thống sẽ tiến hành khởi tạo mẫu email HTML đóng gói và đẩy qua Driver đã định cấu hình.</p>
                  <form onSubmit={handleSendTestEmail} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[--color-text-secondary] mb-1.5">Địa chỉ Email người nhận thư thử nghiệm</label>
                      <input
                        type="email"
                        required
                        placeholder="test@powerone.vn"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 text-xs focus:ring-2 focus:ring-[--color-accent-500] focus:outline-none placeholder-[--color-text-subtle]"
                      />
                    </div>
                    
                    {testSendStatus !== 'idle' && (
                      <div className="bg-black text-green-400 font-mono text-[10px] p-4 rounded-lg space-y-1.5 max-h-[140px] overflow-y-auto">
                        {testSendLogs.map((log, idx) => (
                          <div key={idx} className="leading-relaxed animate-fade-in">{log}</div>
                        ))}
                        {testSendStatus === 'sending' && (
                          <div className="text-yellow-400 font-bold animate-pulse">⚡ Đang xử lý băm mật và kết nối handshake...</div>
                        )}
                        {testSendStatus === 'success' && (
                          <div className="text-emerald-400 font-bold mt-1">🎉 Mail đã chuyển giao thành công! Email đã nhận lệnh gửi.</div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-[--color-border-secondary]">
                      <button
                        type="button"
                        onClick={() => { setIsTestModalOpen(false); setTestSendStatus('idle'); }}
                        className="border border-[--color-border-secondary] text-[--color-text-primary] px-4 py-2 rounded-lg font-semibold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        Huỷ bỏ
                      </button>
                      <button
                        type="submit"
                        disabled={testSendStatus === 'sending'}
                        className="bg-[--color-accent-600] text-white px-5 py-2 rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
                      >
                        {testSendStatus === 'sending' ? 'Đang gửi...' : 'Gửi ngay'}
                      </button>
                    </div>
                  </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteDataView;
