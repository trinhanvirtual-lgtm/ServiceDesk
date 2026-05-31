import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { User } from '../App';
import { ClipboardListIcon, XIcon, SparklesIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

export interface Request {
    id: string;
    title: string;
    type: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    authorId: string;
    authorName: string;
    approverId: string;
    approverName: string;
    summary?: string;
}

interface CreateRequestModalProps {
    user: User;
    users: User[];
    onClose: () => void;
    onSave: (request: Request) => void;
}

const workflowTypes = [
    { id: 'leaveRequest', key: 'leaveRequest' },
    { id: 'equipmentRequest', key: 'equipmentRequest' },
    { id: 'otherRequest', key: 'otherRequest' }
];

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ user, users, onClose, onSave }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [type, setType] = useState(workflowTypes[0].id);
    const [content, setContent] = useState('');
    const [approverId, setApproverId] = useState('');
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummarize = async () => {
        if (!content.trim()) return;
        setIsSummarizing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Tóm tắt yêu cầu sau đây một cách ngắn gọn xúc tích (tối đa 20 từ): ${content}`,
            });
            if (response.text) {
                setSummary(response.text.trim());
            }
        } catch (error) {
            console.error("AI Summarization Error:", error);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const approver = users.find(u => u.id === approverId);
        
        const newRequest: Request = {
            id: `req-${Date.now()}`,
            title,
            type,
            content,
            summary,
            status: 'pending',
            createdAt: new Date(),
            authorId: user.id,
            authorName: user.name,
            approverId: approverId,
            approverName: approver ? approver.name : 'Unknown',
        };
        onSave(newRequest);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative bg-[--color-surface-tertiary] border border-[--color-border-secondary] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="p-6 border-b border-[--color-border-secondary] flex justify-between items-center bg-[--color-surface-secondary]">
                    <h3 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
                        <ClipboardListIcon className="w-6 h-6 text-[--color-accent-500]" />
                        {t('newRequest')}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[--color-text-subtle] transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">{t('requestType')}</label>
                        <select 
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                        >
                            {workflowTypes.map(wt => (
                                <option key={wt.id} value={wt.id}>{t(wt.key)}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">{t('selectApprover')}</label>
                        <select 
                            required
                            value={approverId}
                            onChange={(e) => setApproverId(e.target.value)}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                        >
                            <option value="" disabled hidden>{t('selectApprover')}</option>
                            {users.filter(u => u.id !== user.id).map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1.5">{t('requestTitle')}</label>
                        <input 
                            required
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none transition-shadow"
                            placeholder="Vd: Xin nghỉ phép ngày 20/11"
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-semibold text-[--color-text-secondary]">{t('requestContent')}</label>
                            <button 
                                type="button" 
                                onClick={handleSummarize}
                                disabled={isSummarizing || !content.trim()}
                                className="text-xs flex items-center gap-1.5 text-[--color-accent-600] dark:text-[--color-accent-400] hover:underline disabled:opacity-50 disabled:no-underline"
                            >
                                <SparklesIcon className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-pulse' : ''}`} />
                                {isSummarizing ? t('syncing') : 'Tóm tắt bằng AI'}
                            </button>
                        </div>
                        <textarea 
                            required
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-3 focus:ring-2 focus:ring-[--color-accent-500] focus:border-transparent focus:outline-none resize-none transition-shadow"
                            placeholder="Nội dung chi tiết..."
                        />
                        {summary && (
                            <div className="mt-2 p-3 bg-[--color-accent-500]/10 border border-[--color-accent-500]/20 rounded-lg animate-fade-in">
                                <p className="text-xs font-bold text-[--color-accent-700] dark:text-[--color-accent-300] uppercase mb-1">Tóm tắt AI:</p>
                                <p className="text-sm text-[--color-text-primary] italic">"{summary}"</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-[--color-border-secondary] text-[--color-text-primary] font-semibold hover:bg-[--color-surface-secondary] transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-xl bg-[--color-accent-600] text-white font-semibold shadow-lg hover:shadow-[--color-accent-500/20] transition-all active:scale-[0.98]"
                        >
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRequestModal;
