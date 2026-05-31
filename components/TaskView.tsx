import React, { useState } from 'react';
import TaskManagementBanner from './TaskManagementBanner';
import { FileTextIcon, XIcon, ClipboardListIcon, TrashIcon, ClockIcon } from './icons';
import { RecentItem } from '../App';

type TaskStatus = 'Todo' | 'Doing' | 'Review' | 'Done';
type TaskPriority = 'Cao' | 'Trung bình' | 'Thấp';

interface Task {
    id: string;
    title: string;
    project: string;
    priority: TaskPriority;
    status: TaskStatus;
    notes?: string;
    dueDate?: string;
}

const mockTasks: Task[] = [
    { id: 't1', title: 'Thiết kế banner quảng cáo', project: 'Marketing Mùa lễ hội', priority: 'Cao', status: 'Todo', notes: 'Yêu cầu: Kích thước 1200x628px. Tone màu chủ đạo là đỏ và vàng. Chèn logo ở góc phải.', dueDate: '2024-08-10' },
    { id: 't2', title: 'Phân tích hành vi người dùng', project: 'Tối ưu hóa Onboarding', priority: 'Cao', status: 'Doing', notes: '', dueDate: '2024-08-15' },
    { id: 't3', title: 'Viết nội dung social media', project: 'Marketing Mùa lễ hội', priority: 'Trung bình', status: 'Todo' },
    { id: 't4', title: 'Test A/B trang giá', project: 'Tối ưu hóa Conversion', priority: 'Trung bình', status: 'Review', notes: 'So sánh 2 phiên bản: layout 3 cột và layout bảng giá chi tiết. Liên hệ team design để lấy file Figma.', dueDate: '2024-08-05' },
    { id: 't5', 'title': 'Fix bug #512 - Nút submit bị vô hiệu hóa', project: 'Bảo trì hệ thống', priority: 'Cao', status: 'Doing', notes: 'Bug xảy ra trên trình duyệt Safari phiên bản 15.x. Cần kiểm tra lại logic validation form.' },
    { id: 't6', title: 'Lên kế hoạch cho Q1/2025', project: 'Chiến lược công ty', priority: 'Thấp', status: 'Done' },
    { id: 't7', title: 'Redesign trang đăng ký', project: 'Tối ưu hóa Onboarding', priority: 'Trung bình', status: 'Review' },
    { id: 't8', 'title': 'Cập nhật thư viện dependencies', project: 'Bảo trì hệ thống', priority: 'Thấp', status: 'Done', notes: 'Chạy `npm audit` để kiểm tra các lỗ hổng bảo mật sau khi cập nhật.' },
];

const priorityStyles: Record<TaskPriority, string> = {
    'Cao': 'bg-red-100 text-red-700 border-l-4 border-red-500',
    'Trung bình': 'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500',
    'Thấp': 'bg-green-100 text-green-700 border-l-4 border-green-500',
};

const statusStyles: Record<TaskStatus, { bg: string, text: string }> = {
    'Todo': { bg: 'bg-slate-200', text: 'text-slate-800' },
    'Doing': { bg: 'bg-blue-200', text: 'text-blue-800' },
    'Review': { bg: 'bg-purple-200', text: 'text-purple-800' },
    'Done': { bg: 'bg-green-200', text: 'text-green-800' },
}

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onSaveTask: (task: Task) => void;
    onDelete: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task: initialTask, onClose, onSaveTask, onDelete }) => {
    const [task, setTask] = useState(initialTask);

    const handleSave = () => {
        onSaveTask(task);
    };

    const handleChange = <K extends keyof Task>(field: K, value: Task[K]) => {
        setTask(current => ({ ...current, [field]: value }));
    };


    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-[--color-surface-tertiary] backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up max-h-full">
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
                                <option value="Todo">Todo</option>
                                <option value="Doing">Doing</option>
                                <option value="Review">Review</option>
                                <option value="Done">Done</option>
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
                        <label htmlFor="task-notes" className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Ghi chú</label>
                        <textarea
                            id="task-notes"
                            value={task.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={8}
                            placeholder="Thêm ghi chú hoặc mô tả cho công việc này..."
                            className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none resize-y"
                        />
                    </div>
                </div>
                <footer className="p-4 mt-auto border-t border-[--color-border-secondary] flex justify-between items-center shrink-0">
                    <button 
                        type="button" 
                        onClick={() => onDelete(task.id)}
                        className="flex items-center gap-2 py-2 px-4 rounded-lg text-red-600 font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Delete Task
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

const KanbanColumn: React.FC<{ title: TaskStatus; tasks: Task[]; onSelectTask: (task: Task) => void; onDeleteTask: (taskId: string) => void; }> = ({ title, tasks, onSelectTask, onDeleteTask }) => {
    const styles = statusStyles[title];
    return (
        <div className="flex-1 flex flex-col gap-4 p-4 bg-white/50 rounded-xl min-w-[300px]">
            <div className="flex justify-between items-center">
                <h2 className={`font-bold text-lg ${styles.text}`}>{title}</h2>
                <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${styles.bg} ${styles.text}`}>{tasks.length}</span>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2 -mr-2">
                {tasks.map(task => (
                    <div 
                        key={task.id} 
                        onClick={() => onSelectTask(task)}
                        className={`relative group w-full text-left p-4 bg-white/80 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 ${priorityStyles[task.priority]}`}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-slate-800">{task.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ml-2 shrink-0 ${statusStyles[task.status].bg} ${statusStyles[task.status].text}`}>
                                {task.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Dự án: {task.project}</p>
                        {task.dueDate && (
                            <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                                <ClockIcon className="w-4 h-4" />
                                <span className="font-medium">{new Date(task.dueDate + 'T00:00:00').toLocaleDateString('vi-VN')}</span>
                            </div>
                        )}
                        {task.notes && task.notes.trim().length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-slate-600">
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
                            aria-label="Delete task"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface TaskViewProps {
    onItemViewed: (item: RecentItem) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ onItemViewed }) => {
    const columns: TaskStatus[] = ['Todo', 'Doing', 'Review', 'Done'];
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

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
        }
    };

    const handleCancelDelete = () => {
        setTaskToDeleteId(null);
    };

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-6">
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
            <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {columns.map(status => (
                    <KanbanColumn 
                        key={status} 
                        title={status}
                        tasks={tasks.filter(t => t.status === status)}
                        onSelectTask={handleSelectTask}
                        onDeleteTask={handleDeleteRequest}
                    />
                ))}
            </div>
        </main>
    );
};

export default TaskView;