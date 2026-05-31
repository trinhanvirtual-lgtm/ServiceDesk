import React from 'react';
import { View } from '../App';
import { useLanguage } from './LanguageContext';
// FIX: Import IconProps to correctly type the icon element.
import { BookOpenIcon, FileTextIcon, UsersIcon, ChecklistIcon, CalendarIcon, ChatIcon, IconProps } from './icons';

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    view: View;
    itemId?: string;
    // FIX: Use React.ReactElement<IconProps> to give the icon prop a specific type, allowing cloneElement to know about 'className'.
    icon: React.ReactElement<IconProps>;
}

interface SearchResultsProps {
    results: {
        articles?: unknown[];
        files?: unknown[];
        contacts?: unknown[];
        tasks?: unknown[];
        events?: unknown[];
        messages?: unknown[];
        empty?: boolean;
    } | null;
    onNavigate: (view: View, section?: string) => void;
    onClose: () => void;
}

const SearchResultItem: React.FC<{ item: SearchResult; onNavigate: (view: View, section?: string) => void; onClose: () => void; }> = ({ item, onNavigate, onClose }) => {
    const handleClick = () => {
        onNavigate(item.view, item.itemId);
        onClose();
    };
    return (
        <button onClick={handleClick} className="w-full text-left flex items-center gap-3 p-3 rounded-md hover:bg-[--color-surface-secondary] transition-colors">
            {React.cloneElement(item.icon, { className: 'w-5 h-5 text-[--color-accent-600] shrink-0' })}
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-[--color-text-primary] truncate">{item.title}</p>
                {item.subtitle && <p className="text-xs text-[--color-text-subtle] truncate">{item.subtitle}</p>}
            </div>
        </button>
    );
};

const GlobalSearchResults: React.FC<SearchResultsProps> = ({ results, onNavigate, onClose }) => {
    const { t } = useLanguage();

    if (!results) {
        return (
            <div className="absolute top-full mt-2 w-full max-w-lg bg-[--color-surface-tertiary] backdrop-blur-xl rounded-xl shadow-2xl p-4 text-center animate-fade-in-down">
                 <div className="w-6 h-6 border-4 border-t-transparent border-[--color-accent-500] rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }
    
    if (results.empty) {
        return (
             <div className="absolute top-full mt-2 w-full max-w-lg bg-[--color-surface-tertiary] backdrop-blur-xl rounded-xl shadow-2xl p-4 text-center animate-fade-in-down">
                <p className="text-sm font-medium text-[--color-text-secondary]">{t('noResultsFound')}</p>
            </div>
        );
    }

    const sections = [
        { key: 'articles', title: t('resultsBlog'), icon: <BookOpenIcon />, view: 'blog' as View, data: results.articles, subtitleKey: 'author' },
        { key: 'files', title: t('resultsFiles'), icon: <FileTextIcon />, view: 'drive' as View, data: results.files, titleKey: 'name', subtitleKey: 'owner' },
        { key: 'contacts', title: t('resultsContacts'), icon: <UsersIcon />, view: 'contacts' as View, data: results.contacts, titleKey: 'name', subtitleKey: 'title' },
        { key: 'tasks', title: t('resultsTasks'), icon: <ChecklistIcon />, view: 'tasks' as View, data: results.tasks, titleKey: 'text', subtitleKey: 'list' },
        { key: 'events', title: t('resultsEvents'), icon: <CalendarIcon />, view: 'calendar' as View, data: results.events, subtitleKey: 'date' },
        { key: 'messages', title: t('resultsMessages'), icon: <ChatIcon />, view: 'chat' as View, data: results.messages, titleKey: 'content', subtitleKey: 'author' },
    ];


    return (
        <div className="absolute top-full mt-2 w-full max-w-lg bg-[--color-surface-tertiary] backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden animate-fade-in-down">
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-2">
                {sections.map(section => {
                    const items = section.data || [];
                    if (items.length === 0) return null;

                    return (
                        <div key={section.key} className="mb-2">
                            <h3 className="px-3 py-1.5 text-xs font-bold uppercase text-[--color-text-subtle] tracking-wider">{section.title}</h3>
                            {items.map(item => {
                                const resultItem: SearchResult = {
                                    id: `${section.key}-${item.id}`,
                                    title: item[section.titleKey || 'title'] || item.text || item.name,
                                    subtitle: section.subtitleKey === 'date' ? new Date(item.date).toLocaleDateString() : (item[section.subtitleKey] || (section.subtitleKey === 'author' ? (item.author.name || item.author) : null)),
                                    view: section.view,
                                    itemId: item.id,
                                    icon: section.icon
                                };
                                return <SearchResultItem key={resultItem.id} item={resultItem} onNavigate={onNavigate} onClose={onClose} />;
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GlobalSearchResults;