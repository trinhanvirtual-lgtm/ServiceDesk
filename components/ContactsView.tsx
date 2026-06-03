import React, { useState, useMemo, useRef } from 'react';
import { User, RecentItem, View } from '../App';
import ContactsBanner from './ContactsBanner';
import ContactCard, { Contact } from './ContactCard';
import { UsersIcon, GoogleIcon, SearchIcon, GridIcon, ListIcon, SitemapIcon, UserPlusIcon, UploadIcon, DownloadIcon, ChatIcon, XIcon, MailIcon } from './icons';
import { useLanguage } from './LanguageContext';
import CreateContactModal from './CreateContactModal';
import OrgChartView from './OrgChartView';

// MOCK DATA
export const initialContacts: Contact[] = [
    { id: '1', name: 'Trần Văn An', title: 'Giám đốc Điều hành (CEO)', email: 'an.tran@company.com', phone: '090-111-2222', avatar: 'https://i.pravatar.cc/150?u=1', department: 'Ban Giám đốc', managerId: null, type: 'directory' },
    { id: '2', name: 'Lê Thị Bình', title: 'Giám đốc Công nghệ (CTO)', email: 'binh.le@company.com', phone: '090-222-3333', avatar: 'https://i.pravatar.cc/150?u=2', department: 'Công nghệ', managerId: '1', type: 'directory' },
    { id: '3', name: 'Phạm Minh Cường', title: 'Trưởng phòng Phát triển', email: 'cuong.pham@company.com', phone: '090-333-4444', avatar: 'https://i.pravatar.cc/150?u=3', department: 'Công nghệ', managerId: '2', type: 'directory' },
    { id: '4', name: 'Vũ Thị Dung', title: 'Lập trình viên Senior', email: 'dung.vu@company.com', phone: '090-444-5555', avatar: 'https://i.pravatar.cc/150?u=4', department: 'Công nghệ', managerId: '3', type: 'directory' },
    { id: '5', name: 'Hoàng Văn Em', title: 'Giám đốc Marketing (CMO)', email: 'em.hoang@company.com', phone: '090-555-6666', avatar: 'https://i.pravatar.cc/150?u=5', department: 'Marketing', managerId: '1', type: 'directory' },
    { id: '6', name: 'Nguyễn Thị Hoa', title: 'Chuyên viên Marketing', email: 'hoa.nguyen@company.com', phone: '090-666-7777', avatar: 'https://i.pravatar.cc/150?u=6', department: 'Marketing', managerId: '5', type: 'directory' },
    { id: '7', name: 'Đối tác Acme Inc.', title: 'Đối tác kinh doanh', email: 'contact@acme.com', phone: '028-123-4567', avatar: 'AI', department: 'Đối tác', managerId: null, type: 'personal' },
    { id: '8', name: 'Hung Thai', title: 'Quản trị viên cấp cao', email: 'hungthai84@gmail.com', phone: '091-234-5678', avatar: 'https://i.pravatar.cc/150?u=8', department: 'Quản trị hệ thống', managerId: '1', type: 'directory' },
];

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

interface ContactsViewProps {
  user: User;
  onItemViewed: (item: RecentItem) => void;
  onNavigate?: (view: View) => void;
}

const ContactsView: React.FC<ContactsViewProps> = ({ onItemViewed, onNavigate }) => {
    const [view, setView] = useState<'card' | 'list' | 'org'>('card');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const departmentsList = useMemo(() => {
        const depts = new Set<string>();
        contacts.forEach(c => {
            if (c.department) depts.add(c.department);
        });
        return Array.from(depts);
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => {
            const matchesSearch = 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.department.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesDept = 
                selectedDept === 'all' || 
                c.department === selectedDept;

            return matchesSearch && matchesDept;
        });
    }, [searchTerm, selectedDept, contacts]);
        
    const handleSaveContact = (newContact: Contact) => {
        setContacts(prevContacts => [newContact, ...prevContacts]);
        setCreateModalOpen(false);
    };

    const handleExportCSV = () => {
        const headers = ['id', 'name', 'title', 'email', 'phone', 'avatar', 'department', 'managerId', 'type'];
        const csvRows = [
            headers.join(','),
            ...filteredContacts.map(contact => {
                const values = headers.map(header => {
                    const value = contact[header as keyof Contact] || '';
                    const escaped = ('' + value).replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                return values.join(',');
            })
        ];
        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'contacts.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // In a real app, you would parse the CSV file here.
            alert(`Importing ${file.name}... (This is a demo and won't actually import data).`);
            // Reset file input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleContactView = (contact: Contact) => {
        onItemViewed({
            id: `contact-${contact.id}`,
            name: contact.name,
            type: 'contacts',
            icon: <UsersIcon />,
            itemId: contact.id,
        });
        setSelectedContact(contact);
    };


    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
            {isCreateModalOpen && <CreateContactModal onClose={() => setCreateModalOpen(false)} onSave={handleSaveContact} />}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                <ContactsBanner />
                <div className="flex-1 rounded-xl overflow-hidden flex min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    {/* Right Pane (Now takes full width because Left Menu is removed) */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-col lg:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full sm:max-w-xl">
                                <div className="relative flex-1 w-full">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder={t('searchContactsPlaceholder') || "Tìm kiếm danh bạ..."}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 rounded-lg py-2 pl-10 pr-4 transition-all"
                                    />
                                </div>
                                <select
                                    value={selectedDept}
                                    onChange={e => setSelectedDept(e.target.value)}
                                    className="w-full sm:w-56 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-xs rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="all">Tất cả phòng ban</option>
                                    {departmentsList.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg flex items-center text-sm font-semibold">
                                    <button onClick={() => setView('card')} className={`p-2 rounded-md ${view === 'card' ? 'bg-white dark:bg-slate-900 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`} title="Card View"><GridIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-white dark:bg-slate-900 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`} title="List View"><ListIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setView('org')} className={`p-2 rounded-md ${view === 'org' ? 'bg-white dark:bg-slate-900 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`} title="Org Chart View"><SitemapIcon className="w-5 h-5" /></button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                                <button
                                    onClick={handleImportClick}
                                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    title={t('importContacts')}
                                >
                                    <UploadIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
                                    title={t('exportContacts')}
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm"
                                    title={t('createContact')}
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6 no-scrollbar">
                            {view === 'card' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredContacts.map(c => <div key={c.id} onClick={() => handleContactView(c)} className="cursor-pointer"><ContactCard contact={c} onChatClick={(e) => {
                                        e.stopPropagation();
                                        if (onNavigate) onNavigate('chat');
                                    }} /></div>)}
                                </div>
                            )}
                            {view === 'list' && (
                                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Chức vụ</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Email</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Số điện thoại</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {filteredContacts.map((c) => (
                                                <tr key={c.id} onClick={() => handleContactView(c)} className={`hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer group transition-colors duration-150`}>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0">{c.avatar.length > 2 && c.avatar.startsWith('http') ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-full" /> : getInitials(c.name)}</div>
                                                            <div className="flex items-center gap-1.5">
                                                              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                                  {c.name}
                                                                  <button 
                                                                    onClick={(e) => { e.stopPropagation(); if(onNavigate) onNavigate('chat'); }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all"
                                                                    title="Trò chuyện"
                                                                  >
                                                                    <ChatIcon className="w-3.5 h-3.5" />
                                                                  </button>
                                                              </span>
                                                              {c.source === 'google' && <GoogleIcon className="w-3.5 h-3.5" title="From Google Contacts"/>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">{c.title}</td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">{c.email}</td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">{c.phone}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {view === 'org' && (
                                <OrgChartView />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* DETAILS MODAL (POPUP) */}
            {selectedContact && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in-up">
                    <div className="bg-[#f4f0f7] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="relative pt-6 px-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <div className="absolute top-4 right-4 z-20">
                                <button 
                                    onClick={() => setSelectedContact(null)} 
                                    className="text-slate-400 hover:text-slate-700 hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-2 transition-all"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-4 pr-10">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden bg-purple-500 shrink-0 flex items-center justify-center">
                                    {selectedContact.avatar && selectedContact.avatar.startsWith('http') ? (
                                        <img 
                                            src={selectedContact.avatar} 
                                            alt={selectedContact.name} 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <span className="text-white font-bold text-2xl">{getInitials(selectedContact.name)}</span>
                                    )}
                                </div>
                                
                                <div className="min-w-0">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate">
                                        {selectedContact.name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2.5 py-0.5 rounded-full font-bold">
                                            {selectedContact.title || "Nhân viên"}
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <SitemapIcon className="w-3.5 h-3.5 text-slate-400" />
                                            {selectedContact.department || "Chưa phân bổ"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="space-y-4 text-left">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 shadow-sm">
                                        <div className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                            <MailIcon className="w-3 h-3" />
                                            EMAIL LIÊN HỆ
                                        </div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate font-mono" title={selectedContact.email || 'Chưa thiết lập'}>
                                            <a href={`mailto:${selectedContact.email}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors uppercase tracking-wider">{selectedContact.email || 'Chưa thiết lập'}</a>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 shadow-sm">
                                        <div className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                            SỐ ĐIỆN THOẠI
                                        </div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono tracking-wider">
                                            {selectedContact.phone || 'Chưa thiết lập'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button 
                                        onClick={() => {
                                            setSelectedContact(null);
                                            if (onNavigate) onNavigate('chat');
                                        }}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        <ChatIcon className="w-4 h-4" />
                                        Nhắn tin
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ContactsView;