import React, { useState, useMemo, useEffect, useRef } from 'react';
import NewsfeedBanner from './NewsfeedBanner';
import CreatePostModal from './CreatePostModal';
import { User } from '../App';
import { useLanguage } from './LanguageContext';
import { 
    SearchIcon, FileTextIcon, GiftIcon, ImageIcon, 
    PinIcon, BookmarkIcon, MessageSquareIcon, MoreHorizontalIcon,
    ListIcon, EyeOffIcon, XIcon, SyncIcon
} from './icons';
import { 
  Sparkles as SparklesIcon,
  MessageSquare as MessageSquareIconLc,
  Megaphone as MegaphoneIconLc,
  Heart as HeartIconLc,
  Lightbulb as LightbulbIconLc,
  BarChart3 as BarChartIconLc,
  MessageCircle as MessageCircleIconLc,
  Calendar as CalendarIconLc,
  MoreHorizontal as MoreHorizontalIconLc,
  Bookmark as BookmarkIconLc,
  Pin as PinIconLc,
  Check as CheckIconLc,
  Users as UsersIconLc,
  Trophy as TrophyIconLc,
  UserPlus as UserPlusIconLc,
  Zap as ZapIconLc
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { db, auth } from '../firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    doc, 
    serverTimestamp,
    Timestamp 
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error [${operationType}] at ${path}:`, error);
}

// --- TYPES ---
export type PostType = 'announcement' | 'idea' | 'document' | 'celebration' | 'media' | 'quick' | 'styled' | 'welcome' | 'poll' | 'discussion' | 'event' | 'kudos';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // User names who reacted
}

export interface Comment {
    id: string;
    author: { name: string; avatar: string; };
    text: string;
    timestamp: string;
}

export interface Post {
    id: string;
    author: { name: string; avatar: string; };
    timestamp: string;
    type: PostType;
    content: string;
    image?: string;
    document?: { name: string; size: string };
    tags: string[];
    isPinned: boolean;
    isSaved: boolean;
    isRead: boolean;
    reactions: Reaction[];
    comments: Comment[];
    summary?: string;
    feeling?: string;
    location?: string;
    taggedUsers?: { name: string }[];
    audience?: 'company' | 'group' | 'private';
    
    // Custom properties for rich interactive cards
    poll?: {
        question: string;
        options: { id: string; text: string; votes: number; voters: string[] }[];
    };
    event?: {
        title: string;
        date: string;
        time: string;
        location: string;
        attendees: string[];
    };
    kudos?: {
        recipient: string;
        badge: string;
        badgeLabel: string;
    };
    welcome?: {
        name: string;
        role: string;
    };
    backgroundGradient?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundTextColor?: string;
}

// --- CONFIGS ---
const postTypeConfig: Record<PostType, { label: string; icon: React.ReactNode; color: string; }> = {
    announcement: { label: 'Thông báo mới', icon: <MegaphoneIconLc className="w-4 h-4" />, color: 'bg-orange-500' },
    idea: { label: 'Chia sẻ một ý tưởng', icon: <LightbulbIconLc className="w-4 h-4" />, color: 'bg-yellow-500' },
    document: { label: 'Tài liệu', icon: <FileTextIcon className="w-4 h-4" />, color: 'bg-blue-500' },
    celebration: { label: 'Chúc mừng', icon: <GiftIcon className="w-4 h-4" />, color: 'bg-pink-500' },
    media: { label: 'Hình ảnh/Video', icon: <ImageIcon className="w-4 h-4" />, color: 'bg-green-500' },
    quick: { label: 'Cập nhật nhanh', icon: <ZapIconLc className="w-4 h-4" />, color: 'bg-cyan-500' },
    styled: { label: 'Mẫu màu phong cách', icon: <SparklesIcon className="w-4 h-4" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    welcome: { label: 'Chào đón thành viên', icon: <HeartIconLc className="w-4 h-4" />, color: 'bg-teal-500' },
    poll: { label: 'Bình chọn', icon: <BarChartIconLc className="w-4 h-4" />, color: 'bg-indigo-500' },
    discussion: { label: 'Thảo luận mới', icon: <MessageCircleIconLc className="w-4 h-4" />, color: 'bg-violet-500' },
    event: { label: 'Sự kiện', icon: <CalendarIconLc className="w-4 h-4" />, color: 'bg-emerald-500' },
    kudos: { label: 'Khen thưởng', icon: <TrophyIconLc className="w-4 h-4" />, color: 'bg-rose-500' },
};

const PostCard: React.FC<{ 
    post: Post; 
    user?: User;
    onTogglePin: (id: string) => void; 
    onToggleSave: (id: string) => void; 
    onUpdatePost: (updatedPost: Post) => void; 
    onVotePoll?: (id: string, optId: string) => void;
    onJoinEvent?: (id: string) => void;
}> = ({ post, user, onTogglePin, onToggleSave, onUpdatePost, onVotePoll, onJoinEvent }) => {
    const config = postTypeConfig[post.type] || postTypeConfig.quick;
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [commentText, setCommentText] = useState('');
    const { t } = useLanguage();

    const handleSummarize = async () => {
        setIsSummarizing(true);
        try {
            if (!process.env.API_KEY) throw new Error("API key is not configured.");
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Summarize the following text in a concise way for a company newsfeed. Respond in Vietnamese. Text: "${post.content}"`,
            });
            onUpdatePost({ ...post, summary: response.text });
        } catch (error) {
            console.error("Error summarizing:", error);
            const errorMessage = "Lỗi khi tóm tắt. Vui lòng thử lại.";
            onUpdatePost({ ...post, summary: errorMessage });
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleEmojiReaction = (emoji: string) => {
        const userName = user?.name || "Bạn";
        const updatedReactions = [...post.reactions];
        const matchIdx = updatedReactions.findIndex(r => r.emoji === emoji);
        
        if (matchIdx >= 0) {
            const reactionObj = updatedReactions[matchIdx];
            const hasReacted = reactionObj.users.includes(userName);
            if (hasReacted) {
                // Remove reaction
                const newUsers = reactionObj.users.filter(u => u !== userName);
                if (newUsers.length === 0 && updatedReactions.length > 1) {
                    updatedReactions.splice(matchIdx, 1);
                } else {
                    updatedReactions[matchIdx] = { 
                        ...reactionObj, 
                        count: Math.max(0, reactionObj.count - 1), 
                        users: newUsers 
                    };
                }
            } else {
                // Add to existing
                updatedReactions[matchIdx] = { 
                    ...reactionObj, 
                    count: reactionObj.count + 1, 
                    users: [...reactionObj.users, userName] 
                };
            }
        } else {
            // New emoji reaction
            updatedReactions.push({ emoji, count: 1, users: [userName] });
        }
        
        onUpdatePost({ ...post, reactions: updatedReactions });
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        const newComment: Comment = {
            id: `cmt-${Date.now()}`,
            author: { name: user?.name || "Đồng nghiệp", avatar: user?.avatar || "" },
            text: commentText.trim(),
            timestamp: "Just now"
        };

        onUpdatePost({
            ...post,
            comments: [...post.comments, newComment]
        });
        setCommentText('');
    };

    const buildHeaderText = () => {
        if (!post.feeling && !post.taggedUsers?.length && !post.location) return null;
        
        const parts = [];
        if (post.feeling) {
            parts.push(`${t('isFeeling')} ${post.feeling}`);
        }
        if (post.taggedUsers && post.taggedUsers.length > 0) {
            const taggedNames = post.taggedUsers.map(u => u.name).join(', ');
            parts.push(`${t('with')} ${taggedNames}`);
        }
        if (post.location) {
            parts.push(`${t('at')} ${post.location}`);
        }
        return <span className="font-normal text-slate-500"> {parts.join(' ')}</span>;
    };

    return (
        <div className="bg-[--color-surface-secondary] border border-[--color-border-secondary] backdrop-blur-md rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <img 
                        src={post.author.avatar.startsWith('http') ? post.author.avatar : undefined} 
                        alt={post.author.name} 
                        className="w-11 h-11 rounded-full object-cover bg-amber-100 text-amber-800 ring-2 ring-slate-100 dark:ring-slate-800 font-bold flex items-center justify-center text-xs" 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div>
                        <p className="font-bold text-sm text-[--color-text-primary]">
                            {post.author.name}
                            {buildHeaderText()}
                        </p>
                        <p className="text-[11px] text-[--color-text-secondary] font-semibold">{post.timestamp}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-[10px] font-bold text-white px-2.5 py-1 rounded-full ${config.color}`}>
                        {config.icon}
                        <span>{config.label}</span>
                    </div>
                    {post.isPinned && <span title="Pinned post"><PinIconLc className="w-4 h-4 text-amber-500" /></span>}
                    <div className="relative group">
                         <button className="p-1.5 rounded-full hover:bg-[--color-surface-tertiary] text-slate-400"><MoreHorizontalIcon className="w-4 h-4"/></button>
                         <div className="absolute top-full right-0 mt-1 w-44 bg-[--color-surface-tertiary] rounded-xl shadow-xl border border-[--color-border-secondary] z-30 p-1.5 hidden group-hover:block animate-fade-in-down">
                            <button onClick={() => onTogglePin(post.id)} className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[--color-text-primary]">
                                <PinIconLc className="w-3.5 h-3.5"/>
                                {post.isPinned ? 'Bỏ ghim' : 'Ghim bài viết'}
                            </button>
                            <button onClick={() => onToggleSave(post.id)} className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-[--color-text-primary]">
                                <BookmarkIconLc className="w-3.5 h-3.5"/>
                                {post.isSaved ? 'Bỏ lưu' : 'Lưu bài đăng'}
                            </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Post CONTENT rendering based on background or gradient styling */}
            {(post.backgroundGradient || post.backgroundColor || post.backgroundImage) ? (
                <div 
                    className="mt-4 p-8 text-center rounded-2xl shadow-lg font-extrabold text-base sm:text-lg flex flex-col items-center justify-center relative overflow-hidden min-h-[140px]"
                    style={{ 
                        background: post.backgroundGradient 
                            ? post.backgroundGradient 
                            : (post.backgroundColor ? post.backgroundColor : undefined),
                        backgroundImage: post.backgroundImage ? `url(${post.backgroundImage})` : undefined,
                        backgroundSize: post.backgroundImage ? 'cover' : undefined,
                        backgroundPosition: post.backgroundImage ? 'center' : undefined,
                        color: post.backgroundTextColor || '#ffffff'
                    }}
                >
                    {/* Subtle overlay layer if there's a background image to make text pop */}
                    {post.backgroundImage && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[0.5px] z-0 pointer-events-none" />
                    )}
                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl z-0" />
                    <p className="whitespace-pre-wrap leading-relaxed drop-shadow-md z-10 font-bold relative text-white">
                        {post.content}
                    </p>
                </div>
            ) : (
                <div className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                     {post.summary ? (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl italic border border-indigo-100/30">
                            <h4 className="font-bold not-italic text-indigo-700 dark:text-indigo-400 text-xs mb-1">✨ Tóm tắt AI:</h4>
                            <p>{post.summary}</p>
                        </div>
                     ) : (
                        <p className="whitespace-pre-wrap">{post.content}</p>
                     )}
                     {post.content.length > 200 && !post.summary && (
                         <button onClick={handleSummarize} disabled={isSummarizing} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 hover:underline disabled:opacity-50">
                            {isSummarizing ? 'Đang tóm tắt...' : '✨ Tóm tắt bằng AI'}
                         </button>
                     )}
                </div>
            )}

            {/* DYNAMIC POST COMPONENT ATTACHMENTS */}

            {/* 1. Poll Display */}
            {post.type === 'poll' && post.poll && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-snug">
                        <BarChartIconLc className="w-4 h-4 text-indigo-500" />
                        {post.poll.question}
                    </h4>
                    <div className="space-y-2">
                        {post.poll.options.map((opt) => {
                            const totalVotes = post.poll?.options.reduce((sum, o) => sum + o.votes, 0) || 0;
                            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            const currentUserName = user?.name || "Hung Thai";
                            const hasVoted = opt.voters.includes(currentUserName);
                            
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => onVotePoll && onVotePoll(post.id, opt.id)}
                                    className={`w-full text-left relative overflow-hidden py-3 px-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between group ${
                                        hasVoted 
                                        ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800' 
                                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div 
                                        className="absolute top-0 left-0 bottom-0 bg-indigo-100/50 dark:bg-indigo-950/40 transition-all duration-500"
                                        style={{ width: `${percent}%` }}
                                    />
                                    <span className="relative font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        {hasVoted && <CheckIconLc className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                        {opt.text}
                                    </span>
                                    <span className="relative text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                                        {opt.votes} vote ({percent}%)
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 2. Event Display */}
            {post.type === 'event' && post.event && (
                <div className="mt-4 p-4 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="bg-emerald-500 text-white rounded-xl py-2 px-3 flex flex-col items-center justify-center shadow-md shrink-0 text-center min-w-[70px]">
                        <span className="text-[9px] uppercase font-black tracking-wider opacity-90">Hội Thảo</span>
                        <span className="text-xl font-bold">EVENT</span>
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm">
                            {post.event.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-semibold">
                            <p>🕒 Thời gian: {post.event.time} ({post.event.date})</p>
                            <p>📍 Địa điểm: {post.event.location}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onJoinEvent && onJoinEvent(post.id)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shrink-0 ${
                            post.event.attendees.includes(user?.name || "Hung Thai")
                            ? 'bg-emerald-600 text-white shadow shadow-emerald-700/20'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 font-semibold'
                        }`}
                    >
                        {post.event.attendees.includes(user?.name || "Hung Thai") ? '✓ Đăng ký tham gia' : 'Đăng ký tham gia'}
                    </button>
                </div>
            )}

            {/* 3. Kudos / Praise Display */}
            {post.type === 'kudos' && post.kudos && (
                <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50/30 dark:from-rose-950/15 dark:to-pink-950/5 border border-rose-100 dark:border-rose-950/30 rounded-xl relative overflow-hidden flex items-center gap-4">
                    <div className="absolute top-0 right-0 opacity-[0.04] text-rose-500 font-black text-6xl italic pointer-events-none">THANK YOU</div>
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-inner">
                        <TrophyIconLc className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 relative z-10">
                        <span className="text-[9px] bg-rose-500 text-white rounded-full px-2.5 py-0.5 font-extrabold uppercase tracking-wide">KHEN THƯỞNG BIỂU DƯƠNG</span>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-xs sm:text-sm pt-1">
                            Chúc mừng vinh quang đồng hương: <span className="text-xl text-rose-600 dark:text-rose-400 font-black block sm:inline">{post.kudos.recipient}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            Tuyên dương danh hiệu: <span className="underline decoration-pink-500 font-bold text-slate-700 dark:text-slate-200">{post.kudos.badgeLabel}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* 4. Welcome teammate Display */}
            {post.type === 'welcome' && post.welcome && (
                <div className="mt-4 p-4 bg-teal-50/30 dark:bg-teal-950/15 border border-teal-100 dark:border-teal-950/40 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                        <UserPlusIconLc className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] bg-teal-500 text-white rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">CHÀO ĐÓN THÀNH VIÊN MỚI</span>
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-xs sm:text-sm pt-1">
                            Chào mừng đồng đội: <span className="text-teal-600 dark:text-teal-400 font-black">{post.welcome.name}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            Chức vụ / Phòng ban: <span className="font-bold text-slate-700 dark:text-slate-200">{post.welcome.role}</span>
                        </p>
                    </div>
                </div>
            )}

            {post.image && <img src={post.image} alt="Attached visual" className="mt-4 rounded-xl w-full h-auto max-h-80 object-cover border border-slate-100 dark:border-slate-800" />}
            {post.document && (
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center gap-3">
                    <FileTextIcon className="w-7 h-7 text-slate-400 shrink-0"/>
                    <div>
                        <p className="font-bold text-xs text-slate-700 dark:text-slate-200">{post.document.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{post.document.size}</p>
                    </div>
                </div>
            )}

            {/* Footer containing Emoji bar & direct comment trigger */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
                    {/* Emoji Reaction button triggers */}
                    <div className="flex gap-1.5 items-center">
                        {['❤️', '🎉', '🔥', '💡'].map(em => {
                            const matchObj = post.reactions.find(r => r.emoji === em);
                            const count = matchObj ? matchObj.count : 0;
                            const currentUserName = user?.name || "Bạn";
                            const hasReacted = matchObj ? matchObj.users.includes(currentUserName) : false;
                            
                            return (
                                <button 
                                    key={em}
                                    type="button"
                                    onClick={() => handleEmojiReaction(em)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                                        hasReacted 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300 transform scale-102' 
                                        : 'bg-slate-50 hover:bg-slate-100 border border-transparent text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <span>{em}</span>
                                    {count > 0 && <span className="text-[11px] font-extrabold">{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                    
                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-cyan-600 transition-colors">
                        <MessageSquareIcon className="w-4 h-4"/> 
                        <span>{post.comments.length} Bình luận</span>
                    </button>
                </div>
                
                {/* Embedded comment area for direct interaction */}
                <div className="mt-4 space-y-3">
                    {post.comments.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100/30 space-y-2.5 max-h-40 overflow-y-auto no-scrollbar">
                            {post.comments.map((cmt) => (
                                <div key={cmt.id} className="flex gap-2.5 items-start text-xs">
                                    <img 
                                        src={cmt.author.avatar.startsWith('http') ? cmt.author.avatar : undefined} 
                                        alt={cmt.author.name} 
                                        className="w-7 h-7 rounded-full object-cover bg-teal-100 shrink-0 text-[10px] font-bold flex items-center justify-center text-teal-800"
                                    />
                                    <div className="flex-1 bg-[--color-surface-primary] border border-[--color-border-secondary] p-2.5 rounded-r-xl rounded-b-xl shadow-xs">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{cmt.author.name}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{cmt.timestamp}</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 font-medium leading-normal">{cmt.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <form onSubmit={handleAddComment} className="flex gap-2">
                        <input 
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Viết bình luận của bạn..."
                            className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 dark:text-white font-semibold"
                        />
                        <button 
                            type="submit"
                            disabled={!commentText.trim()}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                        >
                            Gửi
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- POST COMPOSER MATCHING THE PROVIDED IMAGE ---
const PostComposer: React.FC<{ 
    user: User; 
    onOpenComposerWithType: (type: PostType) => void;
}> = ({ user, onOpenComposerWithType }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const composerActions: { type: PostType; label: string; icon: React.ReactNode; color: string }[] = [
        { type: 'quick', label: 'Cập nhật nhanh', icon: <MessageSquareIconLc className="w-4 h-4 text-cyan-500" />, color: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/20' },
        { type: 'announcement', label: 'Thông báo mới', icon: <MegaphoneIconLc className="w-4 h-4 text-orange-500" />, color: 'hover:bg-orange-50 dark:hover:bg-orange-950/20' },
        { type: 'poll', label: 'Bình chọn', icon: <BarChartIconLc className="w-4 h-4 text-indigo-500" />, color: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/20' },
        { type: 'event', label: 'Sự kiện', icon: <CalendarIconLc className="w-4 h-4 text-emerald-500" />, color: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20' },
    ];

    const dropdownActions: { type: PostType; label: string; icon: React.ReactNode }[] = [
        { type: 'quick', label: 'Cập nhật nhanh', icon: <MessageSquareIconLc className="w-4 h-4 text-cyan-500" /> },
        { type: 'announcement', label: 'Thông báo mới', icon: <MegaphoneIconLc className="w-4 h-4 text-orange-500" /> },
        { type: 'welcome', label: 'Chào đón thành viên', icon: <HeartIconLc className="w-4 h-4 text-rose-500" /> },
        { type: 'idea', label: 'Chia sẻ một ý tưởng', icon: <LightbulbIconLc className="w-4 h-4 text-yellow-500" /> },
        { type: 'poll', label: 'Bình chọn', icon: <BarChartIconLc className="w-4 h-4 text-indigo-500" /> },
        { type: 'discussion', label: 'Thảo luận mới', icon: <MessageCircleIconLc className="w-4 h-4 text-sky-500" /> },
        { type: 'event', label: 'Sự kiện', icon: <CalendarIconLc className="w-4 h-4 text-emerald-500" /> },
        { type: 'kudos', label: 'Khen thưởng', icon: <TrophyIconLc className="w-4 h-4 text-red-500" /> },
        { type: 'styled', label: 'Cập nhật Styled', icon: <SparklesIcon className="w-4 h-4 text-pink-500" /> },
    ];

    return (
        <div className="bg-[--color-surface-secondary] border border-[--color-border-secondary] p-4.5 rounded-2xl shadow-sm mb-6 transition-all duration-300">
            {/* Input Row */}
            <div 
                className="flex items-center gap-3.5 cursor-pointer pb-3.5 border-b border-[--color-border-secondary]" 
                onClick={() => onOpenComposerWithType('quick')}
            >
                <div className="w-11 h-11 bg-amber-100 text-amber-800 dark:bg-slate-850 dark:text-slate-350 flex items-center justify-center p-2 rounded-full w-11 h-11 shrink-0 ring-2 ring-[--color-border-secondary]">
                    <img 
                        src={user.avatar || undefined} 
                        alt={user.name} 
                        className="w-full h-full rounded-full object-cover" 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <span className="font-bold text-xs">HT</span>
                </div>
                <div className="w-full">
                    <div className="w-full bg-[--color-surface-primary] hover:bg-[--color-surface-tertiary] rounded-full py-2.8 px-5 text-left text-xs sm:text-sm font-semibold text-[--color-text-secondary] transition border border-[--color-border-secondary]">
                        Chia sẻ với đồng nghiệp...
                    </div>
                </div>
            </div>

            {/* Action Buttons Row */}
            <div className="mt-3.5 flex justify-between items-center gap-1.5 relative" ref={dropdownRef}>
                <div className="flex flex-wrap items-center gap-1">
                    {composerActions.map((act) => (
                        <button 
                            key={act.type}
                            type="button"
                            onClick={() => onOpenComposerWithType(act.type)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-[--color-text-secondary] transition-colors ${act.color}`}
                        >
                            {act.icon}
                            <span className="hidden sm:inline">{act.label}</span>
                        </button>
                    ))}
                </div>

                {/* More / Additional Trigger */}
                <button 
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold text-[--color-text-secondary] hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all shrink-0"
                >
                    <span>Thêm</span>
                    <MoreHorizontalIconLc className="w-4 h-4 text-slate-500" />
                </button>

                {/* Beautiful Dropdown Portal */}
                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-[--color-surface-tertiary] border border-[--color-border-secondary] rounded-2xl shadow-xl z-50 py-2.5 px-2 animate-fade-in-down">
                        {dropdownActions.map((dAct, idx) => {
                            const isDivider = idx === 5;
                            return (
                                <React.Fragment key={dAct.type + idx}>
                                    {isDivider && <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 px-1" />}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenComposerWithType(dAct.type);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                                    >
                                        <div className="shrink-0">{dAct.icon}</div>
                                        <span>{dAct.label}</span>
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


interface NewsfeedViewProps {
  user: User;
}

type FilterType = 'all' | 'pinned' | 'saved' | 'unread';

const NewsfeedView: React.FC<NewsfeedViewProps> = ({ user }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<string[] | null>(null);
    const [isSearchingAI, setIsSearchingAI] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    
    // To feed pre-selected custom types directly from action buttons into CreatePostModal
    const [composerInitialType, setComposerInitialType] = useState<PostType>('quick');

    const handleAISearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearchingAI(true);
        try {
            const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (!apiKey) throw new Error("API key is not configured.");
            
            const ai = new GoogleGenAI({ apiKey });
            const postsContext = posts.map(p => ({ 
                id: p.id, 
                content: p.content.substring(0, 500),
                author: p.author.name 
            }));
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `User is searching for: "${searchTerm}" in a company newsfeed. 
                Find and return the IDs of the posts that are relevant to this query. 
                Include posts that match the topic, intent, or keywords. 
                Return a JSON array of relevant post IDs, ordered by relevance.
                Posts to evaluate: ${JSON.stringify(postsContext)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });

            const relevantIds = JSON.parse(response.text || '[]');
            setSearchResults(relevantIds);
        } catch (error) {
            console.error("AI Search Error:", error);
            const lowSearch = searchTerm.toLowerCase();
            const keywordResults = posts
                .filter(p => p.content.toLowerCase().includes(lowSearch) || p.author.name.toLowerCase().includes(lowSearch))
                .map(p => p.id);
            setSearchResults(keywordResults);
        } finally {
            setIsSearchingAI(false);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults(null);
    };

    const formatTimestamp = (timestamp: Timestamp | Date | string | number | null) => {
        if (!timestamp) return 'Just now';
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffDay > 0) return `${diffDay}d ago`;
        if (diffHour > 0) return `${diffHour}h ago`;
        if (diffMin > 0) return `${diffMin}m ago`;
        return 'Just now';
    };

    // Load initial posts from Firestore
    useEffect(() => {
        if (!auth.currentUser || user.id.startsWith('user-')) {
            const savedFeed = localStorage.getItem('newsfeed_posts');
            if (savedFeed) setPosts(JSON.parse(savedFeed));
            return;
        }

        if (!auth.currentUser) return;
        
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: formatTimestamp(data.createdAt),
                } as Post;
            });
            setPosts(fetchedPosts);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'posts');
        });

        return () => unsubscribe();
    }, [user.id]);

    const savePostsState = (newPosts: Post[]) => {
        setPosts(newPosts);
        localStorage.setItem('newsfeed_posts', JSON.stringify(newPosts));
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsRefreshing(false);
    };

    const handleAddPost = async (post: Omit<Post, 'id' | 'timestamp' | 'reactions' | 'comments' | 'isPinned' | 'isSaved' | 'isRead'>) => {
        try {
            if (auth.currentUser && !user.id.startsWith('user-')) {
                await addDoc(collection(db, 'posts'), {
                    ...post,
                    isPinned: false,
                    isSaved: false,
                    isRead: true,
                    reactions: [],
                    comments: [],
                    createdAt: serverTimestamp(),
                    authorId: auth.currentUser?.uid || 'anonymous'
                });
            } else {
                // Fallback for demo mode
                const newPost: Post = {
                    ...post,
                    id: `post-${Date.now()}`,
                    timestamp: 'Just now',
                    isPinned: false,
                    isSaved: false,
                    isRead: true,
                    reactions: [],
                    comments: []
                };
                const updated = [newPost, ...posts];
                setPosts(updated);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'posts');
        }
    };

    const handleTogglePin = async (id: string) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;

        try {
            if (!id.startsWith('post-') && auth.currentUser) {
                await updateDoc(doc(db, 'posts', id), {
                    isPinned: !post.isPinned
                });
            } else {
                const updated = posts.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : p);
                setPosts(updated);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
        }
    };
    
    const handleToggleSave = async (id: string) => {
        const post = posts.find(p => p.id === id);
        if (!post) return;

        try {
            if (!id.startsWith('post-') && auth.currentUser) {
                await updateDoc(doc(db, 'posts', id), {
                    isSaved: !post.isSaved
                });
            } else {
                const updated = posts.map(p => p.id === id ? { ...p, isSaved: !p.isSaved } : p);
                setPosts(updated);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
        }
    };

    const handleUpdatePost = async (updatedPost: Post) => {
        try {
            if (!updatedPost.id.startsWith('post-') && auth.currentUser) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, timestamp, ...postData } = updatedPost;
                await updateDoc(doc(db, 'posts', id), postData);
            } else {
                const updated = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
                setPosts(updated);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `posts/${updatedPost.id}`);
        }
    };

    // Handling Poll Voting
    const handleVotePoll = (postId: string, optId: string) => {
        const currentUserName = user.name || "Hung Thai";
        const updated = posts.map(p => {
            if (p.id !== postId || !p.poll) return p;
            
            // Loop and toggle vote for the selected option in this poll
            const newOptions = p.poll.options.map(opt => {
                const alreadyVoted = opt.voters.includes(currentUserName);
                let newVoters = [...opt.voters];
                let newVotes = opt.votes;

                if (opt.id === optId) {
                    if (alreadyVoted) {
                        newVoters = newVoters.filter(v => v !== currentUserName);
                        newVotes = Math.max(0, newVotes - 1);
                    } else {
                        newVoters.push(currentUserName);
                        newVotes += 1;
                    }
                } else if (opt.voters.includes(currentUserName)) {
                    // Standard single choice constraint: remove their vote on other items
                    newVoters = newVoters.filter(v => v !== currentUserName);
                    newVotes = Math.max(0, newVotes - 1);
                }

                return { ...opt, votes: newVotes, voters: newVoters };
            });

            return {
                ...p,
                poll: { ...p.poll, options: newOptions }
            };
        });

        savePostsState(updated);
    };

    // Handling Join Corporate Event RSVP
    const handleJoinEvent = (postId: string) => {
        const currentUserName = user.name || "Hung Thai";
        const updated = posts.map(p => {
            if (p.id !== postId || !p.event) return p;
            
            const alreadyRsvped = p.event.attendees.includes(currentUserName);
            const newAttendees = alreadyRsvped
                ? p.event.attendees.filter(v => v !== currentUserName)
                : [...p.event.attendees, currentUserName];

            return {
                ...p,
                event: { ...p.event, attendees: newAttendees }
            };
        });

        savePostsState(updated);
    };

    const filteredPosts = useMemo(() => {
        const sortedPosts = [...posts].sort((a, b) => (b.isPinned ? 1 : -1) - (a.isPinned ? 1 : -1));
        
        let result = sortedPosts;
        switch (filter) {
            case 'pinned': result = sortedPosts.filter(p => p.isPinned); break;
            case 'saved': result = sortedPosts.filter(p => p.isSaved); break;
            case 'unread': result = sortedPosts.filter(p => !p.isRead); break;
            case 'all':
            default: result = sortedPosts; break;
        }

        if (searchResults !== null) {
            if (searchResults.length > 0) {
                return result
                    .filter(p => searchResults.includes(p.id))
                    .sort((a, b) => searchResults.indexOf(a.id) - searchResults.indexOf(b.id));
            } else {
                return [];
            }
        }

        return result;
    }, [posts, filter, searchResults]);

    const handleOpenComposerWithType = (type: PostType) => {
        setComposerInitialType(type);
        setIsCreateModalOpen(true);
    };

    const FilterButton: React.FC<{ type: FilterType, icon: React.ReactNode, label: string }> = ({ type, icon, label }) => (
        <button 
            onClick={() => setFilter(type)} 
            className={`w-full flex items-center rounded-xl font-bold transition-all ${
                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
            } ${
                filter === type 
                    ? 'bg-[--color-accent-500]/10 text-[--color-accent-600] dark:text-[--color-accent-400] shadow-sm' 
                    : 'text-[--color-text-secondary] hover:bg-white/60 dark:hover:bg-slate-800/40'
            }`}
            title={label}
        >
            <div className="shrink-0 flex items-center justify-center w-5 h-5">{icon}</div>
            {!isSidebarCollapsed && <span className="text-xs whitespace-nowrap">{label}</span>}
        </button>
    );

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                <div className="shrink-0">
                    <NewsfeedBanner />
                </div>
                
                <div className="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex min-h-0 border border-slate-100 dark:border-slate-800">
                    {/* Left Sidebar for Filters (Default Collapsed Icon-only) */}
                    <aside className={`hidden lg:flex flex-col border-r border-slate-100 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/10 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
                        {/* Collapse/Expand Toggle */}
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 flex justify-center">
                            <button 
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 transition-colors"
                                title={isSidebarCollapsed ? "Mở rộng danh mục" : "Thu gọn chỉ hiện icon"}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    {isSidebarCollapsed ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    )}
                                </svg>
                            </button>
                        </div>

                        <div className="p-3 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                            <button 
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                className={`flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                                    isSidebarCollapsed ? 'p-3 w-10 h-10 mx-auto' : 'w-full px-4 py-2.5 text-xs gap-2'
                                }`}
                                title={isSidebarCollapsed ? "Làm mới bảng tin" : undefined}
                            >
                                <SyncIcon className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {!isSidebarCollapsed && <span>{isRefreshing ? 'Đang tải...' : 'Làm mới bảng tin'}</span>}
                            </button>
                            
                            <div className="w-full border-t border-slate-200/50 dark:border-slate-800/80"></div>
                            
                            <div className="flex flex-col gap-1">
                                <FilterButton type="all" icon={<ListIcon className="w-4.5 h-4.5"/>} label="Tất cả bài viết" />
                                <FilterButton type="unread" icon={<EyeOffIcon className="w-4.5 h-4.5"/>} label="Chưa xem" />
                                <FilterButton type="pinned" icon={<PinIcon className="w-4.5 h-4.5"/>} label="Đã ghim" />
                                <FilterButton type="saved" icon={<BookmarkIcon className="w-4.5 h-4.5"/>} label="Đã lưu" />
                            </div>
                            
                            <div className="w-full border-t border-slate-200/50 dark:border-slate-800/80"></div>
                            {!isSidebarCollapsed ? (
                                <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[--color-text-subtle] opacity-75">Không gian làm việc</p>
                            ) : (
                                <div className="h-px bg-slate-200/50 dark:bg-slate-800/80 mx-2" />
                            )}
                            <div className="flex flex-col gap-1">
                                <FilterButton type="all" icon={<UsersIconLc className="w-4 h-4 text-cyan-500" />} label="Toàn công ty" />
                                <FilterButton type="all" icon={<UsersIconLc className="w-4 h-4 text-indigo-500" />} label="Team Marketing" />
                            </div>
                        </div>
                    </aside>

                    {/* Main Feed */}
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar p-6 min-h-0 bg-slate-50/10 dark:bg-slate-950/10">
                        {/* Search Bar - Encapsulated nicely inside a card */}
                        <div className="bg-[--color-surface-secondary] backdrop-blur-md rounded-2xl p-3 shadow-sm border border-[--color-border-secondary] sticky top-0 z-20">
                            <form onSubmit={handleAISearch} className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Tìm kiếm thông minh với AI (Vd: 'Công ty nghỉ hè', 'Bài đăng của Bình')..."
                                        className="w-full font-semibold bg-[--color-surface-primary] text-[--color-text-primary] border border-[--color-border-secondary] rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-[--color-accent-500] outline-none transition-all"
                                    />
                                    {searchTerm && (
                                        <button 
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isSearchingAI || !searchTerm.trim()}
                                    className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold px-4.5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-600/10"
                                >
                                    {isSearchingAI ? (
                                        <SyncIcon className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <SparklesIcon className="w-4 h-4" />
                                    )}
                                    <span>{isSearchingAI ? 'Đang tìm...' : 'AI Search'}</span>
                                </button>
                            </form>
                            {searchResults !== null && (
                                <div className="mt-2.5 px-1 flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400">
                                        {searchResults.length > 0 ? `Đã tìm thấy ${searchResults.length} kết quả phù hợp` : 'Không tìm thấy kết quả phù hợp nào'}
                                    </p>
                                    <button onClick={clearSearch} className="text-[10px] uppercase tracking-wider font-extrabold text-red-500 hover:text-red-650">Xóa kết quả</button>
                                </div>
                            )}
                        </div>

                        {/* Highly responsive Composition Widget */}
                        <PostComposer 
                            user={user} 
                            onOpenComposerWithType={handleOpenComposerWithType} 
                        />
                        
                        {/* Create Modal with pre-seed option support */}
                        <CreatePostModal 
                            user={user} 
                            isOpen={isCreateModalOpen} 
                            onClose={() => setIsCreateModalOpen(false)} 
                            onSubmit={handleAddPost} 
                            initialType={composerInitialType}
                        />

                        {/* Pinterest Masonry Layout */}
                        <div className="columns-1 sm:columns-2 xl:columns-3 gap-5 [column-fill:_balance] w-full pb-8">
                           {filteredPosts.map(post => (
                               <div key={post.id} className="break-inside-avoid mb-5">
                                   <PostCard 
                                       post={post} 
                                       user={user}
                                       onTogglePin={handleTogglePin} 
                                       onToggleSave={handleToggleSave} 
                                       onUpdatePost={handleUpdatePost} 
                                       onVotePoll={handleVotePoll}
                                       onJoinEvent={handleJoinEvent}
                                   />
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default NewsfeedView;
