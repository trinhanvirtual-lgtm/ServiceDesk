import React, { useState, useMemo, useEffect } from 'react';
import { User, View } from '../App';
import { useLanguage } from './LanguageContext';
import { initialContacts } from './ContactsView';
import { ClassBannerBg, mockClasses, ClassInfo } from './TrainingDashboardView';
import { OnlineLearningView } from './OnlineLearningView';
import { 
  MessageSquare, 
  ClipboardList, 
  Users, 
  BarChart2, 
  Plus, 
  X, 
  FileText, 
  Link as LinkIcon, 
  Video, 
  ArrowLeft, 
  ExternalLink, 
  Trash2, 
  Clock, 
  MessageCircle, 
  Sparkles, 
  Calendar, 
  Send, 
  Bookmark,
  PlayCircle,
  Award,
  Check
} from 'lucide-react';

export interface Material {
    id: string;
    type: 'pdf' | 'link' | 'video' | 'assignment' | 'question';
    title: string;
    instructions?: string;
    linkUrl?: string;
    dueDate?: string; // YYYY-MM-DD
    points?: number;  // points e.g. 100
}

export interface Topic {
    topicId: string;
    topicName: string;
    materials: Material[];
}

export interface StreamComment {
    id: string;
    author: string;
    text: string;
    createdAt: number;
}

export interface StreamPost {
    id: string;
    author: string;
    type: 'announcement' | 'system';
    title: string;
    text?: string;
    createdAt: number;
    linkUrl?: string;
    materialId?: string;
    comments?: StreamComment[];
}

// Default Classwork for Class-1
const initialClasswork: Topic[] = [
    { 
        topicId: 'topic-1',
        topicName: 'Chương 1: Giới thiệu & Tổng quan',
        materials: [
            { id: 'mat-1', type: 'pdf', title: 'Slide bài giảng - Giới thiệu khóa học', instructions: 'Slide chính cung cấp cái nhìn tổng quan về lộ trình học tập, tài liệu học và tiêu chí đánh giá.', linkUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=20&w=400' },
            { id: 'mat-2', type: 'link', title: 'Tài liệu tham khảo bắt buộc', instructions: 'Các tài nguyên đọc thêm phục vụ thảo luận bài học.', linkUrl: 'https://google.com' },
        ]
    },
    { 
        topicId: 'topic-2',
        topicName: 'Chương 2: Thiết lập mục tiêu SMART',
        materials: [
            { id: 'mat-3', type: 'video', title: 'Video bài giảng - Mục tiêu SMART là gì?', instructions: 'Xem video sau đó trả lời câu hỏi gắn kèm trong bài tập dưới đây.', linkUrl: 'https://youtube.com' },
            { id: 'mat-4', type: 'assignment', title: 'Bài tập 1: Xác định 3 mục tiêu SMART cho tháng tới', instructions: 'Hãy nêu chi tiết 3 mục tiêu SMART của riêng phòng ban bạn cho tháng 7 năm 2026.', dueDate: '2026-07-05', points: 100 },
        ]
    },
    { 
        topicId: 'topic-3',
        topicName: 'Chương 3: Ma trận Eisenhower',
        materials: [
             { id: 'mat-5', type: 'video', title: 'Video bài giảng - Phân loại công việc hiệu quả', instructions: 'Phương pháp Eisenhower để phân bổ công việc khẩn cấp / quan trọng.', linkUrl: 'https://youtube.com' },
             { id: 'mat-6', type: 'assignment', title: 'Bài tập 2: Phân loại các công việc hiện tại', instructions: 'Liệt kê 8 việc bạn đang làm và định vị vào 4 góc phần tư của ma trận.', dueDate: '2026-07-12', points: 100 },
        ]
    }
];

// Helper icon for materials
const MaterialIcon: React.FC<{type: string}> = ({ type }) => {
    const baseClass = "w-10 h-10 flex items-center justify-center rounded-xl shrink-0";
    switch(type) {
        case 'pdf': return <div className={`${baseClass} bg-red-100 text-red-600`}><FileText className="w-5 h-5"/></div>;
        case 'link': return <div className={`${baseClass} bg-blue-100 text-blue-600`}><LinkIcon className="w-5 h-5"/></div>;
        case 'video': return <div className={`${baseClass} bg-sky-100 text-sky-600`}><Video className="w-5 h-5"/></div>;
        case 'assignment': return <div className={`${baseClass} bg-purple-100 text-purple-600`}><ClipboardList className="w-5 h-5"/></div>;
        case 'question': return <div className={`${baseClass} bg-orange-100 text-orange-600`}><MessageCircle className="w-5 h-5"/></div>;
        default: return <div className={`${baseClass} bg-slate-100 text-slate-600`}><FileText className="w-5 h-5"/></div>;
    }
};

// --- SUB-COMPONENTS ---

// 1. CLASSWORK TAB
interface ClassworkTabProps {
    classId: string;
    topics: Topic[];
    onUpdateTopics: (topics: Topic[]) => void;
    teacherName: string;
    onAddSystemStreamPost: (title: string, resourceUrl?: string, resourceId?: string) => void;
    completedMatIds: Record<string, boolean>;
    onToggleCompleteMaterial: (materialId: string) => void;
}

const ClassworkView: React.FC<ClassworkTabProps> = ({ 
    topics, 
    onUpdateTopics, 
    teacherName, 
    onAddSystemStreamPost,
    completedMatIds,
    onToggleCompleteMaterial
}) => {
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    
    // Topic input field
    const [newTopicName, setNewTopicName] = useState('');
    
    // Material Form fields
    const [matType, setMatType] = useState<'pdf' | 'link' | 'video' | 'assignment' | 'question'>('pdf');
    const [matTitle, setMatTitle] = useState('');
    const [matInstructions, setMatInstructions] = useState('');
    const [matLinkUrl, setMatLinkUrl] = useState('');
    const [matTopicId, setMatTopicId] = useState('');
    const [matPoints, setMatPoints] = useState(100);
    const [matDueDate, setMatDueDate] = useState('');

    const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

    const handleCreateTopic = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopicName.trim()) return;
        
        const newTopic: Topic = {
            topicId: `topic-${Date.now()}`,
            topicName: newTopicName.trim(),
            materials: []
        };
        
        onUpdateTopics([...topics, newTopic]);
        setNewTopicName('');
        setShowTopicModal(false);
        onAddSystemStreamPost(`${teacherName} đã tạo một chủ đề thảo luận mới: ${newTopic.topicName}`);
    };

    const handleCreateMaterial = (e: React.FormEvent) => {
        e.preventDefault();
        if (!matTitle.trim()) {
            alert('Tiêu đề là bắt buộc.');
            return;
        }

        const newMat: Material = {
            id: `mat-${Date.now()}`,
            type: matType,
            title: matTitle.trim(),
            instructions: matInstructions.trim() || undefined,
            linkUrl: matLinkUrl.trim() || undefined,
            points: (matType === 'assignment' || matType === 'question') ? matPoints : undefined,
            dueDate: (matType === 'assignment' || matType === 'question') ? (matDueDate || undefined) : undefined
        };

        // Determine target topic
        const updatedTopics = [...topics];
        const targetTopicIndex = updatedTopics.findIndex(t => t.topicId === matTopicId);

        if (targetTopicIndex !== -1) {
            updatedTopics[targetTopicIndex] = {
                ...updatedTopics[targetTopicIndex],
                materials: [...updatedTopics[targetTopicIndex].materials, newMat]
            };
        } else {
            // Unassigned topic or first topic
            if (updatedTopics.length === 0) {
                // Create general topic
                updatedTopics.push({
                    topicId: 'general-topic',
                    topicName: 'Tài liệu chung',
                    materials: [newMat]
                });
            } else {
                updatedTopics[0] = {
                    ...updatedTopics[0],
                    materials: [...updatedTopics[0].materials, newMat]
                };
            }
        }

        onUpdateTopics(updatedTopics);
        
        // Notify Stream tab
        const VietnameseTypes: Record<string, string> = {
            pdf: 'tài liệu PDF',
            link: 'liên kết tham khảo',
            video: 'bài giảng video',
            assignment: 'bài tập',
            question: 'câu hỏi khảo sát'
        };
        onAddSystemStreamPost(
            `${teacherName} đã đăng một ${VietnameseTypes[matType] || 'tài nguyên'} mới: "${matTitle.trim()}"`,
            matLinkUrl.trim() || undefined,
            newMat.id
        );

        // Reset
        setMatTitle('');
        setMatInstructions('');
        setMatLinkUrl('');
        setMatTopicId('');
        setMatPoints(100);
        setMatDueDate('');
        setShowMaterialModal(false);
    };

    const handleDeleteMaterial = (topicId: string, matId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (confirm('Bạn có chắc chắn muốn xóa bài học/tài nguyên này?')) {
            const updated = topics.map(topic => {
                if (topic.topicId === topicId) {
                    return {
                        ...topic,
                        materials: topic.materials.filter(m => m.id !== matId)
                    };
                }
                return topic;
            });
            onUpdateTopics(updated);
        }
    };

    const handleDeleteTopic = (topicId: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ chủ đề này? Các bài học bên trong sẽ bị xóa xóa.')) {
            const updated = topics.filter(t => t.topicId !== topicId);
            onUpdateTopics(updated);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4 px-1 flex flex-col gap-6">
            
            {/* Header Create Trigger similar to Google Classroom */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tổ chức chương trình học</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Thêm các chương, tải lên slide, ghim video hoặc giao bài tập thực hành.</p>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowCreateMenu(!showCreateMenu)}
                        className="flex items-center gap-2 py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all shrink-0 active:scale-95 duration-100 text-xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tạo mới</span>
                    </button>

                    {showCreateMenu && (
                        <div className="absolute right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-30 w-52 text-sm text-slate-700 dark:text-slate-200 text-left animate-slide-in">
                            <button 
                                onClick={() => { setMatType('pdf'); setMatTitle(''); setMatInstructions(''); setShowMaterialModal(true); setShowCreateMenu(false); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
                            >
                                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="font-semibold">📖 Tài liệu PDF / Slide</span>
                            </button>
                            <button 
                                onClick={() => { setMatType('video'); setMatTitle(''); setMatInstructions(''); setShowMaterialModal(true); setShowCreateMenu(false); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
                            >
                                <Video className="w-4 h-4 text-sky-500 shrink-0" />
                                <span className="font-semibold">🎥 Bài giảng Video</span>
                            </button>
                            <button 
                                onClick={() => { setMatType('link'); setMatTitle(''); setMatInstructions(''); setShowMaterialModal(true); setShowCreateMenu(false); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
                            >
                                <LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="font-semibold">🔗 Liên kết Website</span>
                            </button>
                            <button 
                                onClick={() => { setMatType('assignment'); setMatTitle(''); setMatInstructions(''); setShowMaterialModal(true); setShowCreateMenu(false); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-700"
                            >
                                <ClipboardList className="w-4 h-4 text-purple-500 shrink-0" />
                                <span className="font-semibold">📝 Bài tập chấm điểm</span>
                            </button>
                            <button 
                                onClick={() => { setMatType('question'); setMatTitle(''); setMatInstructions(''); setShowMaterialModal(true); setShowCreateMenu(false); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
                            >
                                <MessageCircle className="w-4 h-4 text-orange-500 shrink-0" />
                                <span className="font-semibold">❓ Câu hỏi / Khảo sát</span>
                            </button>
                            <button 
                                onClick={() => { setShowTopicModal(true); setShowCreateMenu(false); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-700 text-blue-600 font-bold"
                            >
                                <Bookmark className="w-4 h-4 shrink-0" />
                                <span>🏷️ Tạo chủ đề mới</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* List of Topics */}
            {topics.length > 0 ? (
                <div className="space-y-6">
                    {topics.map(topic => (
                        <div key={topic.topicId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-[1px]">
                            
                            {/* Topic Heading Bar */}
                            <div className="px-5 py-4 bg-slate-50/75 dark:bg-slate-950/20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                                <h4 className="text-base font-extrabold text-indigo-700 dark:text-blue-400 flex items-center gap-2">
                                    <Bookmark className="w-4 h-4" />
                                    <span>{topic.topicName}</span>
                                </h4>
                                <button 
                                    onClick={() => handleDeleteTopic(topic.topicId)}
                                    className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-xs font-semibold text-slate-400 dark:text-slate-500 transition-colors"
                                >
                                    Xóa chủ đề
                                </button>
                            </div>

                            {/* Materials nested */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {topic.materials.length > 0 ? (
                                    topic.materials.map(material => {
                                        const isExpanded = expandedMaterial === material.id;
                                        const isCompleted = completedMatIds?.[material.id] || false;
                                        
                                        const handleMaterialClick = () => {
                                            setExpandedMaterial(isExpanded ? null : material.id);
                                            if (!isExpanded && onToggleCompleteMaterial && !isCompleted) {
                                                onToggleCompleteMaterial(material.id);
                                            }
                                        };

                                        return (
                                            <div 
                                                key={material.id} 
                                                className={`hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-all p-3 md:p-4 cursor-pointer ${isCompleted ? 'bg-slate-50/25 dark:bg-slate-950/5' : ''}`}
                                                onClick={handleMaterialClick}
                                            >
                                                <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {/* Sleek Manual Checkbox representing completion status of each training item */}
                                                        <div 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onToggleCompleteMaterial) {
                                                                    onToggleCompleteMaterial(material.id);
                                                                }
                                                            }}
                                                            className="p-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0 mr-1 focus:outline-none"
                                                            title={isCompleted ? "Đánh dấu là chưa học" : "Đánh dấu là đã học"}
                                                        >
                                                            <div className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-transparent'}`}>
                                                                <Check className="w-3 h-3 text-white stroke-[4px]" />
                                                            </div>
                                                        </div>
                                                        <MaterialIcon type={material.type} />
                                                        <div className="min-w-0">
                                                            <p className={`font-bold text-sm transition-colors flex items-center gap-2 ${isCompleted ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                <span>{material.title}</span>
                                                                {isCompleted && (
                                                                    <span className="no-underline inline-block text-[9px] font-black uppercase bg-emerald-100/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250/20 px-1.5 py-0.5 rounded">
                                                                        Đã học
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                                                                <span className="uppercase">{material.type}</span>
                                                                {material.points !== undefined && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>Thang điểm: {material.points}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Due dates and Actions info */}
                                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                                        {material.dueDate && (
                                                            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>Hạn: {material.dueDate}</span>
                                                            </div>
                                                        )}
                                                        <button 
                                                            onClick={(e) => handleDeleteMaterial(topic.topicId, material.id, e)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                                            title="Xóa tài nguyên"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded Details Pane containing PDF instructions or URL link */}
                                                {isExpanded && (
                                                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in text-left pl-1">
                                                        {material.instructions && (
                                                            <div className="text-xs text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-line leading-relaxed">
                                                                {material.instructions}
                                                            </div>
                                                        )}
                                                        
                                                        {material.linkUrl && (
                                                            <div className="mt-3">
                                                                <a 
                                                                    href={material.linkUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-950/50 rounded-xl p-3 pr-4 max-w-full"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="font-extrabold truncate">Mở liên kết tài nguyên</div>
                                                                        <div className="text-[10px] text-slate-400 truncate max-w-md mt-0.5">{material.linkUrl}</div>
                                                                    </div>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic pl-1">Chủ đề này chưa có bài giảng hay bài tập nào. Hãy nhấn "Tạo mới"!</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                    <ClipboardList className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Không có tài liệu, bài giảng</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Chưa có bài giảng hay chủ đề nào được tạo cho lớp học này. Giáo viên có thể bắt đầu tạo tài liệu lớp học ngay.</p>
                </div>
            )}

            {/* Modal "Thêm chủ đề" inline */}
            {showTopicModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex justify-center items-center p-4">
                    <div className="absolute inset-0" onClick={() => setShowTopicModal(false)}></div>
                    <form onSubmit={handleCreateTopic} className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Bookmark className="w-4 h-4 text-blue-500" />
                                Thêm chủ đề mới
                            </h3>
                            <button type="button" onClick={() => setShowTopicModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 block">Tên chủ đề *</label>
                            <input 
                                type="text" 
                                required
                                value={newTopicName}
                                onChange={e => setNewTopicName(e.target.value)}
                                placeholder="Ví dụ: Chương 1: Quy trình đón tiếp khách hàng"
                                className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
                        <div className="flex justify-end gap-2.5 pt-2">
                            <button type="button" onClick={() => setShowTopicModal(false)} className="px-3.5 py-2 hover:bg-slate-100 text-xs text-slate-500 font-bold rounded-lg">Hủy</button>
                            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm">Thêm</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Google Classroom Detailed Material/Assignment Composer Modal */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex justify-center items-center p-4 overflow-y-auto">
                    <div className="absolute inset-0" onClick={() => setShowMaterialModal(false)}></div>
                    <form onSubmit={handleCreateMaterial} className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col my-8 animate-scale-in max-h-[90vh] overflow-hidden text-left">
                        
                        {/* Header */}
                        <header className="p-4 md:p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                        Đăng bài giảng / bài tập mới
                                    </h3>
                                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                                        Loại tài nguyên: {matType}
                                    </p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowMaterialModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </header>

                        {/* Split Form View styled exactly like Google Classroom Composer */}
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 no-scrollbar">
                            
                            {/* Left Form: Rich text detailed title */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 block">Tiêu đề bài viết *</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Slide bài giảng Chương 2 - Các bước lập luận SMART"
                                        value={matTitle}
                                        onChange={e => setMatTitle(e.target.value)}
                                        className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 block">Hướng dẫn / Mô tả chi tiết (Tùy chọn)</label>
                                    <textarea 
                                        placeholder="Ghi chú thêm hướng dẫn cho học sinh học hoặc làm bài..."
                                        rows={5}
                                        value={matInstructions}
                                        onChange={e => setMatInstructions(e.target.value)}
                                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-550 block">Đường dẫn tệp đính kèm / File / YouTube Link</label>
                                    <div className="relative">
                                        <input 
                                            type="url"
                                            placeholder="https://gdrive.company.com/file-id hoặc https://youtube.com..."
                                            value={matLinkUrl}
                                            onChange={e => setMatLinkUrl(e.target.value)}
                                            className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                        <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-[10px] text-slate-400">Đính kèm slide Google Slides, tệp PDF trên Drive, video clip hoặc link dự án bên ngoài.</p>
                                </div>
                            </div>

                            {/* Right Sidebar form parameters */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 self-start">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/80 pb-2">Thiết lập học vụ</h4>

                                {/* Category Topic select drop-down */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 block">Thuộc chủ đề</label>
                                    <select 
                                        value={matTopicId}
                                        onChange={e => setMatTopicId(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 text-xs rounded-xl focus:outline-none font-semibold text-slate-700 dark:text-slate-300"
                                    >
                                        <option value="">-- Tài liệu chung (Không phân chủ đề) --</option>
                                        {topics.map(t => (
                                            <option key={t.topicId} value={t.topicId}>{t.topicName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom controls displayed only if assignment/question is chosen */}
                                {(matType === 'assignment' || matType === 'question') && (
                                    <>
                                        <div className="space-y-1 animate-fade-in-up">
                                            <label className="text-xs font-bold text-slate-500 block">Thang điểm cực đại</label>
                                            <input 
                                                type="number"
                                                min={0}
                                                max={1000}
                                                value={matPoints}
                                                onChange={e => setMatPoints(Number(e.target.value))}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="space-y-1 animate-fade-in-up">
                                            <label className="text-xs font-bold text-slate-500 block">Ngày hạn nộp</label>
                                            <input 
                                                type="date"
                                                value={matDueDate}
                                                onChange={e => setMatDueDate(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-xs rounded-xl focus:outline-none font-medium text-slate-700 dark:text-slate-300"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <footer className="p-4 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950">
                            <button 
                                type="button" 
                                onClick={() => setShowMaterialModal(false)} 
                                className="py-2.5 px-4 rounded-xl text-slate-500 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                type="submit" 
                                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-xs transition-colors flex items-center gap-1.5"
                            >
                                {matType === 'assignment' ? 'Giao bài tập' : 'Đăng tài liệu'}
                            </button>
                        </footer>
                    </form>
                </div>
            )}
        </div>
    );
};


// 2. STREAM TAB (Bảng Tin)
interface StreamTabProps {
    classId: string;
    classInfo: ClassInfo;
    topics: Topic[];
    teacherName: string;
}

const StreamView: React.FC<StreamTabProps> = ({ classId, classInfo, topics, teacherName }) => {
    // Stream announcements state
    const [streamPosts, setStreamPosts] = useState<StreamPost[]>(() => {
        const stored = localStorage.getItem(`classroom_stream_${classId}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        // Fallback default stream list
        return [
            { id: 'p-1', author: classInfo.teacher, type: 'announcement', title: 'Chào mừng các bạn đến với khóa học!', text: 'Chào mọi người, tôi rất hân hạnh được đồng hành cùng các bạn trong lộ trình nâng cao năng lực lần này. Vui lòng vào tab "Bài tập trên lớp" để bắt đầu ôn luyện các slide và làm bài tập nhé!', createdAt: Date.now() - 3600000 * 24, comments: [] },
            { id: 'p-2', author: classInfo.teacher, type: 'system', title: `${classInfo.teacher} đã đăng bài giảng PDF mới: "Slide bài giảng - Giới thiệu khóa học"`, createdAt: Date.now() - 3600000 * 12, materialId: 'mat-1', comments: [] }
        ];
    });

    const [announcementText, setAnnouncementText] = useState('');
    const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

    const savePostsList = (newList: StreamPost[]) => {
        setStreamPosts(newList);
        localStorage.setItem(`classroom_stream_${classId}`, JSON.stringify(newList));
    };

    const handleCreateAnnouncement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementText.trim()) return;

        const newPost: StreamPost = {
            id: `post-${Date.now()}`,
            author: teacherName,
            type: 'announcement',
            title: 'Thông báo lớp học',
            text: announcementText.trim(),
            createdAt: Date.now(),
            comments: []
        };

        savePostsList([newPost, ...streamPosts]);
        setAnnouncementText('');
    };

    const handleWriteComment = (postId: string, text: string) => {
        if (!text.trim()) return;

        const newComment: StreamComment = {
            id: `com-${Date.now()}`,
            author: 'Học viên',
            text: text.trim(),
            createdAt: Date.now()
        };

        const updated = streamPosts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: [...(post.comments || []), newComment]
                };
            }
            return post;
        });

        savePostsList(updated);
        setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    };

    // Calculate upcoming deadlines for classroom sidebar
    const upcomingAssignments = useMemo(() => {
        const list: { id: string; title: string; dueDate: string }[] = [];
        topics.forEach(t => {
            t.materials.forEach(m => {
                if (m.dueDate && (m.type === 'assignment' || m.type === 'question')) {
                    list.push({
                        id: m.id,
                        title: m.title,
                        dueDate: m.dueDate
                    });
                }
            });
        });
        return list.slice(0, 3);
    }, [topics]);

    return (
        <div className="max-w-5xl mx-auto py-4 px-1 grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
            
            {/* Left sidebar: Sắp diễn ra (Upcoming deadlines) */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs self-start text-xs text-slate-700 dark:text-slate-300 space-y-4 shrink-0">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Sắp diễn ra</span>
                </h4>
                
                {upcomingAssignments.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tuyệt vời! Bạn có bài tập cần chuẩn bị hạn nộp sắp tới:</p>
                        {upcomingAssignments.map(asg => (
                            <div key={asg.id} className="p-3 border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 rounded-xl space-y-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">{asg.title}</p>
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    Hạn: {asg.dueDate}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 dark:text-slate-500 italic text-[11px] leading-relaxed pt-1">
                        Tuyệt vời! Không có bài tập nào sắp đến hạn nộp trong thời gian tới.
                    </p>
                )}
            </div>

            {/* Right main column of stream announcements */}
            <div className="lg:col-span-3 space-y-5">
                
                {/* Post Creator panel inside Stream */}
                <form onSubmit={handleCreateAnnouncement} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-sm ring-2 ring-slate-100 shadow-sm shrink-0">
                            {teacherName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-350">Chia sẻ nội dung hoặc giải đáp trực tiếp với lớp học của bạn...</span>
                    </div>

                    <textarea 
                        rows={2}
                        value={announcementText}
                        onChange={e => setAnnouncementText(e.target.value)}
                        placeholder="Thông báo về buổi họp tiếp theo, link Google Meet học trực tuyến, tài liệu rực rỡ..."
                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder-slate-400"
                    />

                    {announcementText.trim() && (
                        <div className="flex justify-end pt-1 animate-fade-in">
                            <button 
                                type="submit"
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg shadow-sm flex items-center gap-1"
                            >
                                <Send className="w-3.5 h-3.5" /> Đăng bài
                            </button>
                        </div>
                    )}
                </form>

                {/* List of Posted items */}
                {streamPosts.length > 0 ? (
                    <div className="space-y-4">
                        {streamPosts.map(post => {
                            const dateStr = new Date(post.createdAt || Date.now()).toLocaleDateString('vi-VN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            return (
                                <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                                    
                                    {/* Author row & Content info */}
                                    <div className="p-4 flex gap-3.5">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold shrink-0 flex items-center justify-center text-sm shadow-inner uppercase">
                                            {post.author ? post.author.charAt(0) : 'G'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-extrabold text-slate-800 dark:text-white truncate">{post.author}</h5>
                                                <span className="text-[10px] text-slate-400 font-semibold">{dateStr}</span>
                                            </div>
                                            
                                            {/* Specialized display depending on post category */}
                                            {post.type === 'system' ? (
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1.5 flex items-center gap-1 bg-indigo-50/50 dark:bg-indigo-950/20 py-2.5 px-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/10">
                                                    <Sparkles className="w-4 h-4 shrink-0" />
                                                    <span>{post.title}</span>
                                                </p>
                                            ) : (
                                                <div className="mt-2 space-y-2">
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{post.text}</p>
                                                    {post.linkUrl && (
                                                        <a 
                                                            href={post.linkUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline max-w-full mt-1"
                                                        >
                                                            <LinkIcon className="w-3 h-3" />
                                                            <span className="truncate">{post.linkUrl}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline comment section */}
                                    <div className="bg-slate-50/60 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 p-4 py-3 space-y-3.5">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span>Nhận xét lớp học ({post.comments?.length || 0})</span>
                                        </div>

                                        {post.comments && post.comments.length > 0 && (
                                            <div className="space-y-3 pl-1">
                                                {post.comments.map(com => (
                                                    <div key={com.id} className="flex gap-2.5 items-start text-xs text-left text-slate-700 dark:text-slate-300">
                                                        <div className="w-6.5 h-6.5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center border shrink-0">
                                                            {com.author.charAt(0)}
                                                        </div>
                                                        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl flex-1 max-w-full">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-200">{com.author}</span>
                                                                <span className="text-[9px] text-slate-400">{new Date(com.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <p className="text-[11px] leading-relaxed font-medium text-slate-600 dark:text-slate-300">{com.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Create comment inline form */}
                                        <div className="flex gap-2.5 pt-1">
                                            <input 
                                                type="text" 
                                                placeholder="Viết câu hỏi hoặc nhận xét công khai..."
                                                value={commentTexts[post.id] || ''}
                                                onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleWriteComment(post.id, commentTexts[post.id] || '');
                                                    }
                                                }}
                                                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => handleWriteComment(post.id, commentTexts[post.id] || '')}
                                                disabled={!(commentTexts[post.id] || '').trim()}
                                                className="px-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 font-bold rounded-xl text-xs transition-colors shrink-0"
                                            >
                                                Gửi
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="italic text-slate-400 text-center py-12">Bảng tin lớp học trống. Thông báo một điều gì đó lành mạnh nhé!</div>
                )}
            </div>
        </div>
    );
};


// 3. PEOPLE TAB (Mọi người)
interface PeopleViewProps {
    classInfo: ClassInfo;
}

const PeopleView: React.FC<PeopleViewProps> = ({ classInfo }) => {
    // Roster of teachers
    const teachersList = [classInfo.teacher];
    
    // Roster of classmates: Load 6-8 students from contacts
    const classmatesList = useMemo(() => {
        return initialContacts.slice(0, 7).map(c => ({
            id: c.id,
            name: c.name,
            email: c.email
        }));
    }, []);

    return (
        <div className="max-w-3xl mx-auto py-6 px-1.5 text-left space-y-8">
            
            {/* Teachers Category Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-2">
                    <h3 className="text-lg font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>Giáo viên</span>
                    </h3>
                    <span className="text-xs font-bold text-slate-450 uppercase">1 người</span>
                </div>

                <div className="space-y-3 pl-1">
                    {teachersList.map((teacher, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-1">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shadow-md border border-white">
                                {teacher.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{teacher}</h4>
                                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase mt-0.5 tracking-wider">Chủ sở hữu lớp học</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Students Category Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-2">
                    <h3 className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        <span>Học viên đồng hành</span>
                    </h3>
                    <span className="text-xs font-bold text-slate-450 uppercase">{classmatesList.length} học viên</span>
                </div>

                <div className="space-y-3.5 pl-1.5">
                    {classmatesList.map(mate => {
                        const avatarLetter = mate.name ? mate.name.charAt(0) : '@';
                        return (
                            <div key={mate.id} className="flex items-center justify-between py-1.5 hover:bg-slate-50/20 dark:hover:bg-slate-950/20 px-2 rounded-xl border border-transparent transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center border shadow-inner text-xs">
                                        {avatarLetter}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{mate.name}</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{mate.email}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Đã chấp nhận</span>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};


// 4. GRADES TAB (Điểm Số)
interface GradesViewProps {
    classId: string;
    topics: Topic[];
}

const GradesView: React.FC<GradesViewProps> = ({ classId, topics }) => {
    // Extract assignments
    const assignments = useMemo(() => {
        const list: Material[] = [];
        topics.forEach(t => {
            t.materials.forEach(m => {
                if (m.type === 'assignment' || m.type === 'question') {
                    list.push(m);
                }
            });
        });
        return list;
    }, [topics]);

    // Roster of students
    const students = useMemo(() => {
        return initialContacts.slice(0, 6).map(c => ({
            id: c.id,
            name: c.name
        }));
    }, []);

    // Scores management
    const [scores, setScores] = useState<Record<string, Record<string, string>>>(() => {
        const stored = localStorage.getItem(`classroom_grades_${classId}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        }
        
        // Populate default realistic scores inside matrix
        const defaultMatrix: Record<string, Record<string, string>> = {};
        students.forEach(st => {
            defaultMatrix[st.id] = {};
            // Preset random high-scoring numbers for demo
            defaultMatrix[st.id]['mat-4'] = String(85 + Math.floor(Math.random() * 15));
            defaultMatrix[st.id]['mat-6'] = String(80 + Math.floor(Math.random() * 20));
        });
        return defaultMatrix;
    });

    const handleScoreChange = (studentId: string, assId: string, value: string) => {
        const updated = {
            ...scores,
            [studentId]: {
                ...(scores[studentId] || {}),
                [assId]: value
            }
        };
        setScores(updated);
        localStorage.setItem(`classroom_grades_${classId}`, JSON.stringify(updated));
    };

    return (
        <div className="max-w-5xl mx-auto py-5 px-1.5 text-left space-y-5">
            <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <BarChart2 className="w-5 h-5 text-purple-500" />
                    <span>Sổ số điểm của Lớp học</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Bảng tổng hợp giám sát chấm điểm, đánh giá mức độ tiếp thu bài học của từng nhân sự.</p>
            </div>

            {assignments.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                    <th className="p-4 font-bold text-slate-600 text-left min-w-[200px]">Học viên</th>
                                    {assignments.map(ass => (
                                        <th key={ass.id} className="p-4 font-bold text-slate-600 text-center min-w-[150px]">
                                            <div className="space-y-1">
                                                <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-40 mx-auto" title={ass.title}>
                                                    {ass.title}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase">Tối đa: {ass.points || 100}</p>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {students.map(st => (
                                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all">
                                        <td className="p-4 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                                                {st.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-750 dark:text-slate-300">{st.name}</span>
                                        </td>
                                        
                                        {assignments.map(ass => {
                                            const scoreValue = scores[st.id]?.[ass.id] || '';
                                            return (
                                                <td key={ass.id} className="p-4 text-center">
                                                    <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 shrink-0">
                                                        <input 
                                                            type="number"
                                                            min={0}
                                                            max={ass.points || 100}
                                                            placeholder="--"
                                                            value={scoreValue}
                                                            onChange={e => handleScoreChange(st.id, ass.id, e.target.value)}
                                                            className="w-10 bg-transparent text-center font-bold text-indigo-650 dark:text-blue-400 focus:outline-none"
                                                        />
                                                        <span className="text-slate-350 select-none">/</span>
                                                        <span className="text-slate-400 font-semibold">{ass.points || 100}</span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50/40 dark:bg-slate-950/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-400">
                    <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Chưa có bài tập chấm điểm nào!</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Vui lòng tạo bài tập loại "Bài tập chấm điểm" trong tab Bài tập trên lớp để xem và quản lý sổ điểm.</p>
                </div>
            )}
        </div>
    );
};


// --- MAIN CLASS DETAIL VIEW ---
interface ClassDetailViewProps {
  user: User;
  classId: string | null;
  onNavigate: (view: View) => void;
}

const ClassDetailView: React.FC<ClassDetailViewProps> = ({ user, classId, onNavigate }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('stream');

    // Load active class payload from localStorage
    const classInfo = useMemo(() => {
        const stored = localStorage.getItem('classroom_classes');
        const list: ClassInfo[] = stored ? JSON.parse(stored) : mockClasses;
        return list.find(c => c.id === classId);
    }, [classId]);

    // Load static or local topic lists dynamically
    const [topics, setTopics] = useState<Topic[]>([]);

    useEffect(() => {
        if (!classId) return;
        const stored = localStorage.getItem(`classroom_classworks_${classId}`);
        if (stored) {
            try {
                setTopics(JSON.parse(stored));
                return;
            } catch (e) {
                console.error(e);
            }
        }
        // Fallback default
        if (classId === 'class-1') {
            setTopics(initialClasswork);
        } else {
            setTopics([]);
        }
    }, [classId]);

    const handleUpdateTopics = (newTopicsList: Topic[]) => {
        setTopics(newTopicsList);
        if (classId) {
            localStorage.setItem(`classroom_classworks_${classId}`, JSON.stringify(newTopicsList));
        }
    };

    // Tracks material completion for employee pathways
    const [completedMatIds, setCompletedMatIds] = useState<Record<string, boolean>>(() => {
        if (!classId || !user?.id) return {};
        const key = `completed_materials_${classId}_${user.id}`;
        const stored = localStorage.getItem(key);
        try {
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const handleToggleCompleteMaterial = (materialId: string) => {
        if (!classId || !user?.id) return;
        const next = { ...completedMatIds, [materialId]: !completedMatIds[materialId] };
        setCompletedMatIds(next);
        const key = `completed_materials_${classId}_${user.id}`;
        localStorage.setItem(key, JSON.stringify(next));
    };

    const totalMaterials = useMemo(() => {
        return topics.reduce((acc, topic) => acc + (topic.materials?.length || 0), 0);
    }, [topics]);

    const completedMaterialsCount = useMemo(() => {
        return topics.reduce((acc, topic) => {
            const completedInTopic = topic.materials?.filter(m => completedMatIds[m.id]).length || 0;
            return acc + completedInTopic;
        }, 0);
    }, [topics, completedMatIds]);

    const completionPercentage = useMemo(() => {
        return totalMaterials > 0 ? Math.round((completedMaterialsCount / totalMaterials) * 100) : 0;
    }, [totalMaterials, completedMaterialsCount]);

    // Persist percentage calculation for main training catalog status indicators
    useEffect(() => {
        if (!classId || !user?.id) return;
        localStorage.setItem(`course_completion_rate_${classId}_${user.id}`, String(completionPercentage));
    }, [completionPercentage, classId, user.id]);

    // Callback to append structured notification post into the Stream record
    const handleAddSystemPost = (title: string, resourceUrl?: string, resourceId?: string) => {
        if (!classId) return;
        const stored = localStorage.getItem(`classroom_stream_${classId}`);
        let currentStream: StreamPost[] = [];
        
        if (stored) {
            try {
                currentStream = JSON.parse(stored);
            } catch (e) {
                console.error(e);
            }
        } else {
            // Default initial stream
            currentStream = [
                { id: 'p-1', author: classInfo?.teacher || 'Trần Văn An', type: 'announcement', title: 'Chào mừng các bạn đến với khóa học!', text: 'Chào mọi người, tôi rất hân hạnh được đồng hành cùng các bạn trong lộ trình nâng cao năng lực lần này. Vui lòng vào tab "Bài tập trên lớp" để bắt đầu ôn luyện các slide và làm bài tập nhé!', createdAt: Date.now() - 3600000 * 24, comments: [] }
            ];
        }

        const newPost: StreamPost = {
            id: `syspost-${Date.now()}`,
            author: classInfo?.teacher || 'Trần Văn An',
            type: 'system',
            title,
            createdAt: Date.now(),
            linkUrl: resourceUrl,
            materialId: resourceId,
            comments: []
        };

        const updated = [newPost, ...currentStream];
        localStorage.setItem(`classroom_stream_${classId}`, JSON.stringify(updated));
        
        // If stream tab is not currently active, we still commit, but let the user know via a small window event or handled states
    };

    if (!classInfo) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-center">
                <p className="text-slate-500 font-bold mb-4">Không tìm thấy thông tin chi tiết lớp học. Vui lòng quay lại.</p>
                <button 
                    onClick={() => onNavigate('training')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all shrink-0"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh mục học tập
                </button>
            </main>
        );
    }

    const tabs = [
        { id: 'stream', label: t('stream') || 'Bảng tin', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'classwork', label: t('classwork') || 'Bài tập trên lớp', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'online-learning', label: 'Bắt đầu học online', icon: <PlayCircle className="w-4 h-4" /> },
        { id: 'people', label: t('people') || 'Mọi người', icon: <Users className="w-4 h-4" /> },
        { id: 'grades', label: t('grades') || 'Điểm số', icon: <BarChart2 className="w-4 h-4" /> },
    ];

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-[3px] gap-3.5 pb-24 md:pb-8">
            
            {/* Nav Back Strip */}
            <div className="flex items-center justify-between ml-1 mr-1 flex-wrap gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-blue-400 hover:underline cursor-pointer transition-all" onClick={() => onNavigate('training')}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại Danh sách khóa học</span>
                </div>
            </div>

            {/* Elegant Course Progress Tracker Widget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left relative overflow-hidden shrink-0">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <BarChart2 className="w-4 h-4 text-indigo-500" />
                            Tiến độ học tập của bạn
                        </h3>
                        {totalMaterials > 0 ? (
                            <p className="text-[11px] font-semibold text-slate-450 mt-1">
                                Bạn đã hoàn thành <strong className="text-slate-700 dark:text-slate-200">{completedMaterialsCount}/{totalMaterials}</strong> tài liệu & bài giảng ({completionPercentage}%)
                            </p>
                        ) : (
                            <p className="text-[11px] font-semibold text-slate-450 mt-1">Chưa có bài học nào được khởi tạo trong lộ trình.</p>
                        )}
                    </div>
                    {totalMaterials > 0 && completionPercentage === 100 && (
                        <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-95-5 text-amber-805 dark:text-amber-400 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-bounce self-start sm:self-center">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                            <span>🏆 ĐÃ HOÀN THÀNH XUẤT SẮC</span>
                        </div>
                    )}
                </div>

                {totalMaterials > 0 && (
                    <div className="mt-3 relative">
                        {/* Outer track */}
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden shadow-inner border border-slate-200/25">
                            {/* Inner fill */}
                            <div 
                                className="h-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-650 transition-all duration-500 rounded-full"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Congratulatory Alert Box on 100% completion */}
                {totalMaterials > 0 && completionPercentage === 100 && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50/70 via-indigo-50/50 to-purple-50/50 dark:from-amber-950/20 dark:via-indigo-950/20 dark:to-purple-950/10 border border-amber-200/40 dark:border-amber-900/40 flex flex-col md:flex-row items-center gap-4 animate-fade-in relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-300 via-indigo-200 to-purple-800"></div>
                        
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shrink-0 animate-pulse relative z-10">
                            <Award className="w-6 h-6" />
                        </div>
                        
                        <div className="text-center md:text-left flex-1 relative z-10">
                            <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-400 flex items-center justify-center md:justify-start gap-1">
                                🎉 Xin chúc mừng bạn, {user.name}!
                            </h4>
                            <p className="text-[10px] font-semibold text-slate-651 dark:text-slate-300 mt-1 leading-relaxed">
                                Bạn đã hoàn thành xuất sắc tất cả học liệu của chuyên đề này. Hãy tiếp tục đào luyện tinh thần để nâng cao giá trị đóng góp cho doanh nghiệp nhé!
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Class Banner Hero Card following Google Classroom exactly */}
            <div className="relative h-40 md:h-48 rounded-2xl overflow-hidden shadow-md shrink-0 border border-slate-200/50 dark:border-slate-800">
                <ClassBannerBg image={classInfo.image} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                
                {/* Visual Details overlaid inside the classroom card hero header */}
                <div className="absolute bottom-0 left-0 p-5 md:p-6 text-left text-white max-w-full z-10">
                    <h1 className="text-xl md:text-3xl font-bold text-white leading-tight filter drop-shadow-md">
                        {classInfo.name}
                    </h1>
                    
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-white/90 text-xs md:text-sm font-semibold pl-0.5">
                        <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {classInfo.subject}
                        </span>
                        {classInfo.section && (
                            <>
                                <span>•</span>
                                <span>Phân hệ: {classInfo.section}</span>
                            </>
                        )}
                        {classInfo.room && (
                            <>
                                <span>•</span>
                                <span>Phòng: {classInfo.room}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Navigation Tabs exactly like Classroom Bar */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-xs">
                <nav className="max-w-4xl mx-auto flex items-center gap-1">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 rounded-xl text-xs font-bold transition-all relative ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Tab Panel Content switcher */}
            <div className="flex-1 min-h-0">
                {activeTab === 'stream' && (
                    <StreamView 
                        classId={classInfo.id} 
                        classInfo={classInfo} 
                        topics={topics} 
                        teacherName={user?.name || classInfo.teacher} 
                    />
                )}
                {activeTab === 'classwork' && (
                    <ClassworkView 
                        classId={classInfo.id}
                        topics={topics} 
                        onUpdateTopics={handleUpdateTopics} 
                        teacherName={user?.name || classInfo.teacher} 
                        onAddSystemStreamPost={handleAddSystemPost} 
                        completedMatIds={completedMatIds}
                        onToggleCompleteMaterial={handleToggleCompleteMaterial}
                    />
                )}
                {activeTab === 'online-learning' && (
                    <OnlineLearningView 
                        classId={classInfo.id}
                        classInfo={classInfo}
                        user={user}
                    />
                )}
                {activeTab === 'people' && (
                    <PeopleView classInfo={classInfo} />
                )}
                {activeTab === 'grades' && (
                    <GradesView classId={classInfo.id} topics={topics} />
                )}
            </div>
        </main>
    );
};

export default ClassDetailView;
