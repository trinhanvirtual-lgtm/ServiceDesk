import React, { useState, useMemo } from 'react';
import { User, View } from '../App';
import { useLanguage } from './LanguageContext';
import { MessageSquareIcon, ClipboardListIcon, UsersIcon, BarChart2Icon, PlusIcon, FilePdfIcon, LinkIcon, VideoIcon } from './icons';

// --- MOCK DATA ---
const mockClasses = [
    { id: 'class-1', name: 'Kỹ năng Quản lý Thời gian', teacher: 'Trần Văn An', subject: 'Phát triển bản thân', image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800' },
    { id: 'class-2', name: 'Marketing Kỹ thuật số 101', teacher: 'Hoàng Văn Em', subject: 'Marketing', image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800' },
    { id: 'class-3', name: 'Nhập môn Lập trình React', teacher: 'Phạm Minh Cường', subject: 'Công nghệ', image: 'https://images.unsplash.com/photo-1550063873-ab792950096b?q=80&w=800' },
    { id: 'class-4', name: 'An toàn Thông tin Doanh nghiệp', teacher: 'Lê Thị Bình', subject: 'Bảo mật', image: 'https://images.unsplash.com/photo-1555949963-ff98c2772f1a?q=80&w=800' },
];

const mockClasswork = [
    { 
        topicId: 'topic-1',
        topicName: 'Chương 1: Giới thiệu & Tổng quan',
        materials: [
            { id: 'mat-1', type: 'pdf', title: 'Slide bài giảng - Giới thiệu khóa học', dueDate: null },
            { id: 'mat-2', type: 'link', title: 'Tài liệu tham khảo', dueDate: null },
        ]
    },
    { 
        topicId: 'topic-2',
        topicName: 'Chương 2: Thiết lập mục tiêu SMART',
        materials: [
            { id: 'mat-3', type: 'video', title: 'Video bài giảng - Mục tiêu SMART là gì?', dueDate: null },
            { id: 'mat-4', type: 'assignment', title: 'Bài tập 1: Xác định 3 mục tiêu SMART cho tháng tới', dueDate: 'Aug 5, 2024' },
        ]
    },
    { 
        topicId: 'topic-3',
        topicName: 'Chương 3: Ma trận Eisenhower',
        materials: [
             { id: 'mat-5', type: 'video', title: 'Video bài giảng - Phân loại công việc hiệu quả', dueDate: null },
             { id: 'mat-6', type: 'assignment', title: 'Bài tập 2: Phân loại các công việc hiện tại', dueDate: 'Aug 12, 2024' },
        ]
    }
];

// --- SUB-COMPONENTS ---

const MaterialIcon: React.FC<{type: string}> = ({ type }) => {
    const baseClass = "w-10 h-10 flex items-center justify-center rounded-full shrink-0";
    switch(type) {
        case 'pdf': return <div className={`${baseClass} bg-red-100 text-red-600`}><FilePdfIcon className="w-5 h-5"/></div>;
        case 'link': return <div className={`${baseClass} bg-green-100 text-green-600`}><LinkIcon className="w-5 h-5"/></div>;
        case 'video': return <div className={`${baseClass} bg-sky-100 text-sky-600`}><VideoIcon className="w-5 h-5"/></div>;
        case 'assignment': return <div className={`${baseClass} bg-purple-100 text-purple-600`}><ClipboardListIcon className="w-5 h-5"/></div>;
        default: return <div className={`${baseClass} bg-slate-100 text-slate-600`}><FilePdfIcon className="w-5 h-5"/></div>;
    }
}

const ClassworkView: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-6 px-2 space-y-8">
            <div className="flex justify-end">
                <button className="flex items-center gap-2 py-2 px-4 bg-gradient-to-br from-[--color-accent-500] to-[--color-accent-gradient-secondary] text-white font-bold rounded-lg shadow-lg hover:shadow-[--color-accent-shadow] transition-all transform hover:scale-105">
                    <PlusIcon className="w-5 h-5" />
                    <span>Tạo</span>
                </button>
            </div>
            {mockClasswork.map(topic => (
                <div key={topic.topicId}>
                    <h2 className="text-2xl font-bold text-[--color-accent-600] border-b-2 border-[--color-accent-500] pb-2 mb-4">{topic.topicName}</h2>
                    <div className="space-y-3">
                        {topic.materials.map(material => (
                            <div key={material.id} className="flex items-center justify-between p-3 bg-white/60 hover:bg-white/90 rounded-lg shadow-sm transition-colors cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <MaterialIcon type={material.type} />
                                    <p className="font-semibold text-[--color-text-primary]">{material.title}</p>
                                </div>
                                {material.dueDate && <p className="text-sm text-[--color-text-secondary] shrink-0">Hạn nộp: {material.dueDate}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---
interface ClassDetailViewProps {
  user: User;
  classId: string | null;
  onNavigate: (view: View) => void;
}

const ClassDetailView: React.FC<ClassDetailViewProps> = ({ classId }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('classwork');
    const classInfo = useMemo(() => mockClasses.find(c => c.id === classId), [classId]);

    if (!classInfo) {
        return (
            <main className="flex-1 flex items-center justify-center">
                <p className="text-[--color-text-secondary]">Không tìm thấy lớp học. Vui lòng quay lại.</p>
            </main>
        );
    }

    const tabs = [
        { id: 'stream', label: t('stream'), icon: <MessageSquareIcon className="w-5 h-5" /> },
        { id: 'classwork', label: t('classwork'), icon: <ClipboardListIcon className="w-5 h-5" /> },
        { id: 'people', label: t('people'), icon: <UsersIcon className="w-5 h-5" /> },
        { id: 'grades', label: t('grades'), icon: <BarChart2Icon className="w-5 h-5" /> },
    ];

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-[3px] gap-3 pb-24 md:pb-8">
            {/* Class Banner */}
            <div className="relative h-48 md:h-64 rounded-b-xl overflow-hidden shadow-lg">
                <img src={classInfo.image} alt={classInfo.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                    <h1 className="text-white text-3xl md:text-5xl font-bold">{classInfo.name}</h1>
                    <p className="text-white/90 text-lg">{classInfo.subject}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="shrink-0 bg-white/40 backdrop-blur-lg border-b border-white/50 sticky top-0 z-10">
                <nav className="max-w-4xl mx-auto flex items-center">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 font-semibold transition-all duration-300 relative ${activeTab === tab.id ? 'text-[--color-accent-600]' : 'text-[--color-text-secondary] hover:text-[--color-text-primary]'}`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-[--color-accent-500] rounded-t-full"></div>}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1">
                {activeTab === 'classwork' && <ClassworkView />}
                {/* Placeholder for other tabs */}
                {activeTab !== 'classwork' && (
                    <div className="flex items-center justify-center h-full p-10 text-[--color-text-secondary]">
                       <p>Nội dung cho tab "{t(activeTab)}" sẽ được triển khai sớm.</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default ClassDetailView;