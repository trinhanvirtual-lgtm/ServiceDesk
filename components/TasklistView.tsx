import React, { useState, useEffect, useMemo } from 'react';
import { PlusIcon, PencilIcon, XIcon, TrashIcon, MessageSquareIcon, PaperAirplaneIcon, MoreVerticalIcon, PaperclipIcon, UserPlusIcon, MailIcon, StickyNoteIcon, UsersIcon, ShareIcon } from './icons';
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

export interface Task {
  id: string;
  text: string;
  notes?: string;
  dueDate?: string;
  completed: boolean;
  status?: 'Todo' | 'Doing' | 'Review' | 'Done';
  priority?: 'Low' | 'Medium' | 'High';
  comments?: TaskComment[];
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  relatedUserIds?: string[];
  linkedNoteIds?: string[];
  linkedEmailIds?: string[];
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
    const [showLinkPicker, setShowLinkPicker] = useState<'note' | 'email' | null>(null);

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

    const toggleLinkedItem = (type: 'note' | 'email', itemId: string) => {
        if (type === 'note') {
            const current = task.linkedNoteIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedNoteIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedNoteIds: [...current, itemId] });
            }
        } else {
            const current = task.linkedEmailIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedEmailIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedEmailIds: [...current, itemId] });
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
                                        <select value={task.status || 'Todo'} onChange={e => setTask({...task, status: e.target.value as 'Todo' | 'Doing' | 'Review' | 'Done'})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium">
                                            <option value="Todo">Todo</option>
                                            <option value="Doing">Doing</option>
                                            <option value="Review">Review</option>
                                            <option value="Done">Done</option>
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
                                        <select value={task.priority || 'Medium'} onChange={e => setTask({...task, priority: e.target.value as 'Low' | 'Medium' | 'High'})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium">
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Liên kết Ghi chú</label>
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setShowLinkPicker(showLinkPicker === 'note' ? null : 'note')}
                                            className="w-full flex items-center justify-between bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors"
                                        >
                                            <span className="text-sm text-slate-700 truncate max-w-[150px]">
                                                {task.linkedNoteIds && task.linkedNoteIds.length > 0 
                                                    ? `${task.linkedNoteIds.length} ghi chú đã chọn` 
                                                    : 'Liên kết ghi chú'
                                                }
                                            </span>
                                            <StickyNoteIcon className="w-4 h-4 text-slate-400" />
                                        </button>
                                        {showLinkPicker === 'note' && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-48 overflow-y-auto p-1">
                                                {mockNotes.map(n => (
                                                    <button 
                                                        key={n.id}
                                                        type="button"
                                                        onClick={() => toggleLinkedItem('note', n.id)}
                                                        className={`w-full text-left p-2 hover:bg-slate-50 rounded-md transition-colors text-xs flex justify-between items-center ${task.linkedNoteIds?.includes(n.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                                                    >
                                                        <span>{n.title}</span>
                                                        {task.linkedNoteIds?.includes(n.id) && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Liên kết Email</label>
                                    <div className="relative">
                                        <button 
                                            type="button"
                                            onClick={() => setShowLinkPicker(showLinkPicker === 'email' ? null : 'email')}
                                            className="w-full flex items-center justify-between bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors"
                                        >
                                            <span className="text-sm text-slate-700 truncate max-w-[150px]">
                                                 {task.linkedEmailIds && task.linkedEmailIds.length > 0 
                                                    ? `${task.linkedEmailIds.length} email đã chọn` 
                                                    : 'Liên kết email'
                                                }
                                            </span>
                                            <MailIcon className="w-4 h-4 text-slate-400" />
                                        </button>
                                        {showLinkPicker === 'email' && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-48 overflow-y-auto p-1">
                                                {mockEmails.map(em => (
                                                    <button 
                                                        key={em.id}
                                                        type="button"
                                                        onClick={() => toggleLinkedItem('email', em.id)}
                                                        className={`w-full text-left p-2 hover:bg-slate-50 rounded-md transition-colors text-xs flex justify-between items-center ${task.linkedEmailIds?.includes(em.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                                                    >
                                                        <span>{em.subject}</span>
                                                        {task.linkedEmailIds?.includes(em.id) && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày hết hạn</label>
                                    <input type="date" value={task.dueDate || ''} onChange={e => setTask({...task, dueDate: e.target.value})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium" />
                                </div>
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
                    <div className="w-full lg:w-96 flex flex-col bg-slate-50 border-l border-slate-200 min-h-0">
                        <header className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-white">
                            <MessageSquareIcon className="w-4 h-4 text-slate-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Thảo luận</h3>
                            <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md text-[10px] font-bold">{(task.comments || []).length}</span>
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
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-800 truncate">{comment.authorName}</span>
                                                <span className="text-[10px] text-slate-400 shrink-0">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 group-hover:border-blue-100 transition-colors">
                                                <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200">
                             <div className="relative">
                                <textarea 
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Viết phản hồi..."
                                    rows={2}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pt-2 pr-12 text-sm focus:ring-2 focus:ring-blue-500/10 transition-all outline-none resize-none"
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
                                    className="absolute right-2 bottom-3 p-2 bg-blue-600 text-white rounded-lg shadow-sm hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all"
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
const TasklistView: React.FC<{ user: User, allUsers: User[], initialListId?: string }> = ({ user, allUsers, initialListId }) => {
  const [taskLists, setTaskLists] = useState<TaskList[]>(mockTaskLists);
  const [selectedListId, setSelectedListId] = useState<string>(initialListId || mockTaskLists[0].id);
  const [newTaskText, setNewTaskText] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

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

  useEffect(() => {
    if (initialListId) {
      setSelectedListId(initialListId);
    }
  }, [initialListId]);

  const selectedList = taskLists.find(list => list.id === selectedListId) || taskLists[0];

  const filteredTasks = useMemo(() => {
    return selectedList.tasks;
  }, [selectedList.tasks]);

  const uncompletedTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const list = taskLists.find(l => l.id === selectedListId);
    if (!list) return;

    const taskId = `task-${Date.now()}`;

    const newTask: Task = {
      id: taskId,
      text: newTaskText.trim(),
      completed: false,
      dueDate: newDueDate || undefined,
      status: 'Todo',
      priority: 'Medium',
      updatedAt: Date.now(),
      assigneeId: user.id,
      assigneeName: user.name,
      assigneeAvatar: user.avatar
    };

    setTaskLists(taskLists.map(list => 
      list.id === selectedListId ? { ...list, tasks: [newTask, ...list.tasks] } : list
    ));
    setNewTaskText('');
    setNewDueDate('');
  };

  const handleToggleTask = async (taskId: string) => {
    const list = taskLists.find(l => l.id === selectedListId);
    if (!list) return;

    const task = list.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistic update
    setTaskLists(taskLists.map(list => 
      list.id === selectedListId
        ? {
            ...list,
            tasks: list.tasks.map(task =>
              task.id === taskId ? { ...task, completed: newCompleted } : task
            ),
          }
        : list
    ));
  };
  
  const handleSaveTask = (updatedTask: Task) => {
    setTaskLists(taskLists.map(list => 
      list.id === selectedListId
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

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    // Optimistic update
    setTaskLists(taskLists.map(list =>
        list.id === selectedListId
        ? { ...list, tasks: list.tasks.filter(task => task.id !== taskToDelete) }
        : list
    ));
    
    setTaskToDelete(null);
  };

  const cancelDeleteTask = () => {
    setTaskToDelete(null);
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {editingTask && <TaskEditModal 
            task={editingTask} 
            user={user}
            allUsers={allUsers}
            onClose={() => setEditingTask(null)} 
            onSave={handleSaveTask} 
            onDelete={handleDeleteTask} 
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
        
        <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex min-h-0">
          {/* Left Pane: Task Lists */}
          <div className="w-1/3 max-w-[300px] border-r border-white/50 flex flex-col">
            <div className="p-4 border-b border-white/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Danh sách của tôi</h2>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
              {taskLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-between ${
                    selectedListId === list.id
                      ? 'bg-white/80 text-blue-700'
                      : 'text-slate-700 hover:bg-white/50'
                  }`}
                >
                  {list.name}
                  <span className="text-sm text-slate-500">{list.tasks.filter(t=>!t.completed).length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Pane: Tasks */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB] lg:bg-transparent">
            <div className="p-4 sm:p-6 border-b border-white/50 shrink-0 flex justify-between items-center bg-white/40">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-800">{selectedList.name}</h1>
                <span className="text-lg font-medium text-slate-400">{selectedList.tasks.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><UserPlusIcon className="w-5 h-5" /></button>
                <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                    {user.name.charAt(0)}
                </div>
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><MoreVerticalIcon className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar space-y-4">
              {/* Add Task Quick Row */}
              <form onSubmit={handleAddTask} className="flex items-center gap-4 py-2 group cursor-pointer">
                <div className="w-6 h-6 flex items-center justify-center">
                    <PlusIcon className="w-5 h-5 text-blue-600" />
                </div>
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Thêm nhiệm vụ"
                    className="flex-1 bg-transparent border-none text-lg text-slate-500 placeholder-slate-400 focus:outline-none focus:ring-0 focus:text-slate-800 font-medium"
                />
              </form>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                {uncompletedTasks.map((task) => (
                  <motion.div 
                    key={task.id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white hover:shadow-md transition-all group relative animate-fade-in"
                  >
                    <div className="flex gap-4">
                        <div className="pt-1">
                            <button 
                                onClick={() => handleToggleTask(task.id)}
                                className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-blue-500 transition-colors flex items-center justify-center"
                            >
                                {task.completed && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
                            </button>
                        </div>
                        
                        <div className="flex-1 min-w-0" onClick={() => setEditingTask(task)}>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-xl font-medium text-slate-800 truncate">{task.text}</h3>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleShare(task); }}
                                        className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-full transition-colors"
                                        title="Chia sẻ nhiệm vụ"
                                    >
                                        <ShareIcon className="w-4.5 h-4.5" />
                                    </button>
                                    <button className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                                        <MoreVerticalIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                            
                            {task.notes && <p className="text-slate-500 mb-4 line-clamp-2">{task.notes}</p>}
                            
                            {/* Assignee Row */}
                            {(task.assigneeName || task.assigneeId) && (
                                <div className="flex items-center justify-between mb-4 pr-1">
                                    <div className="flex items-center gap-3">
                                        {task.assigneeAvatar ? (
                                            <img src={task.assigneeAvatar} alt="" className="w-8 h-8 rounded-full shadow-sm ring-1 ring-slate-100" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                {(task.assigneeName || 'U').charAt(0)}
                                            </div>
                                        )}
                                        <span className="text-base text-slate-600 font-medium">{task.assigneeName || 'Unknown User'}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); /* TODO: Unassign */ }}
                                        className="p-1 text-slate-300 hover:text-slate-500 rounded-full transition-colors"
                                    >
                                        <XIcon className="w-5 h-5 bg-slate-100/50 rounded-full" />
                                    </button>
                                </div>
                            )}

                                    {/* Icons Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-slate-500">
                                            <div className="flex items-center gap-1" title="Has Notes">
                                                <StickyNoteIcon className={`w-5 h-5 ${task.notes ? 'text-blue-500' : 'text-slate-300'}`} />
                                            </div>
                                            <div className="flex items-center gap-1" title="Linked Items">
                                                <PaperclipIcon className={`w-5 h-5 ${(task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-300'}`} />
                                                {(task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0) > 0 && (
                                                    <span className="text-[10px] font-bold text-slate-500">{(task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0)}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1" title="Followers">
                                                <UsersIcon className={`w-5 h-5 ${(task.relatedUserIds?.length || 0) > 0 ? 'text-blue-500' : 'text-slate-300'}`} />
                                                {(task.relatedUserIds?.length || 0) > 0 && (
                                                    <span className="text-[10px] font-bold text-slate-500">{task.relatedUserIds?.length}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Cập nhật {task.updatedAt ? (
                                                (Date.now() - task.updatedAt < 60000) ? 'vài giây trước' : 
                                                Math.floor((Date.now() - task.updatedAt) / 60000) + ' phút trước'
                                            ) : 'vài giây trước'}
                                        </span>
                                    </div>
                        </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>

              {completedTasks.length > 0 && (
                <div className="mt-6">
                  <details open>
                      <summary className="font-semibold text-slate-600 cursor-pointer list-inside p-2 hover:bg-white/20 rounded-lg transition-colors">
                          Đã hoàn thành ({completedTasks.length})
                      </summary>
                      <div className="mt-2 space-y-2">
                          <AnimatePresence initial={false}>
                          {completedTasks.map(task => (
                              <motion.div 
                                key={task.id} 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-3 p-3 bg-white/40 rounded-lg group"
                              >
                              <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => handleToggleTask(task.id)}
                                  className="w-5 h-5 rounded-full text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                              />
                              <div className="flex-1 cursor-pointer" onClick={() => setEditingTask(task)}>
                                <div className="flex justify-between items-center">
                                    <p className="text-slate-500 line-through decoration-slate-400 decoration-2">{task.text}</p>
                                    {task.comments && task.comments.length > 0 && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                            <MessageSquareIcon className="w-3 h-3" />
                                            {task.comments.length}
                                        </div>
                                    )}
                                </div>
                              </div>
                               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleShare(task); }} className="p-2 rounded-full hover:bg-black/10 text-indigo-500 hover:text-indigo-700" title="Chia sẻ"><ShareIcon className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingTask(task)} className="p-2 rounded-full hover:bg-black/10"><PencilIcon className="w-4 h-4 text-slate-600"/></button>
                                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 rounded-full hover:bg-black/10"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                </div>
                              </motion.div>
                          ))}
                          </AnimatePresence>
                      </div>
                  </details>
                </div>
              )}
            </div>
          </div>
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