import React, { useState, useEffect, useMemo } from 'react';
import { PlusIcon, PencilIcon, XIcon, TrashIcon, MessageSquareIcon, PaperAirplaneIcon, MoreVerticalIcon, PaperclipIcon, UserPlusIcon, MailIcon, StickyNoteIcon, UsersIcon, ShareIcon, SearchIcon } from './icons';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../App';

// --- TYPES ---
export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  timestamp: number;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface TaskSubtask {
  id: string;
  text: string;
  completed: boolean;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
}

export interface Task {
  id: string;
  text: string;
  notes?: string;
  dueDate?: string;
  completed: boolean;
  status?: 'Cần làm' | 'Đang làm' | 'Xem xét' | 'Hoàn thành';
  priority?: 'Thấp' | 'Trung bình' | 'Cao';
  comments?: TaskComment[];
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  relatedUserIds?: string[];
  linkedNoteIds?: string[];
  linkedEmailIds?: string[];
  linkedChatIds?: string[];
  subtasks?: TaskSubtask[];
  attachments?: TaskAttachment[];
  updatedAt?: number;
}

export interface TaskList {
  id: string;
  name: string;
  tasks: Task[];
  source?: 'google';
}

// --- MOCK DATA ---
export const mockTaskLists: TaskList[] = [
  {
    id: 'list-1',
    name: 'Việc hôm nay',
    tasks: [
      { id: 'task-1-1', text: 'Gọi lại cho khách hàng A', completed: false, dueDate: '2024-07-29' },
      { id: 'task-1-2', text: 'Hoàn thành báo cáo tuần', completed: false, notes: 'Lấy số liệu từ Google Analytics và Salesforce.' },
      { id: 'task-1-3', text: 'Mua quà sinh nhật cho mẹ', completed: true },
      { id: 'task-1-4', text: 'Kiểm tra email và lịch trình', completed: false, dueDate: new Date().toISOString().split('T')[0] },
    ],
  },
  {
    id: 'list-2',
    name: 'Dự án POW',
    tasks: [
      { id: 'task-2-1', text: 'Viết tài liệu demo cho module Tasklist', completed: false, dueDate: '2024-08-05' },
      { id: 'task-2-2', text: 'Review PR #125 của đồng nghiệp', completed: false },
      { id: 'task-2-3', text: 'Deploy bản vá lỗi lên staging', completed: true },
    ],
  },
  {
    id: 'list-3',
    name: 'Ý tưởng nội bộ',
    tasks: [
      { id: 'task-3-1', text: 'Tổ chức buổi workshop về AI', completed: false },
      { id: 'task-3-2', text: 'Cải thiện quy trình onboarding cho nhân viên mới', completed: false },
    ],
  },
];

export const mockTaskTemplates = [
    { id: 'tpl-1', text: 'Chuẩn bị họp Daily', notes: 'Chuẩn bị danh sách các vấn đề và kết quả đạt được.', priority: 'Trung bình' as const },
    { id: 'tpl-2', text: 'Họp đồng bộ hàng tuần', notes: 'Cập nhật trạng thái dự án cho nhóm.', priority: 'Trung bình' as const },
    { id: 'tpl-3', text: 'Duyệt mã nguồn (Code Review)', priority: 'Cao' as const }
];

// --- BANNER COMPONENT ---
const AnimatedTasklistIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-14 h-14 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .clipboard-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .check-mark {
                stroke-dasharray: 30;
                stroke-dashoffset: 30;
                animation: draw-check 3s ease-in-out infinite;
                animation-delay: 1s;
            }
            @keyframes draw-check {
                0% { stroke-dashoffset: 30; }
                25% { stroke-dashoffset: 0; }
                75% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -30; }
            }
        `}</style>
        <g className="clipboard-group">
            <path d="M85,15 H35 A5,5 0 0,0 30,20 V80 A5,5 0 0,0 35,85 H85 A5,5 0 0,0 90,80 V20 A5,5 0 0,0 85,15 Z" fill="#fff" stroke="#e0e7ff" strokeWidth="2" />
            <path d="M70,10 h-20 a8,8 0 0,0 0,16 h20 a8,8 0 0,0 0,-16 Z" fill="#a5b4fc" />
            <line x1="45" y1="58" x2="75" y2="58" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="68" x2="65" y2="68" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
            
            <g transform="translate(0, -5)">
                <circle cx="50" cy="40" r="10" fill="#34d399" opacity="0.2" />
                <path className="check-mark" d="M45 40 L49 44 L57 36" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </g>
    </svg>
);

const TasklistBanner: React.FC = () => {
    return (
        <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 -rotate-12" aria-hidden="true"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-center sm:text-left">
                    <h1 className="text-lg sm:text-xl font-bold">Danh sách việc</h1>
                    <p className="mt-0.5 text-xs text-indigo-100 max-w-lg italic">
                        “Việc nhỏ – nhưng nhớ kỹ. Đồng bộ, nhắc đúng, xử lý gọn.”
                    </p>
                </div>
                <div className="shrink-0 hidden md:block">
                    <AnimatedTasklistIcon />
                </div>
            </div>
        </div>
    );
};

// --- EDIT MODAL ---
const TaskEditModal: React.FC<{ 
    task: Task, 
    user: User,
    allUsers: User[],
    onClose: () => void, 
    onSave: (task: Task) => void, 
    onDelete: (taskId: string) => void 
}> = ({ task: initialTask, user, allUsers, onClose, onSave, onDelete }) => {
    const [task, setTask] = useState(initialTask);
    const [commentText, setCommentText] = useState('');
    const [showUserPicker, setShowUserPicker] = useState<'assignee' | 'related' | null>(null);
    const [showSubtaskUserPickerId, setShowSubtaskUserPickerId] = useState<string | null>(null);
    const [showLinkPicker, setShowLinkPicker] = useState<boolean>(false);
    const [linkSearchTerm, setLinkSearchTerm] = useState('');
    const [subtaskText, setSubtaskText] = useState('');

    const handleAddSubtask = (e?: React.KeyboardEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!subtaskText.trim()) return;
        setTask({
            ...task,
            subtasks: [...(task.subtasks || []), { id: `subtask-${Date.now()}`, text: subtaskText.trim(), completed: false }]
        });
        setSubtaskText('');
    };

    const handleToggleSubtask = (subtaskId: string) => {
        setTask({
            ...task,
            subtasks: task.subtasks?.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        });
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        setTask({
            ...task,
            subtasks: task.subtasks?.filter(st => st.id !== subtaskId)
        });
    };

    const handleSetSubtaskAssignee = (subtaskId: string, selectedUser: User) => {
        setTask({
            ...task,
            subtasks: task.subtasks?.map(st => st.id === subtaskId ? { 
                ...st, 
                assigneeId: selectedUser.id,
                assigneeName: selectedUser.name,
                assigneeAvatar: selectedUser.avatar
             } : st)
        });
        setShowSubtaskUserPickerId(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(file => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: URL.createObjectURL(file), // mock url for preview
            size: file.size
        }));
        
        setTask({
            ...task,
            attachments: [...(task.attachments || []), ...newFiles]
        });
        e.target.value = ''; // reset input
    };

    const handleDeleteAttachment = (attachmentId: string) => {
        setTask({
            ...task,
            attachments: task.attachments?.filter(a => a.id !== attachmentId)
        });
    };

    // Mock data for links
    const mockNotes = [
        { id: 'note-1', title: 'Biên bản cuộc họp tuần 34' },
        { id: 'note-2', title: 'Quy trình vận hành kho mới' },
        { id: 'note-3', title: 'Ý tưởng marketing Q3' }
    ];
    
    const mockEmails = [
        { id: 'email-1', subject: 'Xác nhận đơn hàng #4492' },
        { id: 'email-2', subject: 'Thư mời họp: Dự án Pow' },
        { id: 'email-3', subject: 'Báo cáo doanh thu tháng 7' }
    ];
    
    const mockChats = [
        { id: 'chat-1', title: 'Nhóm dự án Pow' },
        { id: 'chat-2', title: 'Trao đổi với KH' },
        { id: 'chat-3', title: 'Thông báo chung' }
    ];
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(task);
    };

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        
        const newComment: TaskComment = {
            id: `comment-${Date.now()}`,
            authorId: user.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            text: commentText.trim(),
            timestamp: Date.now()
        };

        setTask({
            ...task,
            comments: [...(task.comments || []), newComment]
        });
        setCommentText('');
    };

    const toggleRelatedUser = (userId: string) => {
        const related = task.relatedUserIds || [];
        if (related.includes(userId)) {
            setTask({ ...task, relatedUserIds: related.filter(id => id !== userId) });
        } else {
            setTask({ ...task, relatedUserIds: [...related, userId] });
        }
    };

    const toggleLinkedItem = (type: 'note' | 'email' | 'chat', itemId: string) => {
        if (type === 'note') {
            const current = task.linkedNoteIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedNoteIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedNoteIds: [...current, itemId] });
            }
        } else if (type === 'email') {
            const current = task.linkedEmailIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedEmailIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedEmailIds: [...current, itemId] });
            }
        } else if (type === 'chat') {
            const current = task.linkedChatIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedChatIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedChatIds: [...current, itemId] });
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center p-4">
             <div className="absolute inset-0" onClick={onClose}></div>
             <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white/80 backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
                 <header className="p-4 border-b border-slate-200/80 flex justify-between items-center sticky top-0 bg-white/90 z-10">
                    <h2 className="text-lg font-semibold text-slate-800">Chỉnh sửa công việc</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-400/20"><XIcon className="w-5 h-5"/></button>
                 </header>
                 
                 <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
                    <form onSubmit={handleSave} className="flex-1 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200/50">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên công việc</label>
                                <input type="text" value={task.text} onChange={e => setTask({...task, text: e.target.value})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-3 font-medium text-lg focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    {/* Assignee Selection */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Người phụ trách</label>
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={() => setShowUserPicker(showUserPicker === 'assignee' ? null : 'assignee')}
                                                className="w-full flex items-center gap-3 bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors text-left"
                                            >
                                                {task.assigneeId ? (
                                                    <>
                                                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                                                            {allUsers.find(u => u.id === task.assigneeId)?.name.charAt(0) || 'U'}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">{allUsers.find(u => u.id === task.assigneeId)?.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-slate-400 italic">Chọn người phụ trách</span>
                                                )}
                                            </button>
                                            
                                            {showUserPicker === 'assignee' && (
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-48 overflow-y-auto p-1">
                                                    {allUsers.map(u => (
                                                        <button 
                                                            key={u.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setTask({ ...task, assigneeId: u.id, assigneeName: u.name, assigneeAvatar: u.avatar });
                                                                setShowUserPicker(null);
                                                            }}
                                                            className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors"
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{u.name.charAt(0)}</div>
                                                            <span className="text-xs text-slate-700">{u.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái</label>
                                        <select value={task.status || 'Cần làm'} onChange={e => setTask({...task, status: e.target.value as 'Cần làm' | 'Đang làm' | 'Xem xét' | 'Hoàn thành'})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium">
                                            <option value="Cần làm">Cần làm</option>
                                            <option value="Đang làm">Đang làm</option>
                                            <option value="Xem xét">Xem xét</option>
                                            <option value="Hoàn thành">Hoàn thành</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                     {/* Related/Followers Selection */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Người liên quan</label>
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={() => setShowUserPicker(showUserPicker === 'related' ? null : 'related')}
                                                className="w-full flex items-center justify-between bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors"
                                            >
                                                <div className="flex -space-x-2">
                                                    {(task.relatedUserIds || []).length > 0 ? (
                                                        task.relatedUserIds!.slice(0, 3).map(id => (
                                                            <div key={id} className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-white ring-2 ring-white text-[10px] font-bold">
                                                                {allUsers.find(u => u.id === id)?.name.charAt(0) || 'U'}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">Thêm người liên quan</span>
                                                    )}
                                                    {(task.relatedUserIds || []).length > 3 && (
                                                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 ring-2 ring-white text-[10px] font-bold">
                                                            +{(task.relatedUserIds || []).length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <UsersIcon className="w-4 h-4 text-slate-400" />
                                            </button>
                                            
                                            {showUserPicker === 'related' && (
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-48 overflow-y-auto p-1">
                                                    {allUsers.map(u => (
                                                        <button 
                                                            key={u.id}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleRelatedUser(u.id);
                                                            }}
                                                            className={`w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors ${task.relatedUserIds?.includes(u.id) ? 'bg-blue-50' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{u.name.charAt(0)}</div>
                                                                <span className="text-xs text-slate-700">{u.name}</span>
                                                            </div>
                                                            {task.relatedUserIds?.includes(u.id) && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Độ ưu tiên</label>
                                        <select value={task.priority || 'Trung bình'} onChange={e => setTask({...task, priority: e.target.value as 'Thấp' | 'Trung bình' | 'Cao'})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium">
                                            <option value="Thấp">Thấp</option>
                                            <option value="Trung bình">Trung bình</option>
                                            <option value="Cao">Cao</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Liên kết thông tin</label>
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setShowLinkPicker(!showLinkPicker)}
                                            className="w-full flex items-center justify-between bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors"
                                        >
                                            <span className="text-sm text-slate-700 truncate min-w-0 pr-2">
                                                {((task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0) + (task.linkedChatIds?.length || 0)) > 0 
                                                    ? `${(task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0) + (task.linkedChatIds?.length || 0)} liên kết` 
                                                    : 'Thêm liên kết'}
                                            </span>
                                            <PaperclipIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                        </button>
                                        {showLinkPicker && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden flex flex-col">
                                                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                                    <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Tìm kiếm..."
                                                        value={linkSearchTerm}
                                                        onChange={e => setLinkSearchTerm(e.target.value)}
                                                        className="w-full bg-transparent border-none text-xs text-slate-700 focus:outline-none placeholder-slate-400"
                                                    />
                                                </div>
                                                <div className="max-h-56 overflow-y-auto p-1">
                                                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú</div>
                                                    {mockNotes.filter(n => n.title.toLowerCase().includes(linkSearchTerm.toLowerCase())).map(n => (
                                                        <label key={n.id} className={`w-full flex items-start gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors text-xs cursor-pointer ${task.linkedNoteIds?.includes(n.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                                                            <input type="checkbox" checked={task.linkedNoteIds?.includes(n.id) || false} onChange={() => toggleLinkedItem('note', n.id)} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                            <span className="flex-1 min-w-0 font-medium leading-snug">{n.title}</span>
                                                        </label>
                                                    ))}
                                                    <div className="px-2 py-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
                                                    {mockEmails.filter(em => em.subject.toLowerCase().includes(linkSearchTerm.toLowerCase())).map(em => (
                                                        <label key={em.id} className={`w-full flex items-start gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors text-xs cursor-pointer ${task.linkedEmailIds?.includes(em.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                                                            <input type="checkbox" checked={task.linkedEmailIds?.includes(em.id) || false} onChange={() => toggleLinkedItem('email', em.id)} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                            <span className="flex-1 min-w-0 font-medium leading-snug">{em.subject}</span>
                                                        </label>
                                                    ))}
                                                    <div className="px-2 py-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trò chuyện</div>
                                                    {mockChats.filter(c => c.title.toLowerCase().includes(linkSearchTerm.toLowerCase())).map(c => (
                                                        <label key={c.id} className={`w-full flex items-start gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors text-xs cursor-pointer ${task.linkedChatIds?.includes(c.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                                                            <input type="checkbox" checked={task.linkedChatIds?.includes(c.id) || false} onChange={() => toggleLinkedItem('chat', c.id)} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                            <span className="flex-1 min-w-0 font-medium leading-snug">{c.title}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày hết hạn</label>
                                    <input type="date" value={task.dueDate || ''} onChange={e => setTask({...task, dueDate: e.target.value})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Danh sách công việc phụ</label>
                                <div className="space-y-2">
                                    {(task.subtasks || []).map(st => (
                                        <div key={st.id} className="flex items-center gap-2 group relative">
                                            <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(st.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors" />
                                            <span className={`flex-1 text-sm min-w-0 break-words ${st.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>{st.text}</span>
                                            
                                            <div className="relative shrink-0 flex items-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowSubtaskUserPickerId(showSubtaskUserPickerId === st.id ? null : st.id)}
                                                    className={`p-1 rounded transition-all flex items-center ${st.assigneeId ? 'opacity-100 hover:opacity-80' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                    title={st.assigneeName || "Chỉ định người phụ trách"}
                                                >
                                                    {st.assigneeAvatar ? (
                                                        <img src={st.assigneeAvatar} alt="" className="w-5 h-5 rounded-full shadow-sm" />
                                                    ) : st.assigneeName ? (
                                                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[9px] shadow-sm">
                                                            {st.assigneeName.charAt(0)}
                                                        </div>
                                                    ) : (
                                                        <UserPlusIcon className="w-4 h-4" />
                                                    )}
                                                </button>
                                                {showSubtaskUserPickerId === st.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-[60] py-1">
                                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Chọn người</div>
                                                        <div className="max-h-40 overflow-y-auto no-scrollbar">
                                                            {allUsers.map(u => (
                                                                <button
                                                                    key={u.id}
                                                                    type="button"
                                                                    onClick={() => handleSetSubtaskAssignee(st.id, u)}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                                                                >
                                                                    {u.avatar ? (
                                                                        <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">{u.name.charAt(0)}</div>
                                                                    )}
                                                                    <span className="text-xs font-medium text-slate-700 truncate">{u.name}</span>
                                                                    {st.assigneeId === u.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button type="button" onClick={() => handleDeleteSubtask(st.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all shrink-0">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 mt-2">
                                        <PlusIcon className="w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={subtaskText} 
                                            onChange={e => setSubtaskText(e.target.value)} 
                                            onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(e); }}
                                            placeholder="Thêm việc phụ..."
                                            className="flex-1 bg-transparent border-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0" 
                                        />
                                        <button type="button" onClick={handleAddSubtask} disabled={!subtaskText.trim()} className="text-xs font-bold text-blue-600 disabled:opacity-50 hover:text-blue-700 transition-colors uppercase tracking-wider">Thêm</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex justify-between items-center">
                                    Tệp đính kèm
                                    <label className="cursor-pointer text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                                        <PaperclipIcon className="w-3.5 h-3.5" /> Thêm tệp
                                        <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </label>
                                {(task.attachments && task.attachments.length > 0) ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {task.attachments.map(att => (
                                            <div key={att.id} className="flex items-center justify-between p-2 bg-white/70 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors group">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                        <PaperclipIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-700 truncate">{att.name}</p>
                                                        <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0">
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-300/50 border-dashed rounded-lg cursor-pointer bg-white/40 hover:bg-white/60 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                            <p className="max-w-xs text-xs text-slate-500 text-center"><span className="font-semibold text-blue-600">Nhấp để tải lên</span> hoặc kéo thả</p>
                                        </div>
                                        <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                    </label>
                                )}
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú</label>
                                <textarea value={task.notes || ''} onChange={e => setTask({...task, notes: e.target.value})} rows={3} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-3 resize-none outline-none text-sm" placeholder="Mô tả chi tiết công việc..." />
                            </div>
                        </div>
                        
                        <div className="pt-4 flex justify-between items-center bg-transparent">
                            <button type="button" onClick={() => { onDelete(task.id); onClose(); }} className="py-2 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm">
                                <TrashIcon className="w-4 h-4" /> Xóa
                            </button>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Hủy</button>
                                <button type="submit" className="py-2.5 px-8 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all text-sm">Lưu</button>
                            </div>
                        </div>
                    </form>

                    {/* Comments Section */}
                    <div className="w-full lg:w-96 flex flex-col bg-[#E6E6E6] border-l border-slate-200 min-h-0">
                        <header className="px-4 py-3 flex items-center gap-2">
                            <MessageSquareIcon className="w-4 h-4 text-slate-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Thảo luận</h3>
                            <span className="bg-slate-300/50 text-slate-600 px-1.5 py-0.5 rounded-md text-[10px] font-bold">{(task.comments || []).length}</span>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                            {(task.comments || []).length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-60 py-10">
                                    <MessageSquareIcon className="w-10 h-10" />
                                    <p className="text-xs font-medium">Chưa có bình luận nào</p>
                                </div>
                            ) : (
                                task.comments!.map(comment => (
                                    <div key={comment.id} className="flex gap-3 animate-fade-in group">
                                        <div className="shrink-0">
                                            {comment.authorAvatar ? (
                                                <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full shadow-sm" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] uppercase shadow-sm">
                                                    {comment.authorName.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-800 truncate">{comment.authorName}</span>
                                                <span className="text-[10px] font-medium text-slate-400 shrink-0">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm transition-colors w-fit max-w-[90%]">
                                                <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-4 pb-4 pt-2">
                             <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-300 transition-all">
                                <textarea 
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Viết phản hồi..."
                                    rows={2}
                                    className="w-full bg-transparent border-none p-3 pt-3 pr-12 text-sm focus:ring-0 outline-none resize-none"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={handleAddComment}
                                    disabled={!commentText.trim()}
                                    className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white rounded-xl shadow-sm hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all"
                                >
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const TasklistView: React.FC<{ user: User, allUsers: User[], initialListId?: string }> = ({ user, allUsers }) => {
  const [taskLists, setTaskLists] = useState<TaskList[]>(mockTaskLists);
  const [newTaskTexts, setNewTaskTexts] = useState<Record<string, string>>({});
  const [editingTask, setEditingTask] = useState<{task: Task, listId: string} | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{taskId: string, listId: string} | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showTemplateMenuId, setShowTemplateMenuId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleShare = (task: Task) => {
    const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=task&shareId=${task.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast(`Đã sao chép liên kết chia sẻ công việc: "${task.text}"!`);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(`Đã sao chép liên kết chia sẻ công việc: "${task.text}"!`);
    });
  };

  const handleAddTask = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    const text = newTaskTexts[listId];
    if (!text?.trim()) return;

    const list = taskLists.find(l => l.id === listId);
    if (!list) return;

    const taskId = `task-${Date.now()}`;

    const newTask: Task = {
      id: taskId,
      text: text.trim(),
      completed: false,
      status: 'Cần làm',
      priority: 'Trung bình',
      updatedAt: Date.now(),
      assigneeId: user.id,
      assigneeName: user.name,
      assigneeAvatar: user.avatar
    };

    setTaskLists(taskLists.map(l => 
      l.id === listId ? { ...l, tasks: [newTask, ...l.tasks] } : l
    ));
    setNewTaskTexts({ ...newTaskTexts, [listId]: '' });
  };

  const handleToggleTask = async (listId: string, taskId: string) => {
    setTaskLists(taskLists.map(list => 
      list.id === listId
        ? {
            ...list,
            tasks: list.tasks.map(task =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            ),
          }
        : list
    ));
  };
  
  const handleSaveTask = (updatedTask: Task) => {
    if (!editingTask) return;
    setTaskLists(taskLists.map(list => 
      list.id === editingTask.listId
        ? {
            ...list,
            tasks: list.tasks.map(task =>
              task.id === updatedTask.id ? updatedTask : task
            ),
          }
        : list
    ));
    setEditingTask(null);
  };

  const handleDeleteTask = (listId: string, taskId: string) => {
    setTaskToDelete({ listId, taskId });
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setTaskLists(taskLists.map(list =>
        list.id === taskToDelete.listId
        ? { ...list, tasks: list.tasks.filter(task => task.id !== taskToDelete.taskId) }
        : list
    ));
    
    setTaskToDelete(null);
  };

  const cancelDeleteTask = () => {
    setTaskToDelete(null);
  };

  const applyTemplate = (listId: string, template: typeof mockTaskTemplates[0]) => {
    const newTask: Task = {
        id: `task-${Date.now()}`,
        text: template.text,
        notes: template.notes,
        priority: template.priority,
        completed: false,
        updatedAt: Date.now(),
    };
    setTaskLists(taskLists.map(list => 
        list.id === listId 
            ? { ...list, tasks: [...list.tasks, newTask] }
            : list
    ));
    setShowTemplateMenuId(null);
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {editingTask && <TaskEditModal 
            task={editingTask.task} 
            user={user}
            allUsers={allUsers}
            onClose={() => setEditingTask(null)} 
            onSave={handleSaveTask} 
            onDelete={() => { handleDeleteTask(editingTask.listId, editingTask.task.id); setEditingTask(null); }} 
        />}
        
        {taskToDelete && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="absolute inset-0" onClick={cancelDeleteTask}></div>
            <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-2">Xóa công việc</h2>
                <p className="text-slate-600 text-sm">Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.</p>
              </div>
              <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50 rounded-b-xl">
                <button onClick={cancelDeleteTask} className="py-2 px-4 rounded-lg font-semibold text-slate-700 hover:bg-slate-200 transition-colors">Hủy</button>
                <button onClick={confirmDeleteTask} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md shadow-red-500/20">Xóa</button>
              </div>
            </div>
          </div>
        )}

        <TasklistBanner />
        
        {/* Kanban Board Container */}
        <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar pb-4 snap-x relative h-full">
            {taskLists.map(list => {
                const uncompletedTasks = list.tasks.filter(t => !t.completed);
                const completedTasks = list.tasks.filter(t => t.completed);

                return (
                  <div key={list.id} className="w-80 sm:w-96 shrink-0 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 flex flex-col snap-center max-h-full overflow-hidden">
                    {/* Column Header */}
                    <div className="p-4 border-b border-white/50 shrink-0 flex justify-between items-center bg-white/40">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800">{list.name}</h2>
                        <span className="text-sm font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">{list.tasks.length}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <button className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Thêm thành viên"><UserPlusIcon className="w-4 h-4" /></button>
                        <button className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><MoreVerticalIcon className="w-5 h-5" /></button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-4">
                      {/* Add Task Quick Row */}
                      <div className="flex flex-col gap-2">
                          <form onSubmit={(e) => handleAddTask(e, list.id)} className="flex items-center gap-3 bg-white/70 p-2.5 rounded-xl border border-white/50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <PlusIcon className="w-5 h-5 text-blue-500 shrink-0 ml-1" />
                            <input
                                type="text"
                                value={newTaskTexts[list.id] || ''}
                                onChange={(e) => setNewTaskTexts({...newTaskTexts, [list.id]: e.target.value})}
                                placeholder="Thêm công việc mới..."
                                className="flex-1 bg-transparent border-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none font-medium"
                            />
                          </form>
                          <div className="relative">
                              <button 
                                  onClick={() => setShowTemplateMenuId(showTemplateMenuId === list.id ? null : list.id)}
                                  className="mx-auto flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800  transition-colors"
                              >
                                  <PlusIcon className="w-3.5 h-3.5"/> Dùng mẫu
                              </button>
                              {showTemplateMenuId === list.id && (
                                  <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                                      <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chọn mẫu</div>
                                      <ul className="max-h-48 overflow-y-auto no-scrollbar">
                                          {mockTaskTemplates.map(tpl => (
                                              <li key={tpl.id}>
                                                  <button 
                                                      onClick={() => applyTemplate(list.id, tpl)}
                                                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                                  >
                                                      <span className="block font-semibold text-slate-800 text-xs mb-0.5">{tpl.text}</span>
                                                      {tpl.notes && <span className="block text-[10px] text-slate-500 line-clamp-1">{tpl.notes}</span>}
                                                  </button>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-3">
                        <AnimatePresence initial={false}>
                        {uncompletedTasks.map((task) => (
                          <motion.div 
                            key={task.id} 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-3.5 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group relative cursor-pointer"
                            onClick={() => setEditingTask({ task, listId: list.id })}
                          >
                            <div className="flex gap-3">
                                <div className="pt-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleToggleTask(list.id, task.id)}
                                        className="w-5 h-5 rounded-full border-[1.5px] border-slate-300 hover:border-blue-500 transition-colors flex items-center justify-center p-[2px]"
                                    >
                                        <div className="w-full h-full rounded-full bg-blue-600 scale-0 group-hover:scale-50 transition-transform opacity-50"></div>
                                    </button>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <h3 className="text-sm font-semibold text-slate-800 leading-snug break-words">{task.text}</h3>
                                    </div>
                                    
                                    {task.notes && <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{task.notes}</p>}
                                    
                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {task.assigneeId && (
                                                <div className="flex items-center gap-1.5" title={task.assigneeName}>
                                                    {task.assigneeAvatar ? (
                                                        <img src={task.assigneeAvatar} alt="" className="w-5 h-5 rounded-full shadow-sm ring-1 ring-slate-200" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[9px] shadow-sm">
                                                            {(task.assigneeName || 'U').charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2.5 text-slate-400">
                                            {task.comments && task.comments.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <MessageSquareIcon className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-bold">{task.comments.length}</span>
                                                </div>
                                            )}
                                            {(task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0) > 0 && (
                                                <div className="flex items-center gap-1 text-indigo-400">
                                                    <PaperclipIcon className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            
                                            {/* Hover Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                                                <button onClick={(e) => { e.stopPropagation(); handleShare(task); }} className="p-1 hover:text-blue-600 transition-colors" title="Chia sẻ"><ShareIcon className="w-3.5 h-3.5" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(list.id, task.id); }} className="p-1 hover:text-red-500 transition-colors"><TrashIcon className="w-3.5 h-3.5"/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>

                      {completedTasks.length > 0 && (
                        <div className="pt-2">
                          <details className="group">
                              <summary className="text-xs font-bold text-slate-500 cursor-pointer list-outside p-1.5 hover:bg-white/40 rounded-lg transition-colors flex items-center gap-1 flex-row-reverse justify-end marker:content-none">
                                  <span>Đã xong ({completedTasks.length})</span>
                                  <svg className="w-3 h-3 text-slate-400 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                  </svg>
                              </summary>
                              <div className="mt-3 space-y-2.5 pl-1.5">
                                  {completedTasks.map(task => (
                                      <div key={task.id} className="flex items-start gap-3 group relative opacity-70 hover:opacity-100 transition-opacity">
                                          <div className="pt-0.5 shrink-0">
                                              <button 
                                                  onClick={() => handleToggleTask(list.id, task.id)}
                                                  className="w-5 h-5 rounded-full border-[1.5px] border-blue-500 transition-colors flex items-center justify-center bg-blue-500 text-white"
                                              >
                                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                  </svg>
                                              </button>
                                          </div>
                                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingTask({ task, listId: list.id })}>
                                              <p className="text-sm font-medium text-slate-500 line-through decoration-slate-400 decoration-1 break-words">{task.text}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </main>
  );
};

export default TasklistView;