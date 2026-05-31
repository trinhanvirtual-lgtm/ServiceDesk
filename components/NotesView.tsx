import React, { useState, useEffect, useRef, useMemo } from 'react';
import NotesBanner from './NotesBanner';
import NoteCard, { Note } from './NoteCard';
import { BellIcon, PencilIcon, ArchiveIcon, PinIcon, TypeIcon, PaletteIcon, UserPlusIcon, ImageIcon, MoreVerticalIcon, UndoIcon, RedoIcon, CheckIcon } from './icons';

export const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Ý tưởng chiến dịch CSKH 2025',
    content: 'Tập trung vào trải nghiệm khách hàng đa kênh, cá nhân hóa ưu đãi và xây dựng cộng đồng.',
    tags: ['marketing', 'chiến dịch'],
    color: 'yellow',
    isPinned: true,
    createdAt: '2025-07-07T12:00:00Z',
  },
  {
    id: 'note-2',
    title: 'Danh sách mua sắm',
    checklist: [
      { item: 'Sữa tươi không đường', done: true },
      { item: 'Bánh mì sandwich', done: false },
      { item: 'Trứng gà (2 vỉ)', done: false },
      { item: 'Rau xà lách', done: true },
    ],
    color: 'green',
    createdAt: '2025-07-08T09:30:00Z',
  },
  {
    id: 'note-3',
    content: 'Ghi nhớ quote hay:\n"The best way to predict the future is to invent it." - Alan Kay',
    color: 'blue',
    createdAt: '2025-07-08T15:00:00Z',
  },
];

interface CreateNoteProps {
    onAddNote: (noteData: Pick<Note, 'title' | 'content' | 'isPinned'>) => void;
}

const CreateNote: React.FC<CreateNoteProps> = ({ onAddNote }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    // const { t } = useLanguage(); // Removed unused t

    const handleClose = () => {
        if (title.trim() || content.trim()) {
            onAddNote({ title, content, isPinned });
        }
        setTitle('');
        setContent('');
        setIsPinned(false);
        setIsFocused(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                if (isFocused) {
                    handleClose();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFocused, title, content]);

    return (
        <div className="max-w-2xl mx-auto mb-10 px-4">
            <div className={`bg-white rounded-lg shadow-[0_1px_2px_0_rgba(60,64,67,0.302),0_2px_6px_2px_rgba(60,64,67,0.149)] transition-all duration-200 ${isFocused ? '' : 'hover:shadow-[0_1px_3px_1px_rgba(60,64,67,0.302),0_4px_8px_3px_rgba(60,64,67,0.149)] cursor-text'}`} onClick={() => !isFocused && setIsFocused(true)}>
                <form ref={formRef} className="flex flex-col">
                    {isFocused ? (
                        <>
                            <div className="flex items-center px-4 py-3">
                                <input
                                    type="text"
                                    placeholder="Tiêu đề"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="flex-1 bg-transparent text-lg font-medium text-slate-800 placeholder-slate-500 focus:outline-none"
                                />
                                <button type="button" onClick={() => setIsPinned(!isPinned)} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${isPinned ? 'text-blue-600' : 'text-slate-500'}`}>
                                    <PinIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-4 py-2">
                                <textarea
                                    autoFocus
                                    placeholder="Ghi chú..."
                                    rows={1}
                                    value={content}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    className="w-full bg-transparent text-slate-700 placeholder-slate-700 focus:outline-none resize-none overflow-hidden min-h-[46px]"
                                />
                            </div>
                            <div className="flex items-center justify-between px-3 py-1 mb-1">
                                <div className="flex items-center gap-1">
                                    <button type="button" title="Định dạng" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><TypeIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Màu sắc" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><PaletteIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Nhắc nhở" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><BellIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Người cộng tác" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><UserPlusIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Thêm hình ảnh" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><ImageIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Lưu trữ" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><ArchiveIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Thêm" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><MoreVerticalIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Hoàn tác" className="p-2 rounded-full hover:bg-slate-100 text-slate-300 transition-colors"><UndoIcon className="w-5 h-5" /></button>
                                    <button type="button" title="Làm lại" className="p-2 rounded-full hover:bg-slate-100 text-slate-300 transition-colors"><RedoIcon className="w-5 h-5" /></button>
                                </div>
                                <button type="button" onClick={handleClose} className="py-2 px-6 rounded text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-sm">Đóng</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between p-3 h-12">
                            <span className="text-slate-600 font-bold ml-2">Tạo ghi chú...</span>
                            <div className="flex items-center gap-1 pr-1">
                                <button type="button" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><CheckIcon className="w-5 h-5" /></button>
                                <button type="button" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><PencilIcon className="w-5 h-5" /></button>
                                <button type="button" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><ImageIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};


const NotesView: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>(mockNotes);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage('');
        }, 2500);
    };

    const handleShareNote = (note: Note) => {
        const title = note.title || 'Ghi chú không tiêu đề';
        const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=note&shareId=${note.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast(`Đã sao chép liên kết ghi chú: "${title}"!`);
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast(`Đã sao chép liên kết ghi chú: "${title}"!`);
        });
    };

    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    }, [notes]);

    const handleAddNote = (newNoteData: Pick<Note, 'title' | 'content' | 'isPinned'>) => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            createdAt: new Date().toISOString(),
            color: 'default',
            ...newNoteData
        };
        setNotes(prev => [newNote, ...prev]);
    };
    
    const handleTogglePin = (noteId: string) => {
        setNotes(notes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
    };

    const handleDeleteNote = (noteId: string) => {
        setNotes(notes.filter(n => n.id !== noteId));
    };

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] gap-3 pb-24 md:pb-8">
        <div className="shrink-0">
            <NotesBanner />
        </div>
        <div className="flex flex-1 min-h-0 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-6">
                 <CreateNote onAddNote={handleAddNote} />
                 <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {sortedNotes.map(note => (
                        <NoteCard key={note.id} note={note} onTogglePin={handleTogglePin} onDeleteNote={handleDeleteNote} onShareNote={handleShareNote} />
                    ))}
                 </div>
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

export default NotesView;