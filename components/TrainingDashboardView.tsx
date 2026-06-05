import React, { useState, useEffect, useMemo } from 'react';
import { User, View } from '../App';
import { useLanguage } from './LanguageContext';
import TrainingBanner from './TrainingBanner';
import { 
  Plus, 
  User as UserIcon, 
  Share2, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Search, 
  X, 
  BookOpen, 
  Home, 
  Check 
} from 'lucide-react';

export interface ClassInfo {
    id: string;
    name: string;
    section?: string;  // Phần
    teacher: string;
    subject: string;
    room?: string;      // Phòng học
    image: string;      // URLảnh hoặc theme-id
}

// Preset Google Classroom style gradient theme headers
export const presetThemes = [
  { id: 'theme-teal', name: 'Màu Mòng Két (Teal)', gradient: 'linear-gradient(135deg, #0d9488, #115e59)', lightBg: '#f0fdfa', text: '#0d9488', activeBorder: 'border-teal-500' },
  { id: 'theme-blue', name: 'Xanh Cổ Điển (Classic Blue)', gradient: 'linear-gradient(135deg, #2563eb, #1e3a8a)', lightBg: '#eff6ff', text: '#2563eb', activeBorder: 'border-blue-500' },
  { id: 'theme-purple', name: 'Oải Hương (Violet/Indigo)', gradient: 'linear-gradient(135deg, #7c3aed, #4c1d95)', lightBg: '#f5f3ff', text: '#7c3aed', activeBorder: 'border-purple-500' },
  { id: 'theme-coral', name: 'San Hô Đỏ (Coral)', gradient: 'linear-gradient(135deg, #f43f5e, #be123c)', lightBg: '#fff1f2', text: '#f43f5e', activeBorder: 'border-rose-500' },
  { id: 'theme-emerald', name: 'Ngọc Lục Bảo (Emerald)', gradient: 'linear-gradient(135deg, #10b981, #064e3b)', lightBg: '#ecfdf5', text: '#10b981', activeBorder: 'border-emerald-500' },
  { id: 'theme-amber', name: 'Hổ Phách (Amber)', gradient: 'linear-gradient(135deg, #f59e0b, #78350f)', lightBg: '#fffbeb', text: '#d97706', activeBorder: 'border-amber-500' }
];

// Mock Data
export const mockClasses: ClassInfo[] = [
    { id: 'class-1', name: 'Kỹ năng Quản lý Thời gian', teacher: 'Trần Văn An', subject: 'Phát triển bản thân', section: 'Mùa thu 2026', room: 'Phòng 201', image: 'theme-purple' },
    { id: 'class-2', name: 'Marketing Kỹ thuật số 101', teacher: 'Hoàng Văn Em', subject: 'Marketing', section: 'Bộ phận Kinh Doanh', room: 'Phòng Hội nghị', image: 'theme-teal' },
    { id: 'class-3', name: 'Nhập môn Lập trình React', teacher: 'Phạm Minh Cường', subject: 'Công nghệ', section: 'Đội ngũ IT', room: 'Phòng Lab 1', image: 'theme-blue' },
    { id: 'class-4', name: 'An toàn Thông tin Doanh nghiệp', teacher: 'Lê Thị Bình', subject: 'Bảo mật', section: 'Dành cho tất cả nhân viên', room: 'Sảnh lớn', image: 'theme-coral' },
];

// Helper to render banner backgrounds
export const ClassBannerBg: React.FC<{ image: string; className?: string }> = ({ image, className = "w-full h-full" }) => {
    const isPreset = image.startsWith('theme-');
    const theme = presetThemes.find(t => t.id === image) || presetThemes[0];
    
    if (isPreset) {
        return (
            <div 
                className={`${className} relative overflow-hidden flex flex-col justify-end`}
                style={{ background: theme.gradient }}
            >
                {/* Vintage Classroom Grid Accent Overlay */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
            </div>
        );
    }
    
    return <img src={image} className={`${className} object-cover`} alt="" referrerPolicy="no-referrer" />;
};

interface ClassCardProps {
    classInfo: ClassInfo;
    user: User;
    onNavigate: (view: View, classId: string) => void;
    onShare: (classInfo: ClassInfo) => void;
    onEdit: (classInfo: ClassInfo) => void;
    onDelete: (classId: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classInfo, user, onNavigate, onShare, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const handleOutsideClick = () => setShowMenu(false);
        if (showMenu) {
            document.addEventListener('click', handleOutsideClick);
        }
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [showMenu]);

    // Teacher avatar placeholder
    const firstLetter = classInfo.teacher ? classInfo.teacher.charAt(0).toUpperCase() : 'T';

    // Retrieve the computed completion rate for employee pathway
    const completionRate = useMemo(() => {
        if (!classInfo?.id || !user?.id) return 0;
        const rateStr = localStorage.getItem(`course_completion_rate_${classInfo.id}_${user.id}`);
        if (rateStr) return parseInt(rateStr, 10);

        const stepStr = localStorage.getItem(`course_step_idx_${classInfo.id}_${user.id}`);
        if (stepStr && parseInt(stepStr, 10) > 0) {
            return 25; // fallback starter progress
        }
        return 0;
    }, [classInfo.id, user?.id]);

    const statusInfo = useMemo(() => {
        const isCompleted = completionRate === 100 || localStorage.getItem(`course_completed_${classInfo.id}_${user.id}`) === 'true';
        if (isCompleted) {
            return {
                label: 'Đã hoàn thành',
                bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-150/15',
                bar: 'bg-emerald-500'
            };
        }
        if (completionRate > 0) {
            return {
                label: 'Đang học',
                bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-150/15',
                bar: 'bg-amber-500'
            };
        }
        return {
            label: 'Chưa bắt đầu',
            bg: 'bg-slate-50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/40',
            bar: 'bg-slate-200 dark:bg-slate-800'
        };
    }, [completionRate, classInfo.id, user?.id]);

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/90 rounded-xl shadow-xs overflow-hidden flex flex-col group text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative">
            
            {/* Header / Banner region */}
            <div className="relative h-28 w-full group/banner cursor-pointer shrink-0 overflow-hidden" onClick={() => onNavigate('class-detail', classInfo.id)}>
                <div className="w-full h-full transform group-hover/banner:scale-105 transition-transform duration-500">
                    <ClassBannerBg image={classInfo.image} className="w-full h-full" />
                </div>
                <div className="absolute inset-0 bg-black/20 group-hover/banner:bg-black/30 transition-all"></div>
                
                {/* Text Content inside the Class Banner */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pb-3 flex flex-col z-10 text-white min-w-0">
                    <h3 className="text-base font-extrabold leading-tight text-white group-hover/banner:underline truncate">
                        {classInfo.name}
                    </h3>
                    <p className="text-white/80 text-xs truncate mt-0.5">
                        {classInfo.section || classInfo.subject}
                    </p>
                </div>

                {/* Overlaid settings trigger */}
                <div className="absolute top-2.5 right-2.5 z-20">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="p-1.5 bg-black/20 hover:bg-black/40 text-white hover:text-white rounded-full transition-all focus:outline-none"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-30 min-w-28 text-sm text-slate-700 dark:text-slate-200">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(classInfo); }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(classInfo.id); }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-500 font-medium flex items-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa lớp
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlaid Teacher Avatar standard to Google Classroom */}
            <div className="absolute right-4 top-20 w-11 h-11 rounded-full border-2 border-white dark:border-slate-900 bg-sky-500 text-white font-extrabold shadow-md flex items-center justify-center text-sm z-10">
                {firstLetter}
            </div>

            {/* Center Content / Teacher Details */}
            <div className="flex-1 p-4 pt-5 pb-3 flex flex-col justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{classInfo.teacher}</span>
                    </div>
                    {classInfo.room && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 pl-0.5">
                            <Home className="w-3" />
                            <span>Phòng: {classInfo.room}</span>
                        </div>
                    )}
                    
                    {/* Sleek Progress Status Badge & Bar */}
                    <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/60 mt-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">Trạng thái học tập</span>
                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                <span>Tiến độ hoàn tất</span>
                                <span className={completionRate === 100 ? 'text-emerald-500' : ''}>{completionRate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${statusInfo.bar}`}
                                    style={{ width: `${completionRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 mt-auto flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {classInfo.subject}
                </span>

                <div className="flex gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onShare(classInfo); }}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-all"
                        title="Sao chép link lớp học"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                     <button 
                        onClick={() => onNavigate('class-detail', classInfo.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 rounded-lg transition-all"
                        title="Vào lớp học"
                     >
                         <BookOpen className="w-4 h-4" />
                     </button>
                </div>
            </div>
        </div>
    );
};

interface TrainingDashboardViewProps {
  user: User;
  onNavigate: (view: View, classId?: string) => void;
}

const TrainingDashboardView: React.FC<TrainingDashboardViewProps> = ({ user, onNavigate }) => {
    const { t } = useLanguage();
    
    // Manage class states with localStorage support!
    const [classes, setClasses] = useState<ClassInfo[]>(() => {
        const stored = localStorage.getItem('classroom_classes');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        return mockClasses;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [progressFilter, setProgressFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all');
    const [toastMessage, setToastMessage] = useState('');

    // Modal forms states
    const [showEditAddModal, setShowEditAddModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingClassId, setEditingClassId] = useState<string | null>(null);

    // Form fields states based exactly on Google Classroom Create Class fields
    const [fieldName, setFieldName] = useState('');
    const [fieldSection, setFieldSection] = useState('');
    const [fieldSubject, setFieldSubject] = useState('');
    const [fieldRoom, setFieldRoom] = useState('');
    const [fieldImageTheme, setFieldImageTheme] = useState('theme-teal');
    const [customUnsplashUrl, setCustomUnsplashUrl] = useState('');
    const [isCustomCover, setIsCustomCover] = useState(false);

    // Save classes update to localStorage
    const updateClassesList = (newList: ClassInfo[]) => {
        setClasses(newList);
        localStorage.setItem('classroom_classes', JSON.stringify(newList));
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage('');
        }, 2500);
    };

    const handleShareClass = (classInfo: ClassInfo) => {
        const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=class&shareId=${classInfo.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast(`Đã sao chép liên kết khoá đào tạo: "${classInfo.name}"!`);
        }).catch(() => {
            // Fallback copy
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(`Đã sao chép liên kết khoá đào tạo: "${classInfo.name}"!`);
        });
    };

    const handleOpenCreateModal = () => {
        setModalMode('create');
        setEditingClassId(null);
        setFieldName('');
        setFieldSection('');
        setFieldSubject('');
        setFieldRoom('');
        setFieldImageTheme(presetThemes[Math.floor(Math.random() * presetThemes.length)].id);
        setCustomUnsplashUrl('');
        setIsCustomCover(false);
        setShowEditAddModal(true);
    };

    const handleOpenEditModal = (classInfo: ClassInfo) => {
        setModalMode('edit');
        setEditingClassId(classInfo.id);
        setFieldName(classInfo.name);
        setFieldSection(classInfo.section || '');
        setFieldSubject(classInfo.subject);
        setFieldRoom(classInfo.room || '');
        
        if (classInfo.image.startsWith('theme-')) {
            setFieldImageTheme(classInfo.image);
            setCustomUnsplashUrl('');
            setIsCustomCover(false);
        } else {
            setFieldImageTheme('theme-teal');
            setCustomUnsplashUrl(classInfo.image);
            setIsCustomCover(true);
        }
        setShowEditAddModal(true);
    };

    const handleDeleteClass = (classId: string) => {
        const matched = classes.find(c => c.id === classId);
        if (!matched) return;
        
        if (confirm(`Bạn có chắc chắn muốn xóa lớp học "${matched.name}" không? Hành động này sẽ xóa tất cả chủ đề và bài giảng liên quan.`)) {
            const newList = classes.filter(c => c.id !== classId);
            updateClassesList(newList);
            // Delete accompanying classwork from localStorage too to keep tidy
            localStorage.removeItem(`classroom_classworks_${classId}`);
            showToast(`Đã xóa lớp học "${matched.name}"`);
        }
    };

    const handleSaveClass = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!fieldName.trim()) {
            alert('Tên lớp học là bắt buộc.');
            return;
        }

        const coverValue = isCustomCover ? (customUnsplashUrl.trim() || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800') : fieldImageTheme;

        if (modalMode === 'create') {
            const newClass: ClassInfo = {
                id: `class-${Date.now()}`,
                name: fieldName.trim(),
                section: fieldSection.trim() || undefined,
                teacher: user?.name || 'Trần Văn An',
                subject: fieldSubject.trim() || 'Khác',
                room: fieldRoom.trim() || undefined,
                image: coverValue
            };
            const newList = [...classes, newClass];
            updateClassesList(newList);
            showToast(`Đã tạo thành công lớp học "${newClass.name}"!`);
        } else if (modalMode === 'edit' && editingClassId) {
            const newList = classes.map(c => c.id === editingClassId ? {
                ...c,
                name: fieldName.trim(),
                section: fieldSection.trim() || undefined,
                subject: fieldSubject.trim() || 'Khác',
                room: fieldRoom.trim() || undefined,
                image: coverValue
            } : c);
            updateClassesList(newList);
            showToast(`Đã cập nhật lớp học!`);
        }

        setShowEditAddModal(false);
    };

    // Filter classes based on search and progress tracking profiles
    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || (
                c.name.toLowerCase().includes(query) ||
                c.subject.toLowerCase().includes(query) ||
                c.teacher.toLowerCase().includes(query) ||
                (c.section && c.section.toLowerCase().includes(query))
            );
            if (!matchesSearch) return false;

            // Get progress rate from our synced localStorage key
            const rateStr = localStorage.getItem(`course_completion_rate_${c.id}_${user.id}`);
            const rate = rateStr ? parseInt(rateStr, 10) : 0;
            const isCompleted = rate === 100 || localStorage.getItem(`course_completed_${c.id}_${user.id}`) === 'true';

            if (progressFilter === 'completed') {
                return isCompleted;
            }
            if (progressFilter === 'in-progress') {
                return !isCompleted && (rate > 0 || (localStorage.getItem(`course_step_idx_${c.id}_${user.id}`) && parseInt(localStorage.getItem(`course_step_idx_${c.id}_${user.id}`)!, 10) > 0));
            }
            if (progressFilter === 'not-started') {
                const stepIdx = localStorage.getItem(`course_step_idx_${c.id}_${user.id}`);
                const step = stepIdx ? parseInt(stepIdx, 10) : 0;
                return rate === 0 && step === 0 && !isCompleted;
            }
            return true;
        });
    }, [classes, searchQuery, progressFilter, user?.id]);

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] gap-3 pb-24 md:pb-8 relative">
            <div className="shrink-0">
                <TrainingBanner />
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4">
                
                {/* Control bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('myClasses')}</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Quản lý và tổ chức các lớp học giáo dục nội bộ.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        
                        {/* Search Input Box */}
                        <div className="relative flex-1 sm:flex-initial">
                            <input 
                                type="text"
                                placeholder="Tìm kiếm lớp học..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* Plus button inside the header */}
                        <button 
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all shrink-0 active:scale-95 duration-75 text-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tạo lớp học mới</span>
                        </button>
                    </div>
                </div>

                {/* Progress Filter Segmented Controls */}
                <div className="flex flex-wrap items-center gap-1.5 border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 rounded-2xl p-2.5 shrink-0 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 ml-1.5 mr-2">Trạng thái:</span>
                    <button
                        onClick={() => setProgressFilter('all')}
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all border cursor-pointer ${progressFilter === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-transparent border-transparent text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Tất cả ({classes.length})
                    </button>
                    <button
                        onClick={() => setProgressFilter('completed')}
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all border cursor-pointer ${progressFilter === 'completed' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' : 'bg-transparent border-transparent text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Đã hoàn thành ({classes.filter(c => {
                            const r = parseInt(localStorage.getItem(`course_completion_rate_${c.id}_${user.id}`) || '0', 10);
                            const isComp = r === 100 || localStorage.getItem(`course_completed_${c.id}_${user.id}`) === 'true';
                            return isComp;
                        }).length})
                    </button>
                    <button
                        onClick={() => setProgressFilter('in-progress')}
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all border cursor-pointer ${progressFilter === 'in-progress' ? 'bg-amber-600 border-amber-600 text-white shadow-xs' : 'bg-transparent border-transparent text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Đang học ({classes.filter(c => {
                            const r = parseInt(localStorage.getItem(`course_completion_rate_${c.id}_${user.id}`) || '0', 10);
                            const stepStr = localStorage.getItem(`course_step_idx_${c.id}_${user.id}`);
                            const stepVal = stepStr ? parseInt(stepStr, 10) : 0;
                            const isComp = r === 100 || localStorage.getItem(`course_completed_${c.id}_${user.id}`) === 'true';
                            return !isComp && (r > 0 || stepVal > 0);
                        }).length})
                    </button>
                    <button
                        onClick={() => setProgressFilter('not-started')}
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all border cursor-pointer ${progressFilter === 'not-started' ? 'bg-slate-600 border-slate-600 text-white shadow-xs' : 'bg-transparent border-transparent text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Chưa bắt đầu ({classes.filter(c => {
                            const r = parseInt(localStorage.getItem(`course_completion_rate_${c.id}_${user.id}`) || '0', 10);
                            const stepStr = localStorage.getItem(`course_step_idx_${c.id}_${user.id}`);
                            const stepVal = stepStr ? parseInt(stepStr, 10) : 0;
                            const isComp = r === 100 || localStorage.getItem(`course_completed_${c.id}_${user.id}`) === 'true';
                            return r === 0 && stepVal === 0 && !isComp;
                        }).length})
                    </button>
                </div>

                {/* Grid view of classes */}
                {filteredClasses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                        {filteredClasses.map(classInfo => (
                            <ClassCard 
                                key={classInfo.id} 
                                classInfo={classInfo} 
                                user={user}
                                onNavigate={onNavigate} 
                                onShare={handleShareClass}
                                onEdit={handleOpenEditModal}
                                onDelete={handleDeleteClass}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center mb-4">
                            <BookOpen className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy lớp học nào</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">Tạo một lớp học đào tạo mới hoặc điều chỉnh truy vấn tìm kiếm của bạn.</p>
                        <button 
                            onClick={handleOpenCreateModal}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" /> Tạo lớp học ngay
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Edit / Add Modal representing Google Classroom styled "Tạo lớp học" */}
            {showEditAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex justify-center items-center p-4 overflow-y-auto" aria-modal="true" role="dialog">
                    <div className="absolute inset-0" onClick={() => setShowEditAddModal(false)}></div>
                    <form onSubmit={handleSaveClass} className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col my-8 animate-scale-in overflow-hidden">
                        
                        {/* Header banner gradient theme representing active choice */}
                        <div 
                            className="p-5 md:p-6 text-white relative h-32 flex flex-col justify-end text-left shrink-0"
                            style={{ 
                                background: isCustomCover 
                                    ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${customUnsplashUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=850'}) center/cover` 
                                    : (presetThemes.find(t => t.id === fieldImageTheme)?.gradient || presetThemes[0].gradient)
                            }}
                        >
                            <button 
                                type="button" 
                                onClick={() => setShowEditAddModal(false)} 
                                className="absolute top-4 right-4 p-1.5 bg-black/25 hover:bg-black/50 text-white rounded-full transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="absolute top-4 left-5 bg-white/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                Google Lớp học
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-white leading-tight">
                                    {modalMode === 'create' ? 'Tạo lớp học mới' : 'Chỉnh sửa chi tiết lớp'}
                                </h3>
                                <p className="text-[11px] text-white/80 mt-0.5">Đặt tên, phân chia danh mục và lựa chọn chủ đề hiển thị</p>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 md:p-6 overflow-y-auto space-y-4 max-h-[60vh] text-left no-scrollbar">
                            
                            {/* Class name required input */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Tên lớp học (bắt buộc) *</label>
                                <input 
                                    type="text" 
                                    placeholder="Ví dụ: Kỹ năng Chăm sóc Khách hàng chuyên nghiệp"
                                    value={fieldName}
                                    onChange={e => setFieldName(e.target.value)}
                                    required
                                    className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {/* Section input */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Phần (Phân hệ, Khoa ban)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ví dụ: Phòng CSKH, Đội kỹ thuật..."
                                    value={fieldSection}
                                    onChange={e => setFieldSection(e.target.value)}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            {/* Column inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 block">Chủ đề bài giảng (Subject)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ví dụ: Chuyên môn, Kỹ năng mềm"
                                        value={fieldSubject}
                                        onChange={e => setFieldSubject(e.target.value)}
                                        className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3.5 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 block">Phòng học (Nếu có)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ví dụ: Phòng Hội nghị G, Zoom"
                                        value={fieldRoom}
                                        onChange={e => setFieldRoom(e.target.value)}
                                        className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3.5 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Theme styling and Preset theme color selection Grid */}
                            <div className="space-y-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                    <span>Chọn chủ đề hình nền</span>
                                    
                                    {/* Unsplash Custom Selector Tab */}
                                    <button 
                                        type="button"
                                        onClick={() => setIsCustomCover(!isCustomCover)}
                                        className="text-[10px] text-blue-600 hover:text-blue-700 underline tracking-wide font-bold"
                                    >
                                        {isCustomCover ? 'Chọn màu dải màu mặc định' : 'Tải hình nền tùy chọn (Unsplash URL)'}
                                    </button>
                                </div>

                                {!isCustomCover ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                                        {presetThemes.map(theme => (
                                            <button
                                                key={theme.id}
                                                type="button"
                                                onClick={() => setFieldImageTheme(theme.id)}
                                                style={{ background: theme.gradient }}
                                                className={`h-11 rounded-lg border-2 relative transition-all duration-150 transform hover:scale-[1.03] shadow-xs flex items-center justify-center ${fieldImageTheme === theme.id ? 'border-sky-500 ring-2 ring-sky-300' : 'border-slate-200 dark:border-slate-800 hover:opacity-90'}`}
                                                title={theme.name}
                                            >
                                                {fieldImageTheme === theme.id && (
                                                    <div className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 animate-fade-in-up">
                                        <input 
                                            type="url"
                                            placeholder="Nhập link ảnh Unsplash (e.g. https://images.unsplash.com/field...)"
                                            value={customUnsplashUrl}
                                            onChange={e => setCustomUnsplashUrl(e.target.value)}
                                            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-800 dark:text-white"
                                        />
                                        <p className="text-[10px] text-slate-400">Gợi ý: Dán đường lẫm ảnh phong cảnh ngang từ Unsplash.com để bao phủ lớp học sinh động.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900">
                            <button 
                                type="button"
                                onClick={() => setShowEditAddModal(false)}
                                className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                type="submit"
                                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 text-xs transition-colors"
                            >
                                {modalMode === 'create' ? 'Tạo lớp học' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-[1001] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-xs font-bold">{toastMessage}</span>
                </div>
            )}
        </main>
    );
};

export default TrainingDashboardView;
