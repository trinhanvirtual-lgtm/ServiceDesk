import React, { useState, useEffect, useRef } from 'react';
import { User } from '../App';
import { Post, PostType } from './NewsfeedView';
import { useLanguage } from './LanguageContext';
import { 
    XIcon, UploadIcon
} from './icons';
import { 
  Sparkles, 
  Megaphone, 
  Heart, 
  Lightbulb, 
  BarChart3, 
  MessageCircle, 
  Calendar, 
  Trophy,
  Zap,
  PartyPopper
} from 'lucide-react';

interface CreatePostModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (post: Omit<Post, 'id' | 'timestamp' | 'reactions' | 'comments' | 'isPinned' | 'isSaved' | 'isRead'>) => void;
    initialType?: PostType;
}

const solidColors = [
  { name: 'Sáng trong veo', css: '#f8fafc', text: '#0f172a' },
  { name: 'Vàng nắng', css: '#fef08a', text: '#854d0e' },
  { name: 'Mát lành bạc hà', css: '#bbf7d0', text: '#166534' },
  { name: 'Đào phấn hồng', css: '#fbcfe8', text: '#9d174d' },
  { name: 'Đỏ hoàng gia', css: '#fee2e2', text: '#991b1b' },
  { name: 'Xanh thanh thản', css: '#ccfbf1', text: '#115e59' },
  { name: 'Phấn xanh', css: '#bfdbfe', text: '#1e40af' },
  { name: 'Nho tím nhạt', css: '#f3e8ff', text: '#6b21a8' },
];

const gradients = [
  { name: 'Đào rực rỡ', css: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', text: '#5c1d40' },
  { name: 'Vũ trụ đêm', css: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', text: '#ffffff' },
  { name: 'Phép thuật Lavender', css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff' },
  { name: 'Rừng nhiệt đới', css: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', text: '#ffffff' },
  { name: 'Biển xanh thẳm', css: 'linear-gradient(120deg, #1e3c72 0%, #2a5298 100%)', text: '#ffffff' },
  { name: 'Chanh sảng khoái', css: 'linear-gradient(135deg, #fef08a 0%, #f97316 100%)', text: '#ffffff' },
  { name: 'Hồng phi lê', css: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', text: '#ffffff' },
];

const kudosBadges = [
  { value: 'star', label: 'Ngôi sao Sáng 🌟', color: 'bg-amber-100 text-amber-700' },
  { value: 'heart', label: 'Tử tế & Chia sẻ ❤️', color: 'bg-rose-100 text-rose-700' },
  { value: 'bulb', label: 'Sáng tạo Không ngừng 💡', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'cup', label: 'Chiến binh Doanh số 🏆', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'party', label: 'Đồng đội Quách tỉnh 🎉', color: 'bg-purple-100 text-purple-700' },
] as const;

const CreatePostModal: React.FC<CreatePostModalProps> = ({ user, isOpen, onClose, onSubmit, initialType = 'quick' }) => {
    const { t } = useLanguage();
    const [content, setContent] = useState('');
    const [type, setType] = useState<PostType>(initialType);
    const [imageUrl, setImageUrl] = useState('');
    const [audience, setAudience] = useState<'company' | 'group' | 'private'>('company');
    const localImageInputRef = useRef<HTMLInputElement>(null);

    // Advanced fields state
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
    
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    
    const [kudosRecipient, setKudosRecipient] = useState('');
    const [kudosBadge, setKudosBadge] = useState<'star' | 'heart' | 'bulb' | 'cup' | 'party'>('star');
    
    const [welcomeName, setWelcomeName] = useState('');
    const [welcomeRole, setWelcomeRole] = useState('');
    
    const [bgGradient, setBgGradient] = useState<string>('');
    const [bgColor, setBgColor] = useState<string>('');
    const [bgImage, setBgImage] = useState<string>('');
    const [bgTextColor, setBgTextColor] = useState<string>('');
    const backgroundUploadRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setType(initialType);
            // Pre-seed some default descriptions based on preset options
            if (initialType === 'welcome') {
                setContent('Chào mừng người bạn mới gia nhập đại gia đình chúng ta! Chúc bạn có những trải nghiệm thăng hoa nhất! 🚀');
            } else if (initialType === 'kudos') {
                setContent('Cảm ơn bạn vì sự nỗ lực tuyệt vời và đóng góp không ngừng nghỉ đóng góp cho sự thành công chung! Proud of you! 👏');
            } else if (initialType === 'poll') {
                setContent('Mọi người vui lòng cho ý kiến biểu quyết về chủ đề dưới đây nhé:');
            } else if (initialType === 'event') {
                setContent('Sự kiện cực kỳ quan trọng sắp diễn ra! Hãy ghi nhận lịch trình để không bỏ lỡ!');
            } else {
                setContent('');
            }
            setImageUrl('');
            setPollQuestion('');
            setPollOptions(['', '']);
            setEventTitle('');
            setEventDate('');
            setEventTime('');
            setEventLocation('');
            setKudosRecipient('');
            setKudosBadge('star');
            setWelcomeName('');
            setWelcomeRole('');
            setBgGradient('');
            setBgColor('');
            setBgImage('');
            setBgTextColor('');
        }
    }, [isOpen, initialType]);

    if (!isOpen) return null;

    const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                if (base64) {
                    setImageUrl(base64);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddPollOption = () => {
        setPollOptions([...pollOptions, '']);
    };

    const handleRemovePollOption = (idx: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== idx));
        }
    };

    const handlePollOptionChange = (idx: number, val: string) => {
        const updated = [...pollOptions];
        updated[idx] = val;
        setPollOptions(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalContent = content.trim();
        
        // Validation & dynamic construction of content based on types
        const payload: Omit<Post, 'id' | 'timestamp' | 'reactions' | 'comments' | 'isPinned' | 'isSaved' | 'isRead'> = {
            author: { name: user.name, avatar: user.avatar || '' },
            type,
            content: finalContent,
            audience,
            tags: [],
            feeling: '',
            location: '',
        };

        if (bgColor) payload.backgroundColor = bgColor;
        if (bgGradient) payload.backgroundGradient = bgGradient;
        if (bgImage) payload.backgroundImage = bgImage;
        if (bgTextColor) payload.backgroundTextColor = bgTextColor;

        if (imageUrl.trim()) {
            payload.image = imageUrl.trim();
        }

        if (type === 'poll') {
            const validOptions = pollOptions.filter(o => o.trim() !== '');
            if (!pollQuestion.trim() || validOptions.length < 2) {
                alert('Vui lòng nhập câu hỏi bình chọn và ít nhất 2 phương án trả lời!');
                return;
            }
            payload.poll = {
                question: pollQuestion.trim(),
                options: validOptions.map(opt => ({
                    id: Math.random().toString(36).substring(2, 9),
                    text: opt.trim(),
                    votes: 0,
                    voters: []
                }))
            };
            if (!finalContent) {
                payload.content = `📊 Biểu quyết: ${pollQuestion.trim()}`;
            }
        } else if (type === 'event') {
            if (!eventTitle.trim() || !eventDate || !eventLocation.trim()) {
                alert('Vui lòng điền thông tin sự kiện đầy đủ (Tên, Ngày, Địa điểm)!');
                return;
            }
            payload.event = {
                title: eventTitle.trim(),
                date: eventDate,
                time: eventTime || 'Cả ngày',
                location: eventLocation.trim(),
                attendees: []
            };
            if (!finalContent) {
                payload.content = `📅 Sự kiện: ${eventTitle.trim()} tại ${eventLocation.trim()}`;
            }
        } else if (type === 'kudos') {
            if (!kudosRecipient.trim()) {
                alert('Vui lòng chọn hoặc điền tên đồng nghiệp được vinh danh!');
                return;
            }
            const selectedBadgeConfig = kudosBadges.find(b => b.value === kudosBadge);
            payload.kudos = {
                recipient: kudosRecipient.trim(),
                badge: kudosBadge,
                badgeLabel: selectedBadgeConfig?.label || 'Super Star 🌟'
            };
            if (!finalContent) {
                payload.content = `🏆 Khen thưởng danh giá trao cho đồng nghiệp ${kudosRecipient.trim()}!`;
            }
        } else if (type === 'welcome') {
            if (!welcomeName.trim()) {
                alert('Vui lòng nhập tên thành viên mới!');
                return;
            }
            payload.welcome = {
                name: welcomeName.trim(),
                role: welcomeRole.trim() || 'Nhân viên mới'
            };
            if (!finalContent) {
                payload.content = `🤝 Chào đón thành viên mới ${welcomeName.trim()} gia nhập phòng ban ${welcomeRole.trim() || 'Công ty'}!`;
            }
        } else if (type === 'styled') {
            if (!bgGradient) {
                alert('Vui lòng chọn một theme màu nền để tạo bài viết phong cách!');
                return;
            }
            payload.backgroundGradient = bgGradient;
            if (!finalContent) {
                alert('Chọn bài viết Styled update yêu cầu nhập nội dung hiển thị!');
                return;
            }
        }

        onSubmit(payload);
        onClose();
    };

    const postTypes: { value: PostType; label: string; icon: React.ReactNode; color: string }[] = [
        { value: 'quick', label: 'Cập nhật nhanh', icon: <Zap className="w-4 h-4" />, color: 'text-purple-500' },
        { value: 'announcement', label: 'Thông báo mới', icon: <Megaphone className="w-4 h-4" />, color: 'text-orange-500' },
        { value: 'welcome', label: 'Chào đón thành viên', icon: <Heart className="w-4 h-4" />, color: 'text-teal-500' },
        { value: 'idea', label: 'Chia sẻ một ý tưởng', icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-500' },
        { value: 'poll', label: 'Bình chọn', icon: <BarChart3 className="w-4 h-4" />, color: 'text-indigo-500' },
        { value: 'discussion', label: 'Thảo luận mới', icon: <MessageCircle className="w-4 h-4" />, color: 'text-sky-500' },
        { value: 'event', label: 'Sự kiện', icon: <Calendar className="w-4 h-4" />, color: 'text-emerald-500' },
        { value: 'kudos', label: 'Khen thưởng', icon: <Trophy className="w-4 h-4" />, color: 'text-red-500' },
        { value: 'styled', label: 'Mẫu màu phong cách', icon: <Sparkles className="w-4 h-4" />, color: 'text-pink-500' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-fade-in-up border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center px-6 py-4.3 border-b border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {postTypes.find(pt => pt.value === type)?.icon}
                        Tạo bài viết {postTypes.find(pt => pt.value === type)?.label.toLowerCase()}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scroll">
                    {/* Author & Audience selection */}
                    <div className="flex gap-3 items-center">
                        <img src={user.avatar || undefined} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-amber-100 text-amber-800 ring-2 ring-white shadow-sm" />
                        <div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{user.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <select 
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value as 'company' | 'group' | 'private')}
                                    className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md px-2 py-1 outline-none font-semibold border-none cursor-pointer"
                                >
                                    <option value="company">Toàn công ty</option>
                                    <option value="group">Nhóm Marketing</option>
                                    <option value="private">Chỉ mình tôi</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Standard Content Text Box */}
                    <div className="space-y-1 bg-slate-100/10 dark:bg-slate-950/20 p-1 rounded-2xl">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Chia sẻ nội dung</label>
                        <div className="relative rounded-xl overflow-hidden">
                            {bgImage && (
                                <div 
                                    className="absolute inset-0 bg-cover bg-center transition-all duration-300 scale-102 blur-[0.2px]"
                                    style={{ backgroundImage: `url(${bgImage})` }}
                                />
                            )}
                            {bgImage && (
                                <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />
                            )}
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={t('whatAreYouThinking', { userName: user.name.split(' ')[0] }) + "..."}
                                className={`w-full p-4 bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 relative z-10 ${
                                    bgGradient || bgColor || bgImage 
                                    ? 'text-center font-bold text-base sm:text-lg text-white shadow-inner py-10 px-4 min-h-[160px] bg-transparent border-transparent focus:ring-0 placeholder:text-white/70' 
                                    : 'h-24 dark:text-white'
                                }`}
                                style={{
                                    background: bgGradient ? bgGradient : (bgColor ? bgColor : undefined),
                                    color: (bgGradient || bgColor || bgImage) ? (bgTextColor || '#ffffff') : undefined
                                }}
                            />
                        </div>
                    </div>

                    {/* DYNAMIC COMPONENT INPUT BLOCKS */}

                    {/* Thiết lập hình màu & hình nền nổi bật */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                            🎨 Thiết lập hình màu & hình nền bài viết
                        </label>
                        
                        {/* Selector Tabs for Background Style */}
                        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setBgGradient('');
                                    setBgColor('');
                                    setBgImage('');
                                    setBgTextColor('');
                                }}
                                className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-md transition duration-150 whitespace-nowrap ${
                                    !bgGradient && !bgColor && !bgImage 
                                    ? 'bg-slate-900 text-white dark:bg-slate-800' 
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                }`}
                            >
                                Mặc định
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBgGradient('');
                                    setBgImage('');
                                    setBgColor('#fef08a');
                                    setBgTextColor('#854d0e');
                                }}
                                className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-md transition duration-150 whitespace-nowrap ${
                                    bgColor 
                                    ? 'bg-slate-900 text-white dark:bg-slate-800' 
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                }`}
                            >
                                Hình màu sắc đơn
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBgColor('');
                                    setBgImage('');
                                    setBgGradient('linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)');
                                    setBgTextColor('#5c1d40');
                                }}
                                className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-md transition duration-150 whitespace-nowrap ${
                                    bgGradient 
                                    ? 'bg-slate-900 text-white dark:bg-slate-800' 
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                }`}
                            >
                                Dải màu Gradient
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    backgroundUploadRef.current?.click();
                                }}
                                className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-md transition duration-150 whitespace-nowrap border flex items-center gap-1.5 ${
                                    bgImage 
                                    ? 'bg-slate-900 text-white dark:bg-slate-800 border-transparent' 
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                }`}
                            >
                                🖼️ Tải lên hình nền
                            </button>
                        </div>

                        {/* Rendering solid color presets */}
                        {bgColor !== undefined && bgColor !== '' && (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chọn màu chủ đạo</label>
                                <div className="flex gap-2 flex-wrap">
                                    {solidColors.map((sc, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setBgColor(sc.css);
                                                setBgTextColor(sc.text);
                                            }}
                                            className={`w-8 h-8 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md relative shrink-0 ${bgColor === sc.css ? 'ring-4 ring-offset-2 ring-cyan-500' : ''}`}
                                            style={{ backgroundColor: sc.css }}
                                            title={sc.name}
                                        >
                                            {bgColor === sc.css && (
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: sc.text }}>
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rendering customizable linear-gradients list */}
                        {bgGradient !== undefined && bgGradient !== '' && (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chọn dải màu rực rỡ</label>
                                <div className="flex gap-2 flex-wrap">
                                    {gradients.map((g, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setBgGradient(g.css);
                                                setBgTextColor(g.text);
                                            }}
                                            className={`w-8 h-8 rounded-lg hover:scale-110 active:scale-95 transition-all shadow-md relative shrink-0 ${bgGradient === g.css ? 'ring-4 ring-offset-2 ring-cyan-500' : ''}`}
                                            style={{ background: g.css }}
                                            title={g.name}
                                        >
                                            {bgGradient === g.css && (
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: g.text }}>
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Background Custom Upload Field with file Input Ref */}
                        <div className="hidden">
                            <input 
                                type="file"
                                ref={backgroundUploadRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const base64 = event.target?.result as string;
                                            if (base64) {
                                                setBgImage(base64);
                                                setBgTextColor('#ffffff');
                                                // Clear existing coloring states
                                                setBgColor('');
                                                setBgGradient('');
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                accept="image/*"
                            />
                        </div>

                        {bgImage && (
                            <div className="pt-1 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hình nền của bạn</label>
                                <div className="relative rounded-xl overflow-hidden shadow-sm max-w-sm border border-slate-200 dark:border-slate-800 bg-black/10">
                                    <img src={bgImage} alt="Custom Background Cover" className="w-full h-20 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setBgImage('')}
                                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Type 2: Poll options */}
                    {type === 'poll' && (
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/50 rounded-xl space-y-3">
                            <div>
                                <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-1">Câu hỏi bình chọn</label>
                                <input 
                                    type="text"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                    placeholder="Ví dụ: Chúng ta nên liên hoan ở đâu cuối tuần này?"
                                    className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">Các phương án trả lời</label>
                                {pollOptions.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input 
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                                            placeholder={`Phương án ${idx + 1}`}
                                            className="flex-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                        />
                                        {pollOptions.length > 2 && (
                                            <button 
                                                type="button"
                                                onClick={() => handleRemovePollOption(idx)}
                                                className="text-red-500 hover:text-red-700 text-sm font-bold w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center transition"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddPollOption}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                >
                                    + Thêm phương án quyết định
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Type 3: Event details */}
                    {type === 'event' && (
                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/50 rounded-xl space-y-3">
                            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Chi tiết sự kiện doanh nghiệp</label>
                            
                            <div className="space-y-2">
                                <input 
                                    type="text"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    placeholder="Tên sự kiện (VD: Chạy Marathon Công Ty, Team Building...)"
                                    className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-white"
                                    />
                                    <input 
                                        type="text"
                                        value={eventTime}
                                        onChange={(e) => setEventTime(e.target.value)}
                                        placeholder="Giờ diễn ra (VD: 09:00 - 11:30)"
                                        className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <input 
                                    type="text"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                    placeholder="Địa điểm tổ chức sự kiện"
                                    className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Type 4: Kudos / Praise */}
                    {type === 'kudos' && (
                        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/50 rounded-xl space-y-3">
                            <label className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Khen thưởng & Biểu dương xuất sắc</label>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[11px] font-bold text-rose-600 block mb-1">Đồng nghiệp nhận khen thưởng</label>
                                    <input 
                                        type="text"
                                        value={kudosRecipient}
                                        onChange={(e) => setKudosRecipient(e.target.value)}
                                        placeholder="Nhập tên đồng nghiệp xuất sắc..."
                                        className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[11px] font-bold text-rose-600 block mb-1">Huy hiệu danh giá</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {kudosBadges.map(b => (
                                            <button
                                                key={b.value}
                                                type="button"
                                                onClick={() => setKudosBadge(b.value)}
                                                className={`text-left p-2.5 rounded-lg border text-xs font-semibold transition flex items-center gap-2 ${
                                                    kudosBadge === b.value 
                                                    ? 'bg-rose-500 border-rose-600 text-white' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 dark:border-slate-800'
                                                }`}
                                            >
                                                {b.value === 'star' && <Trophy className="w-4 h-4" />}
                                                {b.value === 'heart' && <Heart className="w-4 h-4" />}
                                                {b.value === 'bulb' && <Lightbulb className="w-4 h-4" />}
                                                {b.value === 'cup' && <Trophy className="w-4 h-4" />}
                                                {b.value === 'party' && <PartyPopper className="w-4 h-4" />}
                                                <span>{b.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Type 5: Welcome member */}
                    {type === 'welcome' && (
                        <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-950/50 rounded-xl space-y-3">
                            <label className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">Chào đón đồng hương mới gia nhập</label>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="text"
                                    value={welcomeName}
                                    onChange={(e) => setWelcomeName(e.target.value)}
                                    placeholder="Tên thành viên mới..."
                                    className="w-full bg-white dark:bg-slate-900 border border-teal-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                                />
                                <input 
                                    type="text"
                                    value={welcomeRole}
                                    onChange={(e) => setWelcomeRole(e.target.value)}
                                    placeholder="Phòng ban / Chức vụ..."
                                    className="w-full bg-white dark:bg-slate-900 border border-teal-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Local File / Image Uploader with Preview */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hình ảnh tiêu đề / đính kèm</label>
                        {imageUrl && (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100">
                                <img src={imageUrl} alt="Attached preview" className="w-full h-40 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl('')}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="Nhập URL hình ảnh đính kèm..."
                                className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => localImageInputRef.current?.click()}
                                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition duration-150 flex items-center gap-1.5 shrink-0"
                            >
                                <UploadIcon className="w-4 h-4" />
                                <span>Tải lên</span>
                            </button>
                            <input 
                                type="file"
                                ref={localImageInputRef}
                                onChange={handleLocalImageSelect}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Quick Select Type Tabs */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Thay đổi định dạng bài đăng</label>
                        <div className="flex flex-wrap gap-1.5 pb-1">
                            {postTypes.map(pt => (
                                <button
                                    key={pt.value}
                                    type="button"
                                    onClick={() => setType(pt.value)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                                        type === pt.value 
                                        ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm scale-110 font-bold' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                                    }`}
                                >
                                    {pt.icon}
                                    <span>{pt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-cyan-600 dark:bg-cyan-700 text-white font-bold py-3.5 rounded-xl hover:bg-cyan-700 dark:hover:bg-cyan-800 transition shadow-lg shadow-cyan-600/15 active:scale-98"
                    >
                        Chia sẻ bài viết
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
