import React, { useState, useEffect } from 'react';
import { View, ServiceState } from '../App';
import { useLanguage } from './LanguageContext';
import { ChevronLeftIcon, SettingsIcon } from './icons';

interface BlogSettingsViewProps {
  onNavigate: (view: View) => void;
  services: ServiceState[];
}

const mockFetchedArticles = [
    {
      id: 'blogger-1',
      title: 'Khám phá ẩm thực đường phố Sài Gòn',
      author: 'Travel Blogger',
      tags: ['Du lịch', 'Ẩm thực'],
      previewImage: 'https://images.unsplash.com/photo-1595233543958-f9359a3e5126?q=80&w=800',
      source: 'Blogger',
      isPinned: false,
      date: 'July 29, 2024'
    },
    {
      id: 'blogger-2',
      title: 'Xu hướng công nghệ 2025: AI và tương lai',
      author: 'Tech Guru',
      tags: ['Công nghệ', 'AI'],
      previewImage: 'https://images.unsplash.com/photo-1620712943543-285f200c9c22?q=80&w=800',
      source: 'Blogger',
      isPinned: false,
      date: 'July 28, 2024'
    },
];

const BlogSettingsView: React.FC<BlogSettingsViewProps> = ({ onNavigate, services }) => {
    const { t } = useLanguage();
    const [url, setUrl] = useState('');
    const [frequency, setFrequency] = useState('manual');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const bloggerService = services.find(s => s.id === 'Blogger');

    useEffect(() => {
        const savedUrl = localStorage.getItem('blog_settings_url');
        const savedFreq = localStorage.getItem('blog_settings_frequency');
        if (savedUrl) setUrl(savedUrl);
        if (savedFreq) setFrequency(savedFreq);
    }, []);

    const handleSave = () => {
        localStorage.setItem('blog_settings_url', url);
        localStorage.setItem('blog_settings_frequency', frequency);
        setMessage('Cài đặt đã được lưu!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleFetch = async () => {
        setIsLoading(true);
        setMessage('');

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

        try {
            const existingArticlesRaw = localStorage.getItem('blog_articles');
            const existingArticles = existingArticlesRaw ? JSON.parse(existingArticlesRaw) : [];
            const existingIds = new Set(existingArticles.map((a: { id: string }) => a.id));

            const newArticles = mockFetchedArticles.filter(a => !existingIds.has(a.id));

            if (newArticles.length > 0) {
                const updatedArticles = [...existingArticles, ...newArticles];
                localStorage.setItem('blog_articles', JSON.stringify(updatedArticles));
                // Dispatch a storage event to notify other components (like BlogView)
                window.dispatchEvent(new Event('storage'));
            }
            
            setMessage(t('fetchSuccess', { count: newArticles.length }));
        } catch (error) {
            console.error(error);
            setMessage(t('fetchError'));
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };
  
    return (
        <main className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 gap-6">
            <header className="flex items-center justify-between shrink-0">
                <button onClick={() => onNavigate('blog')} className="flex items-center gap-2 text-sm font-semibold text-[--color-text-secondary] hover:text-[--color-accent-600] p-2 rounded-lg transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                    <span>{t('backToBlog')}</span>
                </button>
                <h1 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6" />
                    {t('blogSettings')}
                </h1>
            </header>

            <div className="flex-1 max-w-2xl mx-auto w-full">
                <div className="bg-[--color-surface-solid] rounded-xl shadow-lg p-6 space-y-6">
                    {bloggerService && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-slate-100 dark:bg-slate-800/50">
                            <div className={`w-3 h-3 rounded-full ${bloggerService.isConnected ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                            <p className="text-sm font-semibold text-[--color-text-secondary]">
                                Blogger Status: <span className={bloggerService.isConnected ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                                    {bloggerService.isConnected ? t('connected') : t('notConnected')}
                                </span>
                            </p>
                        </div>
                    )}
                    <div>
                        <label htmlFor="blogger-url" className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('bloggerUrl')}</label>
                        <input
                            id="blogger-url"
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://yourblog.blogspot.com"
                            className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="fetch-frequency" className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('fetchFrequency')}</label>
                        <select
                            id="fetch-frequency"
                            value={frequency}
                            onChange={e => setFrequency(e.target.value)}
                            className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        >
                            <option value="manual">{t('manual')}</option>
                            <option value="daily">{t('daily')}</option>
                            <option value="weekly">{t('weekly')}</option>
                        </select>
                    </div>

                    <div className="border-t border-[--color-border-secondary] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <button
                            onClick={handleSave}
                            className="w-full sm:w-auto text-sm font-semibold py-2.5 px-6 rounded-lg text-[--color-text-primary] bg-[--color-surface-secondary] hover:bg-[--color-surface-tertiary] transition-colors"
                        >
                            {t('saveSettings')}
                        </button>
                        <button
                            onClick={handleFetch}
                            disabled={isLoading || !bloggerService?.isConnected}
                            className="w-full sm:w-auto text-sm font-semibold py-2.5 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? t('fetchingPosts') : t('fetchNow')}
                        </button>
                    </div>
                    
                    {message && (
                        <div className="p-3 text-center rounded-md bg-[--color-surface-secondary] text-[--color-text-primary] font-medium">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default BlogSettingsView;
