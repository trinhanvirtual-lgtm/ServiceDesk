import React, { useState, useMemo, useRef } from 'react';
import { User, RecentItem } from '../App';
import ContactsBanner from './ContactsBanner';
import ContactCard, { Contact } from './ContactCard';
import { UsersIcon, GoogleIcon, SearchIcon, GridIcon, ListIcon, SitemapIcon, UserPlusIcon, UploadIcon, DownloadIcon } from './icons';
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
}

const ContactsView: React.FC<ContactsViewProps> = ({ onItemViewed }) => {
    const [view, setView] = useState<'card' | 'list' | 'org'>('card');
    const [searchTerm, setSearchTerm] = useState('');
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const filteredContacts = useMemo(() =>
        contacts.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.department.toLowerCase().includes(searchTerm.toLowerCase())
        ), [searchTerm, contacts]);
        
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
        // The current app does not have a detailed contact view, so nothing else to do.
    };


    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
            {isCreateModalOpen && <CreateContactModal onClose={() => setCreateModalOpen(false)} onSave={handleSaveContact} />}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                <ContactsBanner />
                <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex min-h-0">
                    {/* Left Pane */}
                    <div className="w-full sm:w-1/4 sm:max-w-[280px] border-r border-white/50 flex-col hidden sm:flex">
                        <div className="p-4 border-b border-white/50 shrink-0">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Danh bạ</h2>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                            <button onClick={() => setView('card')} className={`w-full text-left px-4 py-2.5 rounded-lg font-semibold flex items-center gap-3 transition-colors ${(view === 'card' || view === 'list') ? 'bg-white/80 text-purple-700' : 'text-slate-600 hover:bg-white/50'}`}>
                                <UsersIcon className="w-5 h-5" /><span>{t('allContacts')}</span>
                            </button>
                            <button onClick={() => setView('org')} className={`w-full text-left px-4 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${view === 'org' ? 'bg-white/80 text-purple-700' : 'text-slate-600 hover:bg-white/50'}`}>
                                <SitemapIcon className="w-5 h-5" /><span>{t('orgChart')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Pane */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="p-4 border-b border-white/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative flex-1 w-full sm:max-w-lg">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={t('searchContactsPlaceholder')}
                                    className="w-full bg-white/60 border border-slate-300/60 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder-slate-500 text-slate-800 rounded-lg py-2 pl-10 pr-4 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-white/50 p-1 rounded-lg flex items-center text-sm font-semibold">
                                    <button onClick={() => setView('card')} className={`p-2 rounded-md ${view === 'card' ? 'bg-white shadow text-purple-600' : 'text-slate-600 hover:bg-white/50'}`} title="Card View"><GridIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-white shadow text-purple-600' : 'text-slate-600 hover:bg-white/50'}`} title="List View"><ListIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setView('org')} className={`p-2 rounded-md ${view === 'org' ? 'bg-white shadow text-purple-600' : 'text-slate-600 hover:bg-white/50'}`} title="Org Chart View"><SitemapIcon className="w-5 h-5" /></button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                                <button
                                    onClick={handleImportClick}
                                    className="p-3 rounded-lg bg-white/70 text-slate-600 shadow-md hover:bg-white transition-all transform hover:scale-105"
                                    title={t('importContacts')}
                                >
                                    <UploadIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="p-3 rounded-lg bg-white/70 text-slate-600 shadow-md hover:bg-white transition-all transform hover:scale-105"
                                    title={t('exportContacts')}
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                                    title={t('createContact')}
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6 no-scrollbar">
                            {view === 'card' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredContacts.map(c => <div key={c.id} onClick={() => handleContactView(c)} className="cursor-pointer"><ContactCard contact={c} /></div>)}
                                </div>
                            )}
                            {view === 'list' && (
                                <div className="bg-white/60 rounded-xl shadow-md overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="border-b border-white/80">
                                            <tr>
                                                <th className="p-3 font-semibold text-slate-700">Tên</th>
                                                <th className="p-3 font-semibold text-slate-700 hidden md:table-cell">Chức vụ</th>
                                                <th className="p-3 font-semibold text-slate-700 hidden lg:table-cell">Email</th>
                                                <th className="p-3 font-semibold text-slate-700 hidden sm:table-cell">Số điện thoại</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredContacts.map((c) => (
                                                <tr key={c.id} onClick={() => handleContactView(c)} className={`border-t border-slate-200/60 hover:bg-white/30 cursor-pointer`}>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0">{c.avatar.length > 2 && c.avatar.startsWith('http') ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-full" /> : getInitials(c.name)}</div>
                                                            <div className="flex items-center gap-1.5">
                                                              <span className="font-semibold text-slate-800">{c.name}</span>
                                                              {c.source === 'google' && <GoogleIcon className="w-3.5 h-3.5" title="From Google Contacts"/>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-slate-600 hidden md:table-cell">{c.title}</td>
                                                    <td className="p-3 text-slate-600 hidden lg:table-cell">{c.email}</td>
                                                    <td className="p-3 text-slate-600 hidden sm:table-cell">{c.phone}</td>
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
        </main>
    );
};

export default ContactsView;