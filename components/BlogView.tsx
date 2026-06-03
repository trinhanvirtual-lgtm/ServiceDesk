import React, { useState, useMemo, useEffect } from 'react';
import { User, View, RecentItem } from '../App';
import BlogBanner from './BlogBanner';
import { SearchIcon, PlusIcon, SettingsIcon, BloggerIcon, ChevronDownIcon, CalendarPlusIcon, RobotIcon, PaperAirplaneIcon, BookOpenIcon, PinIcon, ShareIcon, XIcon } from './icons';
import { useLanguage } from './LanguageContext';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { TrashIcon } from './icons';

interface Article {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  tags: string[];
  previewImage: string;
  source: 'Internal' | 'Blogger';
  isPinned: boolean;
  date: string;
  status: 'Draft' | 'Published' | 'Archived';
  createdAt?: number;
}

interface ArticleCardProps {
    article: Article;
    onTagClick: (tag: string) => void;
    onSchedule: (title: string) => void;
    onView: () => void;
    onSummarize: (article: Article) => void;
    onShare: (article: Article) => void;
}

const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <mark key={i} className="bg-pink-300 text-pink-900 rounded-px px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
};

const ArticleCard: React.FC<ArticleCardProps & { searchTerm?: string; onDelete?: (id: string) => void; canDelete?: boolean }> = ({ article, onTagClick, onSchedule, onView, searchTerm = '', onSummarize, onShare, onDelete, canDelete }) => {
    const { t } = useLanguage();
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const TAG_LIMIT = 2;
    const canTruncate = article.tags.length > TAG_LIMIT;
    const tagsToShow = tagsExpanded ? article.tags : article.tags.slice(0, TAG_LIMIT);
    const remainingTags = article.tags.length - TAG_LIMIT;

    return (
        <div onClick={onView} className={`relative flex flex-col bg-white/70 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden cursor-pointer ${article.isPinned ? 'ring-2 ring-pink-500' : ''}`}>
            {article.source === 'Blogger' && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white p-1 rounded-full z-10 shadow-sm" title="From Blogger">
                    <BloggerIcon className="w-4 h-4" /> 
                </div>
            )}
            {article.isPinned && (
                <div className="absolute top-2 left-2 bg-pink-500 text-white p-1 rounded-full z-10 shadow-sm" title="Pinned Post">
                    <PinIcon className="w-4 h-4" />
                </div>
            )}
            <div className={`absolute top-2 ${article.source === 'Blogger' ? 'right-10' : 'right-2'} z-10 flex gap-2`}>
                {canDelete && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDelete?.(article.id); }}
                        className="bg-white/90 hover:bg-white text-red-600 p-1.5 rounded-full shadow-md transition-all hover:scale-110"
                        title="Xóa bài viết"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onSummarize(article); }}
                    className="bg-white/90 hover:bg-white text-purple-600 p-1.5 rounded-full shadow-md transition-all hover:scale-110"
                    title="AI Summary"
                >
                    <RobotIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onShare(article); }}
                    className="bg-white/90 hover:bg-white text-indigo-600 p-1.5 rounded-full shadow-md transition-all hover:scale-110"
                    title="Chia sẻ liên kết"
                >
                    <ShareIcon className="w-4 h-4" />
                </button>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm text-white ${
                    article.status === 'Published' ? 'bg-green-500' : 
                    article.status === 'Draft' ? 'bg-slate-500' : 'bg-orange-700'
                }`}>
                    {article.status.toUpperCase()}
                </span>
            </div>
            <img src={article.previewImage} alt={article.title} className="w-full h-40 object-cover" />
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex gap-2 mb-2 flex-wrap items-center">
                    {tagsToShow.map(tag => (
                        <button 
                            key={tag} 
                            onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                            className="text-xs font-semibold px-2 py-1 bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
                        >
                            {highlightText(tag, searchTerm)}
                        </button>
                    ))}
                    {canTruncate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setTagsExpanded(!tagsExpanded);
                            }}
                            className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"
                            aria-label={tagsExpanded ? t('showLess') : `Show ${remainingTags} more tags`}
                        >
                            {tagsExpanded ? t('showLess') : `+${remainingTags}`}
                        </button>
                    )}
                </div>
                <h3 className="font-bold text-slate-800 leading-tight flex-1 group-hover:text-purple-700 transition-colors">{highlightText(article.title, searchTerm)}</h3>
                <div className="flex justify-between items-center mt-2 mb-3">
                    <p className="text-sm text-slate-500">By {highlightText(article.author, searchTerm)} &bull; {article.date}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onSchedule(article.title); }} className="mt-auto flex items-center justify-center gap-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 py-2 rounded-lg transition-colors w-full font-semibold">
                    <CalendarPlusIcon className="w-4 h-4"/>
                    {t('scheduleDiscussion') || 'Lên lịch thảo luận'}
                </button>
            </div>
        </div>
    );
};

const PinnedPost: React.FC<{ article: Article, onTagClick: (tag: string) => void, onSchedule: (title: string) => void, onView: () => void; searchTerm?: string, onSummarize: (article: Article) => void, onShare: (article: Article) => void, onDelete?: (id: string) => void; canDelete?: boolean }> = ({ article, onTagClick, onSchedule, onView, searchTerm = '', onSummarize, onShare, onDelete, canDelete }) => {
    const { t } = useLanguage();
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const TAG_LIMIT = 2;
    const canTruncate = article.tags.length > TAG_LIMIT;
    const tagsToShow = tagsExpanded ? article.tags : article.tags.slice(0, TAG_LIMIT);
    const remainingTags = article.tags.length - TAG_LIMIT;

    return (
        <div onClick={onView} className="relative bg-white/70 rounded-xl shadow-lg overflow-hidden group flex flex-col md:flex-row cursor-pointer">
            <div className="absolute top-4 right-4 z-10 flex gap-2 items-center">
                {canDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete?.(article.id); }}
                        className="bg-white/90 hover:bg-white text-red-600 p-2 rounded-full shadow-md transition-all hover:scale-110"
                        title="Xóa bài viết"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onSummarize(article); }}
                    className="bg-white/90 hover:bg-white text-purple-600 p-2 rounded-full shadow-md transition-all hover:scale-110"
                    title="AI Summary"
                >
                    <RobotIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onShare(article); }}
                    className="bg-white/90 hover:bg-white text-indigo-600 p-2 rounded-full shadow-md transition-all hover:scale-110"
                    title="Chia sẻ liên kết"
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm text-white ${
                    article.status === 'Published' ? 'bg-green-500' : 
                    article.status === 'Draft' ? 'bg-slate-500' : 'bg-orange-700'
                }`}>
                    {article.status.toUpperCase()}
                </span>
                {article.source === 'Blogger' && (
                    <div className="bg-orange-500 text-white p-1.5 rounded-full shadow-sm" title="From Blogger">
                        <BloggerIcon className="w-4 h-4" />
                    </div>
                )}
                <span className="bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">PINNED</span>
            </div>
            <div className="md:w-1/2">
                <img src={article.previewImage} alt={article.title} className="w-full h-64 md:h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                <div className="flex gap-2 mb-3 flex-wrap items-center">
                    {tagsToShow.map(tag => (
                        <button 
                            key={tag} 
                            onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                            className="text-sm font-semibold px-3 py-1 bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
                        >
                            {highlightText(tag, searchTerm)}
                        </button>
                    ))}
                    {canTruncate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setTagsExpanded(!tagsExpanded);
                            }}
                            className="text-sm font-semibold px-3 py-1 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"
                            aria-label={tagsExpanded ? t('showLess') : `Show ${remainingTags} more tags`}
                        >
                            {tagsExpanded ? t('showLess') : `+${remainingTags}`}
                        </button>
                    )}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 group-hover:text-purple-700 transition-colors">{highlightText(article.title, searchTerm)}</h2>
                <p className="text-md text-slate-600 mt-3">By {highlightText(article.author, searchTerm)} &bull; {article.date}</p>
                <div className="flex items-center gap-4 mt-6">
                    <button onClick={(e) => e.stopPropagation()} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300">
                        Read More
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onSchedule(article.title); }} className="flex items-center gap-2 bg-purple-100 text-purple-700 font-semibold px-6 py-2.5 rounded-lg hover:shadow-lg hover:bg-purple-200 transition-all duration-300">
                        <CalendarPlusIcon className="w-5 h-5"/>
                        {t('scheduleDiscussion') || 'Lên lịch thảo luận'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BlogViewProps {
  user: User;
  onNavigate: (view: View, section?: string) => void;
  onSchedule: (title: string) => void;
  onItemViewed: (item: RecentItem) => void;
}

const BlogView: React.FC<BlogViewProps> = ({ user, onNavigate, onSchedule, onItemViewed }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();
    const [visibleItems, setVisibleItems] = useState(8);
    const [articles, setArticles] = useState<Article[]>([]);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(collection(db, 'blogArticles'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const articlesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    author: data.authorName,
                    authorId: data.authorId,
                    tags: data.tags || [],
                    previewImage: data.previewImage || '',
                    source: 'Internal',
                    isPinned: data.isPinned || false,
                    date: new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    status: data.status,
                    createdAt: data.createdAt
                } as Article;
            });
            setArticles(articlesData);
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteArticle = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
        try {
            await deleteDoc(doc(db, 'blogArticles', id));
            showToast("Đã xóa bài viết thành công!");
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Không thể xóa bài viết. Vui lòng thử lại.");
        }
    };
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    // AI Assistant State
    const [isAssistantOpen, setAssistantOpen] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState<{author: 'user' | 'ai', text: string}[]>([]);
    const [assistantPrompt, setAssistantPrompt] = useState('');
    const [isAssistantLoading, setIsAssistantLoading] = useState(false);

    // Summarization state
    const [activeSummary, setActiveSummary] = useState<{title: string, text: string} | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    
    // Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleShareArticle = async (article: Article) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}?article=${article.id}`);
            showToast("Đã sao chép liên kết vào bộ nhớ tạm!");
        } catch (error) {
            console.error("Copy failed", error);
            showToast("Không thể sao chép liên kết");
        }
    };

    useEffect(() => {
        setVisibleItems(8);
    }, [searchTerm, selectedTag, selectedStatus]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        if (scrollBottom < 100 && visibleItems < latestPosts.length) {
            setVisibleItems(prev => prev + 8);
        }
    };

    const handleSummarize = async (article: Article) => {
        setIsSummarizing(true);
        setActiveSummary({ title: article.title, text: '' });
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `Tóm tắt bài viết blog sau đây một cách súc tích và hấp dẫn: "${article.title}". Bài viết này do ${article.author} viết vào ngày ${article.date} với các chủ đề: ${article.tags.join(', ')}. Hãy tạo một bản tóm tắt khoảng 30-50 từ bằng tiếng Việt.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });

            if (response.text) {
                setActiveSummary({ title: article.title, text: response.text });
            }
        } catch (error) {
            console.error("Summarization Error:", error);
            setActiveSummary({ title: article.title, text: "Không thể tạo tóm tắt lúc này. Vui lòng thử lại sau." });
        } finally {
            setIsSummarizing(false);
        }
    };

    useEffect(() => {
        const handleStorageChange = () => {
            const savedArticles = localStorage.getItem('blog_articles');
            if (savedArticles) setArticles(JSON.parse(savedArticles));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        articles.forEach(article => article.tags.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [articles]);

    const filteredPosts = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return articles.filter(article => {
            const matchesSearch = !term || (
                article.title.toLowerCase().includes(term) ||
                article.author.toLowerCase().includes(term) ||
                article.tags.some(tag => tag.toLowerCase().includes(term))
            );
            const matchesTag = selectedTag ? article.tags.includes(selectedTag) : true;
            const matchesStatus = selectedStatus ? article.status === selectedStatus : true;
            return matchesSearch && matchesTag && matchesStatus;
        });
    }, [articles, searchTerm, selectedTag, selectedStatus]);

    const pinnedPost = useMemo(() => filteredPosts.find(a => a.isPinned), [filteredPosts]);
    const latestPosts = useMemo(() => filteredPosts.filter(a => !a.isPinned), [filteredPosts]);
    
    // Pagination (Infinite Scroll) Logic
    const paginatedPosts = useMemo(() => {
        return latestPosts.slice(0, visibleItems);
    }, [latestPosts, visibleItems]);


    const handleTagClick = (tag: string) => setSelectedTag(tag);
    const clearFilter = () => {
        setSelectedTag(null);
        setSelectedStatus(null);
    };

    const handleAssistantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assistantPrompt.trim() || isAssistantLoading) return;

        const userMessage = { author: 'user' as const, text: assistantPrompt };
        setAssistantMessages(prev => [...prev, userMessage]);
        setAssistantPrompt('');
        setIsAssistantLoading(true);

        try {
            if (!process.env.API_KEY) throw new Error("API key not configured.");
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const articlesContext = filteredPosts.map(a => ({ title: a.title, author: a.author, tags: a.tags })).slice(0, 10); // Limit context size
            const systemInstruction = `You are a Blog Assistant. Your purpose is to answer questions based ONLY on the provided article data. Do not use external knowledge. Be concise and helpful. Respond in Vietnamese.\n\nHere are the available articles:\n${JSON.stringify(articlesContext)}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: assistantPrompt,
                config: { systemInstruction }
            });

            setAssistantMessages(prev => [...prev, { author: 'ai', text: response.text }]);
        } catch (error) {
            console.error(error);
            setAssistantMessages(prev => [...prev, { author: 'ai', text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }]);
        } finally {
            setIsAssistantLoading(false);
        }
    };

    const handleArticleView = (article: Article) => {
        onItemViewed({
            id: `blog-${article.id}`,
            name: article.title,
            type: 'blog',
            icon: <BookOpenIcon />,
            itemId: article.id
        });
        onNavigate('blog-article', article.id);
    };

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] gap-3 pb-24 md:pb-8">
            <div className="shrink-0"> <BlogBanner /> </div>
            <div className="flex-1 overflow-y-auto no-scrollbar" onScroll={handleScroll}>
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row items-center gap-4 mb-8 w-full sticky top-0 z-20">
                    <div className="relative flex-1 w-full">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="search" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder={t('searchPlaceholderBlog')} 
                            className="w-full bg-white border-none shadow-sm focus:ring-2 focus:ring-pink-500/20 focus:outline-none placeholder-slate-400 text-slate-800 rounded-full py-4 pl-12 pr-14 transition-all" 
                        />
                        <button 
                            onClick={() => setAssistantOpen(!isAssistantOpen)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all ${isAssistantOpen ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 shadow-sm'}`}
                            title={t('blogAssistant')}
                        >
                            <RobotIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1">
                            <select value={selectedTag || ''} onChange={(e) => setSelectedTag(e.target.value || null)} className="appearance-none w-full md:w-40 bg-white border border-slate-300 shadow-sm rounded-full py-3.5 pl-4 pr-10 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer">
                                <option value="">{t('allTags')}</option>
                                {allTags.map(tag => ( <option key={tag} value={tag}>{tag}</option> ))}
                            </select>
                            <ChevronDownIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <div className="relative flex-1">
                            <select value={selectedStatus || ''} onChange={(e) => setSelectedStatus(e.target.value || null)} className="appearance-none w-full md:w-44 bg-white border border-slate-300 shadow-sm rounded-full py-3.5 pl-4 pr-10 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer">
                                <option value="">{t('allStatuses')}</option>
                                <option value="Published">{t('statusPublished')}</option>
                                <option value="Draft">{t('statusDraft')}</option>
                                <option value="Archived">{t('statusArchived')}</option>
                            </select>
                            <ChevronDownIcon className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    {(selectedTag || selectedStatus) && ( <button onClick={clearFilter} className="text-sm font-semibold text-pink-600 hover:text-pink-700 hover:underline shrink-0 px-2">{t('clearFilter')}</button> )}
                </div>

                {/* Blog Assistant */}
                <AnimatePresence>
                    {isAssistantOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-8 max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 overflow-hidden"
                        >
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <RobotIcon className="w-5 h-5 text-purple-600"/>
                                    <h2 className="font-bold text-purple-800">{t('blogAssistant')}</h2>
                                </div>
                                <button onClick={() => setAssistantOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4">
                               <div className="h-48 overflow-y-auto space-y-4 mb-4 p-2 bg-purple-50/30 rounded-lg no-scrollbar">
                                    {assistantMessages.map((msg, i) => (
                                        <div key={i} className={`flex items-start gap-2 ${msg.author === 'user' ? 'justify-end' : ''}`}>
                                            {msg.author === 'ai' && <RobotIcon className="w-5 h-5 text-purple-600 shrink-0 mt-1"/>}
                                            <p className={`p-2 rounded-lg max-w-[80%] text-sm ${msg.author === 'user' ? 'bg-purple-500 text-white' : 'bg-white border border-purple-100 shadow-sm text-slate-700'}`}>{msg.text}</p>
                                        </div>
                                    ))}
                                    {isAssistantLoading && <div className="flex items-center gap-2"><RobotIcon className="w-5 h-5 text-purple-600 shrink-0 mt-1"/> <span className="p-2 text-sm animate-pulse">...</span></div>}
                               </div>
                               <form onSubmit={handleAssistantSubmit} className="relative">
                                   <input type="text" value={assistantPrompt} onChange={e => setAssistantPrompt(e.target.value)} placeholder={t('askAboutArticles')} className="w-full bg-white border border-purple-200 rounded-full py-2.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm text-sm"/>
                                   <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-purple-300 transition-colors" disabled={isAssistantLoading}><PaperAirplaneIcon className="w-4 h-4"/></button>
                               </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {pinnedPost && <div className="mb-8"><PinnedPost article={pinnedPost} onTagClick={handleTagClick} onSchedule={onSchedule} onView={() => handleArticleView(pinnedPost)} searchTerm={searchTerm} onSummarize={handleSummarize} onShare={handleShareArticle} canDelete={user.role === 'superadmin' || pinnedPost.authorId === user.id} onDelete={handleDeleteArticle} /></div>}

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-[--color-text-primary]">{t('latestPosts')}</h2>
                        <div className="flex items-center gap-2">
                           <button onClick={() => onNavigate('settings', 'blog')} title={t('blogSettings')} className="p-3 bg-white/70 rounded-lg shadow-md hover:bg-white/90 text-slate-600 hover:text-pink-600 transition-colors"> <SettingsIcon className="w-5 h-5"/> </button>
                            <button onClick={() => onNavigate('new-blog-post')} className="flex items-center gap-2 py-3 px-4 bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/40 transition-all transform hover:scale-105">
                                <PlusIcon className="w-5 h-5"/>
                                <span className="hidden sm:inline">{t('newPost')}</span>
                            </button>
                        </div>
                    </div>
                    
                    {filteredPosts.length === 0 ? (
                        <div className="py-20 text-center bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                            <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">{t('noArticlesFound')}</h3>
                            <p className="text-slate-500">{t('noArticlesFoundDesc')}</p>
                            <button onClick={() => { setSearchTerm(''); setSelectedTag(null); setSelectedStatus(null); }} className="mt-4 text-pink-600 font-bold hover:underline">{t('clearAllFilters')}</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {paginatedPosts.map(article => ( <ArticleCard key={article.id} article={article} onTagClick={handleTagClick} onSchedule={onSchedule} onView={() => handleArticleView(article)} searchTerm={searchTerm} onSummarize={handleSummarize} onShare={handleShareArticle} canDelete={user.role === 'superadmin' || article.authorId === user.id} onDelete={handleDeleteArticle} /> ))}
                        </div>
                    )}

                    {visibleItems < latestPosts.length && (
                        <div className="flex justify-center mt-12 mb-8">
                            <div className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-500 rounded-full text-sm font-medium animate-pulse">
                                <ChevronDownIcon className="w-4 h-4" />
                                {t('scrollForMore') || 'Cuộn xuống để xem thêm'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Summary Modal */}
            <AnimatePresence>
                {activeSummary && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-purple-100"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <RobotIcon className="w-6 h-6 text-purple-600" />
                                    Tóm tắt AI
                                </h3>
                                <button onClick={() => setActiveSummary(null)} className="p-2 hover:bg-black/5 rounded-full text-slate-400 transition-colors">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8">
                                <h4 className="font-bold text-slate-900 mb-4 text-lg">"{activeSummary.title}"</h4>
                                {isSummarizing ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-purple-600 font-semibold animate-pulse">Đang suy luận...</p>
                                    </div>
                                ) : (
                                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 relative">
                                        <div className="absolute -top-3 -left-3 text-4xl text-purple-200">“</div>
                                        <p className="text-slate-700 leading-relaxed italic text-lg">{activeSummary.text}</p>
                                        <div className="absolute -bottom-6 -right-3 text-4xl text-purple-200">”</div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button 
                                    onClick={() => setActiveSummary(null)}
                                    className="px-8 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-all active:scale-95"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}
        </main>
    );
};

export default BlogView;