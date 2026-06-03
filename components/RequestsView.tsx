import React, { useState, useMemo } from 'react';
import { User } from '../App';
import { useLanguage } from './LanguageContext';
import { ClipboardListIcon, PlusIcon, XIcon, CheckIcon, SearchIcon, ShareIcon } from './icons';
import RequestsBanner from './RequestsBanner';
import CreateRequestModal, { Request } from './CreateRequestModal';

interface RequestsViewProps {
    user: User;
    users: User[];
}

const mockRequests: Request[] = [
    {
        id: '1',
        title: 'Xin nghỉ phép ngày 20/11',
        type: 'leaveRequest',
        content: 'Tôi có việc gia đình đột xuất.',
        status: 'pending',
        createdAt: new Date(),
        authorId: 'user-1',
        authorName: 'Nguyễn Văn A',
        approverId: 'dev-admin',
        approverName: 'Admin',
    }
];

const RequestsView: React.FC<RequestsViewProps> = ({ user, users }) => {
    const { t } = useLanguage();
    const [requests, setRequests] = useState<Request[]>(mockRequests);
    const [activeTab, setActiveTab] = useState<'mine' | 'to-approve'>('mine');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage('');
        }, 2500);
    };

    const handleShareRequest = (req: Request) => {
        const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=approval&shareId=${req.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast(`Đã sao chép liên kết phiếu phê duyệt: "${req.title}"!`);
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(`Đã sao chép liên kết phiếu phê duyệt: "${req.title}"!`);
        });
    };

    const handleSaveRequest = async (newRequest: Request) => {
        setRequests([newRequest, ...requests]);
        setCreateModalOpen(false);
        showToast('Đã tạo yêu cầu thành công!');
        
        try {
            const approver = users.find(u => u.id === newRequest.approverId);
            const approverEmail = approver?.email || approver?.id === 'dev-admin' ? 'admin@example.com' : 'approver@example.com'; 
            
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: approverEmail,
                    subject: `Yêu cầu mới cần phê duyệt: ${newRequest.title}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #4f46e5;">Có yêu cầu mới cần phê duyệt</h2>
                            <p><strong>Từ:</strong> ${newRequest.authorName}</p>
                            <p><strong>Tiêu đề:</strong> ${newRequest.title}</p>
                            <p><strong>Nội dung:</strong></p>
                            <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
                                ${newRequest.content}
                            </div>
                            <p style="margin-top: 20px;">Vui lòng đăng nhập vào hệ thống để phê duyệt phiếu này.</p>
                        </div>
                    `
                })
            });
        } catch (error) {
            console.error("Failed to send email notification", error);
        }
    };

    const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
    };

    const displayedRequests = useMemo(() => {
        const filteredByTab = requests.filter(r => 
            activeTab === 'mine' ? r.authorId === user.id : r.approverId === user.id || user.role === 'superadmin'
        );

        if (!searchTerm.trim()) return filteredByTab;

        const lowerSearch = searchTerm.toLowerCase();
        return filteredByTab.filter(r => 
            r.title.toLowerCase().includes(lowerSearch) ||
            r.type.toLowerCase().includes(lowerSearch) ||
            r.status.toLowerCase().includes(lowerSearch) ||
            t(r.type).toLowerCase().includes(lowerSearch)
        );
    }, [requests, activeTab, user, searchTerm, t]);

    const checkHasToApprove = requests.some(r => r.approverId === user.id && r.status === 'pending') || user.role === 'superadmin';

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-500/20 dark:text-green-400 rounded-full">{t('statusApproved')}</span>;
            case 'rejected':
                return <span className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-400 rounded-full">{t('statusRejected')}</span>;
            case 'pending':
            default:
                return <span className="px-3 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-full flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>{t('statusPending')}</span>;
        }
    };

    return (
        <div className="animate-fade-in-up flex-1 overflow-y-auto no-scrollbar p-[3px] pb-24 md:pb-8 relative flex flex-col gap-3">
            <div className="shrink-0">
                <RequestsBanner />
            </div>

            <div className="w-full flex-1">
                <div className="bg-[--color-surface-secondary] rounded-2xl shadow-xl overflow-hidden border border-[--color-border-secondary] flex flex-col min-h-[500px]">
                    <div className="p-6 border-b border-[--color-border-secondary] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex gap-6 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveTab('mine')}
                                className={`pb-2 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'mine' ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
                            >
                                {t('requests')}
                            </button>
                            {checkHasToApprove && (
                                <button
                                    onClick={() => setActiveTab('to-approve')}
                                    className={`relative pb-2 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'to-approve' ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]' : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
                                >
                                    {t('approvals')}
                                    {requests.filter(r => r.approverId === user.id && r.status === 'pending').length > 0 && (
                                        <span className="absolute -top-1 -right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    )}
                                </button>
                            )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-subtle]" />
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('search')}
                                    className="w-full sm:w-64 bg-[--color-surface-primary] border border-[--color-border-secondary] text-sm text-[--color-text-primary] rounded-xl py-2 pl-9 pr-4 focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none transition-all"
                                />
                            </div>
                            <button 
                                onClick={() => setCreateModalOpen(true)}
                                className="bg-[--color-accent-600] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[--color-accent-500/20] flex items-center justify-center gap-2 hover:bg-[--color-accent-700] transition-all active:scale-[0.98]"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span className="whitespace-nowrap">{t('newRequest')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto min-h-[400px]">
                        {displayedRequests.length === 0 ? (
                            <div className="text-center text-[--color-text-subtle] py-20 flex flex-col items-center justify-center h-full">
                                <ClipboardListIcon className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium">Không có yêu cầu nào.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[--color-surface-tertiary] border-b border-[--color-border-secondary]">
                                        <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('requestTitle')}</th>
                                        <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('requestType')}</th>
                                        <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('authorName') || 'Người tạo'}</th>
                                        <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('createdAt') || 'Ngày tạo'}</th>
                                        <th className="p-4 font-semibold text-sm text-[--color-text-secondary]">{t('status')}</th>
                                        <th className="p-4 font-semibold text-sm text-[--color-text-secondary] text-right">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedRequests.map(req => (
                                        <tr key={req.id} className="border-b border-[--color-border-secondary] hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-[--color-text-primary] mb-1">{req.title}</div>
                                                <div className="text-xs text-[--color-text-subtle] line-clamp-1">{req.content}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-semibold text-[--color-accent-600] dark:text-[--color-accent-400] bg-[--color-accent-500]/10 px-2 py-1 rounded-md">
                                                    {t(req.type)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-[--color-text-secondary]">
                                                {req.authorName}
                                            </td>
                                            <td className="p-4 text-sm text-[--color-text-subtle]">
                                                {req.createdAt.toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="p-4 text-right">
                                                {activeTab === 'to-approve' && req.status === 'pending' ? (
                                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                            className="p-2 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors"
                                                            title={t('reject')}
                                                        >
                                                            <XIcon className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                            className="p-2 rounded-lg text-green-600 hover:bg-green-500/10 transition-colors"
                                                            title={t('approve')}
                                                        >
                                                            <CheckIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end items-center gap-1.5">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleShareRequest(req); }}
                                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors"
                                                            title="Chia sẻ liên kết"
                                                        >
                                                            <ShareIcon className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 text-[--color-text-subtle] hover:text-[--color-text-primary] rounded-lg transition-colors">
                                                            <SearchIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateRequestModal 
                    user={user} 
                    users={users} 
                    onClose={() => setCreateModalOpen(false)} 
                    onSave={handleSaveRequest} 
                />
            )}

            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}
        </div>
    );
};

export default RequestsView;
