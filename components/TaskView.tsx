import React, { useState, useEffect } from 'react';
import TaskManagementBanner from './TaskManagementBanner';
import { FileTextIcon, XIcon, ClipboardListIcon, TrashIcon, ClockIcon } from './icons';
import { RecentItem, AppNotification } from '../App';

type TaskStatus = 'Cần làm' | 'Đang làm' | 'Xem xét' | 'Hoàn thành';
type TaskPriority = 'Cao' | 'Trung bình' | 'Thấp';

export interface TaskLabel {
    name: string;
    color: string;
}

export interface TaskComment {
    id: string;
    author: string;
    text: string;
    timestamp: number;
}

interface Task {
    id: string;
    title: string;
    project: string;
    priority: TaskPriority;
    status: TaskStatus;
    notes?: string;
    dueDate?: string;
    labels?: TaskLabel[];
    comments?: TaskComment[];
}

const mockTasks: Task[] = [
    { id: 't1', title: 'Thiết kế banner quảng cáo', project: 'Marketing Mùa lễ hội', priority: 'Cao', status: 'Cần làm', notes: 'Yêu cầu: Kích thước 1200x628px. Tone màu chủ đạo là đỏ và vàng. Chèn logo ở góc phải.', dueDate: '2024-08-10', labels: [{name: 'Gấp', color: 'bg-red-500'}], comments: [] },
    { id: 't2', title: 'Phân tích hành vi người dùng', project: 'Tối ưu hóa Onboarding', priority: 'Cao', status: 'Đang làm', notes: '', dueDate: '2024-08-15', labels: [{name: 'Tính năng', color: 'bg-blue-500'}], comments: [] },
    { id: 't3', title: 'Viết nội dung social media', project: 'Marketing Mùa lễ hội', priority: 'Trung bình', status: 'Cần làm', labels: [], comments: [] },
    { id: 't4', title: 'Test A/B trang giá', project: 'Tối ưu hóa Conversion', priority: 'Trung bình', status: 'Xem xét', notes: 'So sánh 2 phiên bản: layout 3 cột và layout bảng giá chi tiết. Liên hệ team design để lấy file Figma.', dueDate: '2024-08-05', labels: [{name: 'Thử nghiệm', color: 'bg-purple-500'}], comments: [] },
    { id: 't5', 'title': 'Fix bug #512 - Nút submit bị vô hiệu hóa', project: 'Bảo trì hệ thống', priority: 'Cao', status: 'Đang làm', notes: 'Bug xảy ra trên trình duyệt Safari phiên bản 15.x. Cần kiểm tra lại logic validation form.', labels: [{name: 'Lỗi', color: 'bg-red-600'}], comments: [] },
    { id: 't6', title: 'Lên kế hoạch cho Q1/2025', project: 'Chiến lược công ty', priority: 'Thấp', status: 'Hoàn thành', labels: [], comments: [] },
    { id: 't7', title: 'Redesign trang đăng ký', project: 'Tối ưu hóa Onboarding', priority: 'Trung bình', status: 'Xem xét', labels: [{name: 'Thiết kế', color: 'bg-pink-500'}], comments: [] },
    { id: 't8', 'title': 'Cập nhật thư viện dependencies', project: 'Bảo trì hệ thống', priority: 'Thấp', status: 'Hoàn thành', notes: 'Chạy `npm audit` để kiểm tra các lỗ hổng bảo mật sau khi cập nhật.', labels: [{name: 'Bảo trì', color: 'bg-slate-500'}], comments: [] },
];

const priorityStyles: Record<TaskPriority, string> = {
    'Cao': 'bg-red-100 text-red-700 border-l-4 border-red-500',
    'Trung bình': 'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500',
    'Thấp': 'bg-green-100 text-green-700 border-l-4 border-green-500',
};

const statusStyles: Record<TaskStatus, { bg: string, text: string }> = {
    'Cần làm': { bg: 'bg-slate-200', text: 'text-slate-800' },
    'Đang làm': { bg: 'bg-blue-200', text: 'text-blue-800' },
    'Xem xét': { bg: 'bg-purple-200', text: 'text-purple-800' },
    'Hoàn thành': { bg: 'bg-green-200', text: 'text-green-800' },
}

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onSaveTask: (task: Task) => void;
    onDelete: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task: initialTask, onClose, onSaveTask, onDelete }) => {
    const [task, setTask] = useState(initialTask);
    const [newComment, setNewComment] = useState('');
    const [newLabelName, setNewLabelName] = useState('');

    const handleSave = () => {
        onSaveTask(task);
    };

    const handleChange = <K extends keyof Task>(field: K, value: Task[K]) => {
        setTask(current => ({ ...current, [field]: value }));
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment: TaskComment = {
            id: Date.now().toString(),
            author: 'Người dùng hiện tại',
            text: newComment,
            timestamp: Date.now()
        };
        setTask(current => ({ ...current, comments: [...(current.comments || []), comment] }));
        setNewComment('');
    };

    const handleAddLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newLabelName.trim()) {
            e.preventDefault();
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const newLabel: TaskLabel = { name: newLabelName.trim(), color: randomColor };
            setTask(current => ({ ...current, labels: [...(current.labels || []), newLabel] }));
            setNewLabelName('');
        }
    };

    const handleRemoveLabel = (indexToRemove: number) => {
        setTask(current => ({
            ...current,
            labels: current.labels?.filter((_, index) => index !== indexToRemove)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-[--color-surface-tertiary] backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up max-h-[90vh]">
                <header className="p-4 border-b border-[--color-border-secondary] flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[--color-text-primary]">{task.title}</h2>
                        <p className="text-sm text-[--color-text-secondary]">Dự án: {task.project}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary]" aria-label="Close">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </header>
                <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="task-status" className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Trạng thái</label>
                            <select
                                id="task-status"
                                value={task.status}
                                onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
                                className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                            >
                                <option value="Cần làm">Cần làm</option>
                                <option value="Đang làm">Đang làm</option>
                                <option value="Xem xét">Xem xét</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="task-dueDate" className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Ngày hết hạn</label>
                            <input
                                id="task-dueDate"
                                type="date"
                                value={task.dueDate || ''}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                                className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Nhãn (Labels)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(task.labels || []).map((label, index) => (
                                <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${label.color}`}>
                                    {label.name}
                                    <button type="button" onClick={() => handleRemoveLabel(index)} className="ml-1.5 hover:text-white/70">
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            onKeyDown={handleAddLabel}
                            placeholder="Gõ tên nhãn và nhấn Enter (VD: Quan trọng)"
                            className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] text-sm focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="task-notes" className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Ghi chú</label>
                        <textarea
                            id="task-notes"
                            value={task.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={4}
                            placeholder="Thêm ghi chú hoặc mô tả cho công việc này..."
                            className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none resize-y"
                        />
                    </div>
                    
                    <div className="border-t border-[--color-border-secondary] pt-4 mt-2">
                        <label className="text-sm font-semibold text-[--color-text-secondary] mb-3 block">Bình luận</label>
                        <div className="flex flex-col gap-3 mb-4">
                            {(task.comments || []).map(comment => (
                                <div key={comment.id} className="bg-white/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm text-[--color-text-primary]">{comment.author}</span>
                                        <span className="text-xs text-[--color-text-secondary]">{new Date(comment.timestamp).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <p className="text-sm text-[--color-text-primary]">{comment.text}</p>
                                </div>
                            ))}
                            {(!task.comments || task.comments.length === 0) && (
                                <p className="text-sm text-[--color-text-secondary] italic">Chưa có bình luận nào.</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận..."
                                className="flex-1 bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] text-sm focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                            />
                            <button 
                                type="button" 
                                onClick={handleAddComment}
                                className="px-4 py-2 bg-[--color-surface-secondary] dark:bg-white/10 hover:bg-[--color-surface-tertiary] rounded-md text-sm font-semibold text-[--color-text-primary] transition-colors"
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
                <footer className="p-4 mt-auto border-t border-[--color-border-secondary] flex justify-between items-center shrink-0">
                    <button 
                        type="button" 
                        onClick={() => onDelete(task.id)}
                        className="flex items-center gap-2 py-2 px-4 rounded-lg text-red-600 font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Xóa Công việc
                    </button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-[--color-text-secondary] font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Hủy</button>
                        <button type="button" onClick={handleSave} className="py-2 px-6 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">Lưu Công việc</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ 
    title: TaskStatus; 
    tasks: Task[]; 
    selectedTaskIds: string[];
    onSelectTask: (task: Task) => void; 
    onDeleteTask: (taskId: string) => void;
    onToggleSelection: (taskId: string) => void;
}> = ({ title, tasks, selectedTaskIds, onSelectTask, onDeleteTask, onToggleSelection }) => {
    const styles = statusStyles[title];
    return (
        <div className="flex-1 flex flex-col gap-4 p-4 bg-white/50 rounded-xl min-w-[300px]">
            <div className="flex justify-between items-center">
                <h2 className={`font-bold text-lg ${styles.text}`}>{title}</h2>
                <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${styles.bg} ${styles.text}`}>{tasks.length}</span>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2 -mr-2">
                {tasks.map(task => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                        <div 
                            key={task.id} 
                            onClick={() => onSelectTask(task)}
                            className={`relative group w-full text-left p-4 bg-white/80 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 ${priorityStyles[task.priority]} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            <label className="absolute top-2 left-2 z-10 p-1" onClick={(e) => { e.stopPropagation(); }}>
                                <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => onToggleSelection(task.id)}
                                    className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                />
                            </label>
                            <div className="flex justify-between items-start pl-6">
                                <h3 className="font-semibold text-slate-800">{task.title}</h3>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ml-2 shrink-0 ${statusStyles[task.status].bg} ${statusStyles[task.status].text}`}>
                                    {task.status}
                                </span>
                            </div>
                            {(task.labels && task.labels.length > 0) && (
                                <div className="flex flex-wrap gap-1 mt-2 pl-6">
                                    {task.labels.map((label, idx) => (
                                        <span key={idx} className={`px-2 py-0.5 text-[10px] font-bold rounded-md text-white ${label.color}`}>
                                            {label.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="text-sm text-slate-500 mt-1 pl-6">Dự án: {task.project}</p>
                            {task.dueDate && (
                                <div className="mt-2 pl-6 flex items-center gap-1.5 text-sm text-slate-600">
                                    <ClockIcon className="w-4 h-4" />
                                    <span className="font-medium">{new Date(task.dueDate + 'T00:00:00').toLocaleDateString('vi-VN')}</span>
                                </div>
                            )}
                            {task.notes && task.notes.trim().length > 0 && (
                                <div className="mt-2 pl-6 flex items-center gap-1.5 text-slate-600">
                                    <FileTextIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium">Có ghi chú</span>
                                </div>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTask(task.id);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white/50 rounded-full text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Xóa công việc"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


interface TaskViewProps {
    onItemViewed: (item: RecentItem) => void;
    onSendNotification?: (notif: Omit<AppNotification, 'id' | 'createdAt'>) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ onItemViewed, onSendNotification }) => {
    const columns: TaskStatus[] = ['Cần làm', 'Đang làm', 'Xem xét', 'Hoàn thành'];
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

    // 1 hr before notification polling
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                if (!task.dueDate) return;
                
                // Pretend the due date is midnight of that day, or just 23:59:59
                // Example due date format: "YYYY-MM-DD"
                const dueTime = new Date(`${task.dueDate}T23:59:59`);
                if (isNaN(dueTime.getTime())) return;
                
                const timeDiffMs = dueTime.getTime() - now.getTime();
                // Check if time difference is between 0 and 60 minutes
                if (timeDiffMs > 0 && timeDiffMs <= 60 * 60 * 1000) {
                    if (!notifiedTasks.has(task.id)) {
                        if (onSendNotification) {
                            onSendNotification({
                                userId: 'user-1',
                                title: 'Sắp đến hạn',
                                message: `Nhiệm vụ "${task.title}" sẽ hết hạn trong vòng 1 giờ nữa!`,
                                read: false,
                                type: 'task',
                                link: 'tasklist'
                            });
                        }
                        setNotifiedTasks(prev => new Set(prev).add(task.id));
                    }
                }
            });
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [tasks, notifiedTasks, onSendNotification]);

    const handleSelectTask = (task: Task) => {
        setSelectedTask(task);
        onItemViewed({
            id: `task-${task.id}`,
            name: task.title,
            type: 'tasks',
            icon: <ClipboardListIcon />,
            itemId: task.id
        });
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
    };

    const handleSaveTask = (updatedTask: Task) => {
        setTasks(currentTasks => 
            currentTasks.map(task => 
                task.id === updatedTask.id ? updatedTask : task
            )
        );
        handleCloseModal();
    };

    const handleDeleteRequest = (taskId: string) => {
        setSelectedTask(null); // Ensure detail modal is closed
        setTaskToDeleteId(taskId);
    };

    const handleConfirmDelete = () => {
        if (taskToDeleteId) {
            setTasks(currentTasks => currentTasks.filter(task => task.id !== taskToDeleteId));
            setTaskToDeleteId(null);
            setSelectedTaskIds(prev => prev.filter(id => id !== taskToDeleteId));
        }
    };

    const handleCancelDelete = () => {
        setTaskToDeleteId(null);
    };

    const handleToggleSelection = (taskId: string) => {
        setSelectedTaskIds(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Bạn có chắc muốn xóa ${selectedTaskIds.length} nhiệm vụ đã chọn?`)) {
            setTasks(currentTasks => currentTasks.filter(task => !selectedTaskIds.includes(task.id)));
            setSelectedTaskIds([]);
        }
    };

    const handleBulkMove = (newStatus: TaskStatus) => {
        setTasks(currentTasks => currentTasks.map(task => 
            selectedTaskIds.includes(task.id) ? { ...task, status: newStatus } : task
        ));
        setSelectedTaskIds([]);
    };

    const handleBulkPriority = (newPriority: TaskPriority) => {
        setTasks(currentTasks => currentTasks.map(task => 
            selectedTaskIds.includes(task.id) ? { ...task, priority: newPriority } : task
        ));
        setSelectedTaskIds([]);
    };

    const taskCounts = columns.reduce((acc, status) => {
        acc[status] = tasks.filter(t => t.status === status).length;
        return acc;
    }, {} as Record<TaskStatus, number>);

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-6 relative">
            {taskToDeleteId && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
                    <div className="relative w-full max-w-md bg-[--color-surface-tertiary] backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
                        <header className="p-4 border-b border-[--color-border-secondary]">
                            <h2 className="text-lg font-bold text-[--color-text-primary]">Xác nhận Xóa</h2>
                        </header>
                        <div className="p-5">
                            <p className="text-[--color-text-secondary]">Bạn có chắc chắn muốn xóa công việc này không? Hành động này không thể hoàn tác.</p>
                        </div>
                        <footer className="p-4 border-t border-[--color-border-secondary] flex justify-end gap-3">
                            <button type="button" onClick={handleCancelDelete} className="py-2 px-5 rounded-lg text-[--color-text-secondary] font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Hủy</button>
                            <button type="button" onClick={handleConfirmDelete} className="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow-md">Xác nhận Xóa</button>
                        </footer>
                    </div>
                </div>
            )}
            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask}
                    onClose={handleCloseModal}
                    onSaveTask={handleSaveTask}
                    onDelete={handleDeleteRequest}
                />
            )}
            <div className="shrink-0 mb-6">
                <TaskManagementBanner />
            </div>

            {/* Task Summary Dashboard */}
            <div className="shrink-0 mb-6 bg-white/50 backdrop-blur-md rounded-xl p-4 shadow-sm flex items-center justify-around">
                {columns.map(status => (
                    <div key={status} className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-slate-800">{taskCounts[status]}</span>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${statusStyles[status].text}`}>{status}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {columns.map(status => (
                    <KanbanColumn 
                        key={status} 
                        title={status}
                        tasks={tasks.filter(t => t.status === status)}
                        selectedTaskIds={selectedTaskIds}
                        onSelectTask={handleSelectTask}
                        onDeleteTask={handleDeleteRequest}
                        onToggleSelection={handleToggleSelection}
                    />
                ))}
            </div>

            {/* Bulk Actions Context Bar */}
            {selectedTaskIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl animate-fade-in-up z-30">
                    <span className="font-semibold">{selectedTaskIds.length} phần tử được chọn</span>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Chuyển thẻ:</span>
                        <select className="bg-slate-700 text-sm rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-500" onChange={(e) => { if(e.target.value) handleBulkMove(e.target.value as TaskStatus); }}>
                            <option value="">-- Chọn --</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Mức độ:</span>
                        <select className="bg-slate-700 text-sm rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-500" onChange={(e) => { if(e.target.value) handleBulkPriority(e.target.value as TaskPriority); }}>
                            <option value="">-- Chọn --</option>
                            <option value="Cao">Cao</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Thấp">Thấp</option>
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <button onClick={handleBulkDelete} className="text-red-400 hover:text-red-300 font-semibold text-sm transition-colors">
                        Xóa
                    </button>
                    <button onClick={() => setSelectedTaskIds([])} className="ml-2 hover:bg-slate-700 p-1 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                </div>
            )}
        </main>
    );
};

export default TaskView;