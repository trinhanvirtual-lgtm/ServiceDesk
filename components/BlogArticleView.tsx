import React, { useState, useEffect } from 'react';
import { User, View } from '../App';
import { ChevronLeftIcon, PaperAirplaneIcon, UserIcon, CalendarIcon, TagIcon, TrashIcon } from './icons';
import { db, auth } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, Timestamp } from 'firebase/firestore';
import { motion } from 'motion/react';

interface BlogArticle {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    tags: string[];
    previewImage: string;
    status: 'Published' | 'Draft' | 'Archived';
    isPinned: boolean;
    createdAt: number;
}

interface Comment {
    id: string;
    articleId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: Timestamp | number | null; // Firestore Timestamp
}

interface BlogArticleViewProps {
    user: User;
    articleId: string | null;
    onNavigate: (view: View, section?: string) => void;
}

const BlogArticleView: React.FC<BlogArticleViewProps> = ({ user, articleId, onNavigate }) => {
    const [article, setArticle] = useState<BlogArticle | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!articleId) return;
        if (!auth.currentUser) return;

        const unsubscribeArticle = onSnapshot(doc(db, 'blogArticles', articleId), (docSnap) => {
            if (docSnap.exists()) {
                setArticle({ id: docSnap.id, ...docSnap.data() } as BlogArticle);
            }
            setIsLoading(false);
        });

        const q = query(
            collection(db, 'blogArticles', articleId, 'comments'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
        });

        return () => {
            unsubscribeArticle();
            unsubscribeComments();
        };
    }, [articleId]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !articleId || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'blogArticles', articleId, 'comments'), {
                articleId,
                authorId: user.id,
                authorName: user.name,
                authorAvatar: user.avatar || '',
                content: newComment.trim(),
                createdAt: serverTimestamp()
            });
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Có lỗi xảy ra khi gửi nhận xét.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!articleId || !window.confirm("Bạn có chắc muốn xóa nhận xét này?")) return;

        try {
            await deleteDoc(doc(db, 'blogArticles', articleId, 'comments', commentId));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Bài viết không tồn tại</h2>
                <button onClick={() => onNavigate('blog')} className="text-pink-600 font-bold hover:underline">Quay lại Blog</button>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <button onClick={() => onNavigate('blog')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-pink-600 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                    Quay lại
                </button>
                <div className="flex gap-2">
                    {article.authorId === user.id && (
                        <button onClick={() => {/* Edit Article logic */}} className="text-sm font-semibold px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">Sửa bài viết</button>
                    )}
                </div>
            </header>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <article className="max-w-4xl mx-auto px-6 py-12">
                    {/* Meta info */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                            <span className="flex items-center gap-1"><UserIcon className="w-4 h-4"/> {article.authorName}</span>
                            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4"/> {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">{article.title}</h1>
                        <div className="flex flex-wrap gap-2">
                            {article.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-700 text-xs font-bold rounded-full border border-pink-100">
                                    <TagIcon className="w-3 h-3"/> {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Featured Image */}
                    {article.previewImage && (
                        <div className="rounded-2xl overflow-hidden shadow-2xl mb-12">
                            <img src={article.previewImage} alt={article.title} className="w-full object-cover max-h-[500px]" />
                        </div>
                    )}

                    {/* Body Content */}
                    <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-pink-600 mb-20" dangerouslySetInnerHTML={{ __html: article.content }}></div>

                    {/* Comments Section */}
                    <section className="border-t border-slate-100 pt-12">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                            Nhận xét ({comments.length})
                        </h2>

                        {/* Comment Form */}
                        <form onSubmit={handleAddComment} className="mb-12 bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-purple-600"/>}
                                </div>
                                <div className="flex-1">
                                    <textarea 
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Để lại nhận xét của bạn..."
                                        className="w-full bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all resize-none text-slate-800 placeholder:text-slate-400"
                                        rows={3}
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button 
                                            type="submit" 
                                            disabled={!newComment.trim() || isSubmitting}
                                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PaperAirplaneIcon className="w-4 h-4" />}
                                            Gửi nhận xét
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Comments List */}
                        <div className="space-y-8">
                            {comments.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 italic">
                                    Chưa có nhận xét nào. Hãy là người đầu tiên!
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={comment.id} 
                                        className="flex gap-4 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {comment.authorAvatar ? <img src={comment.authorAvatar} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-slate-400"/>}
                                        </div>
                                        <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative transition-all hover:shadow-md">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{comment.id === 'user-admin' ? 'Quản trị viên' : comment.authorName}</h4>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                        {comment.createdAt && typeof comment.createdAt !== 'number' && 'toDate' in comment.createdAt ? comment.createdAt.toDate().toLocaleString('vi-VN') : (typeof comment.createdAt === 'number' ? new Date(comment.createdAt).toLocaleString('vi-VN') : 'Vừa xong')}
                                                    </span>
                                                </div>
                                                {(comment.authorId === user.id || user.role === 'superadmin') && (
                                                    <button 
                                                        onClick={() => handleDeleteComment(comment.id)} 
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Xóa nhận xét"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>
                </article>
            </div>
        </main>
    );
};

export default BlogArticleView;
