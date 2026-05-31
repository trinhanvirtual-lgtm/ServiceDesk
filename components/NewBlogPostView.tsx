import React, { useRef, useState } from 'react';
import { User, View } from '../App';
import { useLanguage } from './LanguageContext';
import { ChevronLeftIcon, BoldIcon, ItalicIcon, UnderlineIcon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, QuoteIcon, LinkIcon, ImageIcon, GifIcon, UploadIcon } from './icons';
import GifPickerModal from './GifPickerModal';

interface NewBlogPostViewProps {
  user: User;
  onNavigate: (view: View) => void;
}

const ToolbarButton: React.FC<{ onClick?: () => void; children: React.ReactNode, title: string }> = ({ onClick, children, title }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className="p-2 rounded-md text-[--color-text-secondary] hover:bg-[--color-surface-secondary] hover:text-[--color-text-primary] transition-colors"
    >
        {children}
    </button>
);

const ToggleSwitch: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="font-medium text-sm text-[--color-text-secondary]">{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`block w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[--color-accent-500]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
        <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
    </label>
  );
};


const NewBlogPostView: React.FC<NewBlogPostViewProps> = ({ user, onNavigate }) => {
  const { t } = useLanguage();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800');
  const [syncToBlogger, setSyncToBlogger] = useState(true);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  const handleInlineImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          if (editorRef.current) {
            editorRef.current.focus();
            applyFormat('insertImage', base64);
          }
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setFeaturedImage(base64);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const applyHeading = (level: string) => {
    applyFormat('formatBlock', level);
  };

  const applyLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      applyFormat('createLink', url);
    }
  };
  
  const applyImage = () => {
    const url = prompt("Enter the Image URL:");
    if (url) {
      applyFormat('insertImage', url);
    }
  };
  
  const handleSelectGif = (url: string) => {
    if (editorRef.current) {
        editorRef.current.focus();
        applyFormat('insertImage', url);
    }
    setIsGifPickerOpen(false);
  };

  const handlePublish = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề cho bài viết.');
      return;
    }
    
    const newArticle = {
      id: `internal-${Date.now()}`,
      title: title.trim(),
      author: user.name,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      previewImage: featuredImage,
      source: 'Internal' as const,
      isPinned: false,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'Published' as const,
      content: editorRef.current?.innerHTML || ''
    };

    const savedArticles = localStorage.getItem('blog_articles');
    let articles = savedArticles ? JSON.parse(savedArticles) : [];
    articles = [newArticle, ...articles];
    localStorage.setItem('blog_articles', JSON.stringify(articles));
    
    // Dispatch storage event manually for same-tab updates if needed, 
    // although navigation will re-mount BlogView which reads from LS.
    window.dispatchEvent(new Event('storage'));

    let message = t('publishSuccess');
    if (syncToBlogger) {
      message += `\n${t('publishSuccessBlogger')}`;
    }
    alert(message);
    onNavigate('blog');
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50 p-[3px] gap-3 pb-24 md:pb-8">
      {isGifPickerOpen && (
        <GifPickerModal
            onClose={() => setIsGifPickerOpen(false)}
            onSelectGif={handleSelectGif}
        />
      )}
      {/* Top bar with actions */}
      <header className="flex items-center justify-between shrink-0">
        <button onClick={() => onNavigate('blog')} className="flex items-center gap-2 text-sm font-semibold text-[--color-text-secondary] hover:text-[--color-accent-600] p-2 rounded-lg transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('backToBlog')}</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="text-sm font-semibold py-2 px-4 rounded-lg text-[--color-text-secondary] hover:bg-[--color-surface-secondary] transition-colors">{t('saveDraft')}</button>
          <button onClick={handlePublish} className="text-sm font-semibold py-2 px-5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all">{t('publish')}</button>
        </div>
      </header>

      {/* Main editor layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[--color-surface-solid] rounded-xl shadow-lg overflow-hidden">
          {/* Toolbar */}
          <div className="p-2 border-b border-[--color-border-secondary] flex items-center gap-1 flex-wrap sticky top-0 bg-[--color-surface-solid]/80 backdrop-blur-sm z-10">
            <ToolbarButton onClick={() => applyHeading('h2')} title="Heading 2"><Heading2Icon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton onClick={() => applyHeading('h3')} title="Heading 3"><Heading3Icon className="w-5 h-5"/></ToolbarButton>
            <div className="w-px h-6 bg-[--color-border-secondary] mx-1"></div>
            <ToolbarButton onClick={() => applyFormat('bold')} title="Bold"><BoldIcon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton onClick={() => applyFormat('italic')} title="Italic"><ItalicIcon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton onClick={() => applyFormat('underline')} title="Underline"><UnderlineIcon className="w-5 h-5"/></ToolbarButton>
            <div className="w-px h-6 bg-[--color-border-secondary] mx-1"></div>
            <ToolbarButton onClick={() => applyFormat('insertUnorderedList')} title="Bulleted List"><ListIcon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton onClick={() => applyFormat('insertOrderedList')} title="Numbered List"><ListOrderedIcon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton onClick={() => applyHeading('blockquote')} title="Quote"><QuoteIcon className="w-5 h-5"/></ToolbarButton>
            <div className="w-px h-6 bg-[--color-border-secondary] mx-1"></div>
            <ToolbarButton onClick={applyLink} title="Insert Link"><LinkIcon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton onClick={applyImage} title="Chèn ảnh từ URL"><ImageIcon className="w-5 h-5"/></ToolbarButton>
            <ToolbarButton onClick={() => inlineImageInputRef.current?.click()} title="Tải ảnh từ máy tính"><UploadIcon className="w-5 h-5"/></ToolbarButton>
            <input 
              type="file" 
              ref={inlineImageInputRef} 
              onChange={handleInlineImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <ToolbarButton onClick={() => setIsGifPickerOpen(true)} title="Insert GIF"><GifIcon className="w-5 h-5"/></ToolbarButton>
          </div>
          
          {/* Title and Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="max-w-4xl mx-auto p-6 sm:p-8 md:p-12">
                <textarea
                  rows={1}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('postTitle')}
                  className="w-full text-3xl md:text-5xl font-extrabold bg-transparent focus:outline-none mb-8 text-[--color-text-primary] resize-none overflow-hidden"
                />
                <div
                  ref={editorRef}
                  contentEditable={true}
                  role="textbox"
                  aria-multiline="true"
                  className="w-full min-h-[50vh] focus:outline-none prose dark:prose-invert prose-lg max-w-none prose-headings:text-[--color-text-primary] prose-p:text-[--color-text-secondary] prose-a:text-[--color-accent-600] prose-blockquote:border-[--color-accent-500] prose-strong:text-[--color-text-primary]"
                  suppressContentEditableWarning={true}
                ></div>
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 bg-[--color-surface-solid] rounded-xl shadow-lg p-6 flex flex-col gap-6">
          <h3 className="text-xl font-bold text-[--color-text-primary]">{t('postSettings')}</h3>
          <div className="space-y-4">
            <div>
                <label className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">{t('tags')}</label>
                <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, ..."
                    className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none placeholder-slate-400" 
                />
            </div>
            <div>
                <label className="text-sm font-semibold text-[--color-text-secondary] mb-2 block">
                  {t('featuredImageUrl')} / Tải lên từ máy
                </label>
                {featuredImage && (
                  <div className="relative group rounded-lg overflow-hidden border border-[--color-border-secondary] mb-2 bg-[--color-surface-primary]">
                    <img src={featuredImage} alt="Featured preview" className="w-full h-32 object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setFeaturedImage('')}
                      className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-black/60 rounded-full text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 font-bold text-xs"
                      title="Gỡ ảnh"
                    >
                      X
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input 
                      type="text" 
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="Nhập URL ảnh hoặc..."
                      className="flex-1 text-xs bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none placeholder-slate-400" 
                  />
                  <button
                    type="button"
                    onClick={() => featuredImageInputRef.current?.click()}
                    className="px-3 py-2 text-xs font-semibold rounded-md border border-[--color-border-secondary] hover:bg-[--color-surface-secondary] bg-[--color-surface-solid] text-[--color-text-secondary] hover:text-[--color-text-primary] transition-all shrink-0"
                  >
                    Tải lên
                  </button>
                  <input 
                    type="file"
                    ref={featuredImageInputRef}
                    onChange={handleFeaturedImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
            </div>
          </div>
           <div className="border-t border-[--color-border-secondary]"></div>
            <div>
                <h4 className="text-base font-bold text-[--color-text-primary] mb-3">Integrations</h4>
                <ToggleSwitch
                label="Sync to Blogger"
                checked={syncToBlogger}
                onChange={setSyncToBlogger}
                />
            </div>
        </aside>
      </div>
    </main>
  );
};

export default NewBlogPostView;