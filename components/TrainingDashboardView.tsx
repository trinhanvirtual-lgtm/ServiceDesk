import React, { useState } from 'react';
import { User, View } from '../App';
import { useLanguage } from './LanguageContext';
import TrainingBanner from './TrainingBanner';
import { PlusIcon, UserIcon, ShareIcon } from './icons';

interface ClassInfo {
    id: string;
    name: string;
    teacher: string;
    subject: string;
    image: string;
}

// Mock Data
export const mockClasses: ClassInfo[] = [
    { id: 'class-1', name: 'Kỹ năng Quản lý Thời gian', teacher: 'Trần Văn An', subject: 'Phát triển bản thân', image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800' },
    { id: 'class-2', name: 'Marketing Kỹ thuật số 101', teacher: 'Hoàng Văn Em', subject: 'Marketing', image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800' },
    { id: 'class-3', name: 'Nhập môn Lập trình React', teacher: 'Phạm Minh Cường', subject: 'Công nghệ', image: 'https://images.unsplash.com/photo-1550063873-ab792950096b?q=80&w=800' },
    { id: 'class-4', name: 'An toàn Thông tin Doanh nghiệp', teacher: 'Lê Thị Bình', subject: 'Bảo mật', image: 'https://images.unsplash.com/photo-1555949963-ff98c2772f1a?q=80&w=800' },
];

interface ClassCardProps {
    classInfo: ClassInfo;
    onNavigate: (view: View, classId: string) => void;
    onShare: (classInfo: ClassInfo) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classInfo, onNavigate, onShare }) => {
    return (
        <div className="w-full bg-[--color-surface-solid] rounded-xl shadow-lg overflow-hidden flex flex-col group text-left transition-transform transform hover:-translate-y-1.5 hover:shadow-2xl">
            <button onClick={() => onNavigate('class-detail', classInfo.id)} className="w-full text-left flex flex-col h-full">
                <div className="relative h-28 w-full">
                    <img src={classInfo.image} alt={classInfo.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4">
                        <h3 className="text-white text-xl font-bold leading-tight group-hover:text-[--color-accent-400] transition-colors">{classInfo.name}</h3>
                        <p className="text-white/90 text-sm">{classInfo.subject}</p>
                    </div>
                </div>
                <div className="flex-1 p-4 border-t-2 border-[--color-accent-500]">
                     <div className="flex items-center gap-2 text-sm text-[--color-text-secondary]">
                        <UserIcon className="w-4 h-4"/>
                        <span>{classInfo.teacher}</span>
                     </div>
                </div>
            </button>
            <div className="px-4 py-2 border-t border-[--color-border-secondary] mt-auto flex justify-end bg-slate-50/50">
                 <button 
                     onClick={(e) => { e.stopPropagation(); onShare(classInfo); }}
                     className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                     title="Chia sẻ liên kết"
                 >
                     <ShareIcon className="w-4 h-4"/>
                 </button>
            </div>
        </div>
    )
}

interface TrainingDashboardViewProps {
  user: User;
  onNavigate: (view: View, classId?: string) => void;
}

const TrainingDashboardView: React.FC<TrainingDashboardViewProps> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const classes = mockClasses;
    const [toastMessage, setToastMessage] = useState('');

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
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(`Đã sao chép liên kết khoá đào tạo: "${classInfo.name}"!`);
        });
    };

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] gap-3 pb-24 md:pb-8 relative">
            <div className="shrink-0">
                <TrainingBanner />
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[--color-text-primary]">{t('myClasses')}</h2>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 py-2 px-4 bg-gradient-to-br from-[--color-accent-500] to-[--color-accent-gradient-secondary] text-white font-bold rounded-lg shadow-lg hover:shadow-[--color-accent-shadow] transition-all transform hover:scale-105">
                            <PlusIcon className="w-5 h-5"/>
                            <span className="hidden sm:inline">{t('createClass')}</span>
                        </button>
                    </div>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {classes.map(classInfo => (
                        <ClassCard key={classInfo.id} classInfo={classInfo} onNavigate={onNavigate} onShare={handleShareClass} />
                    ))}
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

export default TrainingDashboardView;