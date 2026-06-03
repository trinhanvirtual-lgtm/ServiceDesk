import React, { useState, useEffect, useRef, useMemo } from 'react';
import NotesBanner from './NotesBanner';
import NoteCard, { Note, ChecklistItem, keepColors } from './NoteCard';
import { 
  Pencil, 
  Archive, 
  Pin, 
  Palette, 
  Image as ImageIcon, 
  Check, 
  CheckSquare, 
  Square, 
  Plus, 
  X, 
  Tag, 
  Search,
  CheckCircle2
} from 'lucide-react';

export const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Ý tưởng chiến dịch CSKH 2025',
    content: 'Tập trung vào trải nghiệm khách hàng đa kênh, cá nhân hóa ưu đãi và xây dựng cộng đồng.',
    tags: ['marketing', 'chiến_dịch'],
    color: 'yellow',
    isPinned: true,
    createdAt: '2525-07-07T12:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'note-2',
    title: 'Danh sách việc cần chuẩn bị cho cuộc họp',
    checklist: [
      { item: 'Sữa tươi không đường cho phòng họp', done: true },
      { item: 'In ấn tài liệu báo cáo slide', done: false },
      { item: 'Kiểm tra máy chiếu & âm thanh', done: false },
      { item: 'Gửi email nhắc nhở phòng ban dự họp', done: true },
    ],
    tags: ['công_việc', 'họp'],
    color: 'green',
    createdAt: '2025-07-08T09:30:00Z',
  },
  {
    id: 'note-3',
    title: 'Ghi chú triết lý sống',
    content: '"The best way to predict the future is to invent it." - Alan Kay',
    tags: ['truyền_cảm_hứng'],
    color: 'blue',
    createdAt: '2025-07-08T15:00:00Z',
  },
];

interface CreateNoteProps {
  onAddNote: (noteData: Partial<Note>) => void;
}

const CreateNote: React.FC<CreateNoteProps> = ({ onAddNote }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteColor, setNoteColor] = useState('default');
  const [isPinned, setIsPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  
  // Checklist section visibility
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  
  // Tags dynamic creation state
  const [tagsInput, setTagsInput] = useState('');
  const [showTagsInput, setShowTagsInput] = useState(false);

  // Picker popups
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };
   
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    // Determine if the note has any meaningful content
    const hasText = title.trim() || content.trim();
    const hasChecklist = showChecklist && checklistItems.length > 0;
    const hasImage = imageUrl.trim();

    if (hasText || hasChecklist || hasImage) {
      const tags = tagsInput
        ? tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      onAddNote({
        title: title.trim(),
        content: content.trim() || undefined,
        checklist: showChecklist ? checklistItems : undefined,
        color: noteColor,
        isPinned,
        imageUrl: imageUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
    }

    // Reset fields
    setTitle('');
    setContent('');
    setNoteColor('default');
    setIsPinned(false);
    setImageUrl('');
    setShowImageUrlInput(false);
    setShowChecklist(false);
    setChecklistItems([]);
    setNewItemText('');
    setTagsInput('');
    setShowTagsInput(false);
    setShowColorPicker(false);
    setIsFocused(false);
  };

  // Close when clicking outside
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
  }, [isFocused, title, content, noteColor, isPinned, checklistItems, newItemText, imageUrl, tagsInput, showChecklist]);

  const handleAddChecklistItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;
    setChecklistItems([...checklistItems, { item: newItemText.trim(), done: false }]);
    setNewItemText('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, idx) => idx !== index));
  };

  const handleToggleChecklistItemDirect = (index: number) => {
    setChecklistItems(checklistItems.map((item, idx) => 
      idx === index ? { ...item, done: !item.done } : item
    ));
  };

  // Keep colors values
  const activeColor = keepColors.find(c => c.id === noteColor) || keepColors[0];

  return (
    <div className="max-w-xl mx-auto mb-10 px-4">
      <div 
        className={`rounded-xl border transition-all duration-300 shadow-md ${isFocused ? 'ring-2 ring-indigo-500/20 drop-shadow-lg' : 'hover:shadow-md cursor-text'} ${activeColor.bg} ${activeColor.border} ${isDragging ? 'ring-4 ring-indigo-500 border-indigo-500 scale-[1.01]' : ''}`}
        onClick={() => !isFocused && setIsFocused(true)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="flex flex-col relative">
          
          {/* Optional Image Preview inside creator */}
          {imageUrl && isFocused && (
            <div className="w-full relative h-40 rounded-t-xl overflow-hidden border-b border-dashed border-slate-200 dark:border-slate-800">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isFocused ? (
            <>
              {/* Header Title Input and Pin Toggle */}
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <input
                  type="text"
                  placeholder="Tiêu đề"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <button 
                  type="button" 
                  onClick={() => setIsPinned(!isPinned)} 
                  className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${isPinned ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}
                  title={isPinned ? "Bỏ ghim" : "Ghim ghi chú"}
                >
                  <Pin className={`w-4 h-4 fill-current ${isPinned ? 'scale-110 rotate-45' : 'scale-100'}`} />
                </button>
              </div>

              {/* Main Workspace: Text Content and Checklist */}
              <div className="px-4 py-2 space-y-3">
                <textarea
                  autoFocus
                  placeholder="Tạo ghi chú..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={2}
                  className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none resize-none overflow-y-auto min-h-[50px] leading-relaxed"
                />

                {showChecklist && (
                  <div className="space-y-2 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Danh mục checklist:</h5>
                    {/* List Items drafted */}
                    {checklistItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 group/item">
                        <button
                          type="button"
                          onClick={() => handleToggleChecklistItemDirect(index)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {item.done ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span 
                          className={`flex-1 text-xs text-slate-700 dark:text-slate-300 ${item.done ? 'line-through text-slate-400' : ''}`}
                        >
                          {item.item}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveChecklistItem(index)}
                          className="p-1 text-slate-400 hover:text-red-500 opacity-60 hover:opacity-100 rounded"
                          title="Xóa mục"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* New Item draft input */}
                    <div className="flex items-center gap-2 mt-2">
                      <Plus className="w-4 h-4 text-slate-400 block shrink-0" />
                      <input 
                        type="text"
                        placeholder="Thêm mục..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklistItem();
                          }
                        }}
                        className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none placeholder-slate-400"
                      />
                      {newItemText.trim() && (
                        <button 
                          type="button" 
                          onClick={() => handleAddChecklistItem()}
                          className="p-1 px-2.5 text-[10px] uppercase font-bold text-indigo-600 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all"
                        >
                          Thêm
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tag Inline Edit input field */}
              {showTagsInput && (
                <div className="px-4 py-1.5 flex items-center gap-2 bg-black/5 dark:bg-white/5 border-t border-b border-slate-200/40 dark:border-slate-800/40">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Nhãn (Ngăn cách bằng dấu phẩy) e.g. công việc, mua sắm"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowTagsInput(false)}
                    className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 rounded-full"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Optional custom Image URL input field */}
              {showImageUrlInput && (
                <div className="px-4 py-1.5 flex items-center gap-2 bg-black/5 dark:bg-white/5 border-t border-b border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-xs font-semibold text-slate-500">Image URL:</span>
                  <input
                    type="text"
                    placeholder="Dán link ảnh từ Unsplash/Web..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none font-mono"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowImageUrlInput(false)}
                    className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 rounded-full"
                    title="Đóng nhập ảnh"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Toolbar Actions Row */}
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-200/10 dark:border-white/5 mt-2 bg-black/5 dark:bg-white/5 rounded-b-xl">
                <div className="flex items-center gap-0.5">
                  
                  {/* Dynamic Color palette popover inside creator */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      title="Chọn màu nền" 
                      className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                    </button>

                    {showColorPicker && (
                      <div 
                        ref={colorPickerRef}
                        className="absolute left-0 bottom-10 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xl flex gap-1.5 items-center w-max"
                      >
                        {keepColors.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => {
                              setNoteColor(color.id);
                              setShowColorPicker(false);
                            }}
                            title={color.name}
                            className={`w-5.5 h-5.5 rounded-full border border-slate-300 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all ${color.bullet} relative`}
                          >
                            {noteColor === color.id && (
                              <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 absolute inset-0 m-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode switcher Standard Text <--> Checklist */}
                  <button 
                    type="button" 
                    onClick={() => setShowChecklist(!showChecklist)}
                    title={showChecklist ? "Ẩn danh sách checklist" : "Bật danh sách checklist"} 
                    className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors ${showChecklist ? 'bg-indigo-50 text-indigo-700 dark:bg-slate-800' : ''}`}
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  {/* Tag label button */}
                  <button 
                    type="button" 
                    onClick={() => setShowTagsInput(!showTagsInput)}
                    title="Thêm nhãn" 
                    className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors ${tagsInput ? 'text-indigo-600' : ''}`}
                  >
                    <Tag className="w-4 h-4" />
                  </button>

                  {/* Local image file trigger */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Tải ảnh lên từ thiết bị" 
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  
                  {/* URL icon button option */}
                  <button 
                    type="button" 
                    onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                    title="Dán link ảnh từ URL"
                    className="px-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-800"
                  >
                    URL
                  </button>
                  
                  <button 
                    type="button" 
                    title="Kho lưu trữ" 
                    className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={handleClose} 
                    className="py-1 px-3.5 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Lưu & Đóng
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Collapsed Input Box Placeholder
            <div className="flex items-center justify-between p-3.5 h-12">
              <span className="text-slate-400 text-xs font-bold pl-2">Tạo ghi chú...</span>
              <div className="flex items-center gap-1.5 pr-1">
                {/* Click list/checkbox directly transforms creator into checklist mode */}
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChecklist(true);
                    setIsFocused(true);
                  }}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-slate-400 transition-all"
                  title="Danh sách mới"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                
                {/* Click ImageIcon directly places creator into photo mode */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFocused(true);
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 50);
                  }}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-slate-400 transition-all"
                  title="Tải ảnh lên từ máy tính"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};


const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = localStorage.getItem('keep_notes');
    return stored ? JSON.parse(stored) : mockNotes;
  });

  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  // Modal Edit Note state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalColor, setModalColor] = useState('default');
  const [modalIsPinned, setModalIsPinned] = useState(false);
  const [modalChecklist, setModalChecklist] = useState<ChecklistItem[]>([]);
  const [modalShowChecklist, setModalShowChecklist] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalTagsInput, setModalTagsInput] = useState('');
  const [modalNewTodo, setModalNewTodo] = useState('');
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const handleModalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Persist notes changes
  useEffect(() => {
    localStorage.setItem('keep_notes', JSON.stringify(notes));
  }, [notes]);

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

  const handleAddNote = (newNoteData: Partial<Note>) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      color: newNoteData.color || 'default',
      title: newNoteData.title || undefined,
      content: newNoteData.content || undefined,
      checklist: newNoteData.checklist || undefined,
      imageUrl: newNoteData.imageUrl || undefined,
      tags: newNoteData.tags || undefined,
      isPinned: newNoteData.isPinned || false,
    };
    setNotes(prev => [newNote, ...prev]);
    showToast("Đã lưu ghi chú mới thành công!");
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };
  
  const handleTogglePin = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      showToast("Đã xóa ghi chú!");
    }
  };

  // Unique labels list extraction from all notes to support filter tabs
  const allLabels = useMemo(() => {
    const labelsSet = new Set<string>();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(t => labelsSet.add(t));
      }
    });
    return Array.from(labelsSet);
  }, [notes]);

  // Filters notes by Search text AND Active label/tag selection
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Search criterion
      const matchesSearch = 
        (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.checklist && note.checklist.some(ci => ci.item.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (note.tags && note.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

      // Tag criterion
      const matchesTag = !activeTag || (note.tags && note.tags.includes(activeTag));

      return !!(matchesSearch && matchesTag);
    });
  }, [notes, searchTerm, activeTag]);

  // Group filtered results into Pinned / Unpinned for high fidelity Keep look
  const pinnedNotes = useMemo(() => {
    return filteredNotes.filter(n => n.isPinned);
  }, [filteredNotes]);

  const unpinnedNotes = useMemo(() => {
    return filteredNotes.filter(n => !n.isPinned);
  }, [filteredNotes]);

  // Modal Editing setup
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setModalTitle(note.title || '');
    setModalContent(note.content || '');
    setModalColor(note.color || 'default');
    setModalIsPinned(!!note.isPinned);
    setModalChecklist(note.checklist ? [...note.checklist] : []);
    setModalShowChecklist(note.checklist && note.checklist.length > 0 ? true : false);
    setModalImageUrl(note.imageUrl || '');
    setModalTagsInput(note.tags ? note.tags.join(', ') : '');
  };

  const saveEditModal = () => {
    if (!editingNote) return;

    const tags = modalTagsInput
      ? modalTagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const updated: Note = {
      ...editingNote,
      title: modalTitle.trim() || undefined,
      content: modalContent.trim() || undefined,
      checklist: modalShowChecklist && modalChecklist.length > 0 ? modalChecklist : undefined,
      color: modalColor,
      isPinned: modalIsPinned,
      imageUrl: modalImageUrl.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    handleUpdateNote(updated);
    setEditingNote(null);
    showToast("Đã cập nhật ghi chú!");
  };

  const handleAddModalTodo = () => {
    if (!modalNewTodo.trim()) return;
    setModalChecklist([...modalChecklist, { item: modalNewTodo.trim(), done: false }]);
    setModalNewTodo('');
  };

  const modalActiveColor = keepColors.find(c => c.id === modalColor) || keepColors[0];

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] gap-3 pb-24 md:pb-8">
      <div className="shrink-0 animate-fade-in-up">
        <NotesBanner />
      </div>

      <div className="flex flex-1 min-h-0 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        
        {/* Main Workspace Frame */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5">
           
           {/* Top Bar for Dynamic Searching & Label Filtering */}
           <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 max-w-4xl mx-auto w-full">
             
             {/* Beautiful search bar */}
             <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm qua văn bản, tiêu đề, checklist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium text-slate-850 dark:text-white"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
             </div>

             {/* Tag selector filter badges */}
             {allLabels.length > 0 && (
               <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                 <button
                   onClick={() => setActiveTag(null)}
                   className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${!activeTag ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'}`}
                 >
                   Tất cả ghi chú
                 </button>
                 {allLabels.map((tag) => (
                   <button
                     key={tag}
                     onClick={() => setActiveTag(tag)}
                     className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${activeTag === tag ? 'bg-indigo-600 text-white shadow' : 'bg-white/80 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50'}`}
                   >
                     <Tag className="w-2.5 h-2.5" />
                     {tag}
                   </button>
                 ))}
               </div>
             )}
           </div>

           {/* Keep Interactive Note Creator */}
           <CreateNote onAddNote={handleAddNote} />

           {/* Masonry Columns Notes display */}
           <div className="flex-1 min-h-0">
             
             {/* PINNED SECTION */}
             {pinnedNotes.length > 0 && (
               <div className="mb-8">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 pl-2">
                   Được ghim ({pinnedNotes.length})
                 </h4>
                 <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                   {pinnedNotes.map(note => (
                     <NoteCard 
                       key={note.id} 
                       note={note} 
                       onTogglePin={handleTogglePin} 
                       onDeleteNote={handleDeleteNote} 
                       onShareNote={handleShareNote}
                       onUpdateNote={handleUpdateNote}
                       onEditNote={openEditModal}
                     />
                   ))}
                 </div>
               </div>
             )}

             {/* OTHER NOTES SECTION */}
             <div>
               {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && (
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 pl-2 border-t border-slate-100/50 dark:border-slate-800/50 pt-5">
                   Khác ({unpinnedNotes.length})
                 </h4>
               )}
               {unpinnedNotes.length > 0 ? (
                 <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                   {unpinnedNotes.map(note => (
                     <NoteCard 
                       key={note.id} 
                       note={note} 
                       onTogglePin={handleTogglePin} 
                       onDeleteNote={handleDeleteNote} 
                       onShareNote={handleShareNote}
                       onUpdateNote={handleUpdateNote}
                       onEditNote={openEditModal}
                     />
                   ))}
                 </div>
               ) : (
                 pinnedNotes.length === 0 && (
                   <div className="text-center py-20 flex flex-col items-center gap-3">
                     <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-700 flex items-center justify-center border border-slate-100 dark:border-slate-800/50 shadow-inner">
                       <Pencil className="w-6 h-6 animate-pulse" />
                     </div>
                     <p className="text-sm font-bold text-slate-400">Chưa có ghi chú nào ăn khớp với bộ lọc.</p>
                     <p className="text-xs text-slate-400 max-w-xs">Hãy sử dụng thanh tạo biểu mẫu ghi chú ở trên để ghi nháp các suy nghĩ hoặc việc cần làm mới!</p>
                   </div>
                 )
               )}
             </div>

           </div>
        </div>
      </div>

      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* GOOGLE KEEP STYLE MODAL FOR EDITING NOTE DETAILS */}
      {editingNote && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300 animate-fade-in"
          onClick={saveEditModal}
        >
          <div 
            className={`w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-scale-in ${modalActiveColor.bg} ${modalActiveColor.border}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Optional image banner at top */}
            {modalImageUrl && (
              <div className="w-full relative h-48 focus:outline-none shrink-0 border-b border-slate-200/30">
                <img src={modalImageUrl} alt="Note banner preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => setModalImageUrl('')}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/95 text-white rounded-full transition-colors"
                  title="Xóa hình ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Modal Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
              
              {/* Pin & Title */}
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Tiêu đề"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="flex-1 bg-transparent text-lg font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <button 
                  type="button" 
                  onClick={() => setModalIsPinned(!modalIsPinned)} 
                  className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${modalIsPinned ? 'text-yellow-600 dark:text-yellow-405' : 'text-slate-400'}`}
                  title={modalIsPinned ? "Hủy ghim" : "Ghim ghi chú"}
                >
                  <Pin className={`w-4 h-4 fill-current ${modalIsPinned ? 'scale-110' : 'scale-100'}`} />
                </button>
              </div>

              {/* Text Area AND Checklist unified together */}
              <div className="space-y-3">
                <textarea
                  placeholder="Ghi chú chi tiết..."
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  rows={5}
                  className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-350 placeholder-slate-400 focus:outline-none resize-none leading-relaxed min-h-[100px]"
                />

                {modalShowChecklist && (
                  <div className="space-y-2 border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Danh mục việc cần làm:</h5>
                    
                    {/* Listed Items */}
                    {modalChecklist.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setModalChecklist(modalChecklist.map((it, idx) => 
                              idx === index ? { ...it, done: !it.done } : it
                            ));
                          }}
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          {item.done ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        
                        <input 
                          type="text"
                          value={item.item}
                          onChange={(e) => {
                            setModalChecklist(modalChecklist.map((it, idx) => 
                              idx === index ? { ...it, item: e.target.value } : it
                            ));
                          }}
                          className={`flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none ${item.done ? 'line-through text-slate-400' : ''}`}
                        />

                        <button 
                          type="button" 
                          onClick={() => {
                            setModalChecklist(modalChecklist.filter((_, idx) => idx !== index));
                          }}
                          className="p-1 hover:text-red-500 rounded text-slate-400"
                          title="Xóa hàng"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add Row inside modal */}
                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-200/30">
                      <Plus className="w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Thêm mục checklist mới..."
                        value={modalNewTodo}
                        onChange={(e) => setModalNewTodo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddModalTodo();
                          }
                        }}
                        className="flex-1 bg-transparent text-xs text-slate-707 dark:text-slate-300 focus:outline-none placeholder-slate-400"
                      />
                      {modalNewTodo.trim() && (
                        <button 
                          type="button" 
                          onClick={handleAddModalTodo}
                          className="p-1 px-3 bg-indigo-50 dark:bg-slate-800 text-[10px] font-bold text-indigo-700 dark:text-blue-400 rounded-md"
                        >
                          Thêm
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tag modification line */}
              <div className="pt-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#80868b] dark:text-slate-500 block mb-1">Mác nhãn (cách nhau bằng dấy phẩy):</label>
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 border border-slate-200/10">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. công việc, mua sắm"
                    value={modalTagsInput}
                    onChange={(e) => setModalTagsInput(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Image insertion line (Both local desktop upload and web link URL input) */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#80868b] dark:text-slate-500 block mb-1">Đính kèm hình ảnh:</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 border border-slate-200/10 flex-1 w-full font-sans">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Dán URL đường dẫn liên kết hình ảnh..."
                      value={modalImageUrl}
                      onChange={(e) => setModalImageUrl(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                  
                  <input 
                    type="file" 
                    ref={modalFileInputRef} 
                    onChange={handleModalImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10 bg-black/5 dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl transition border border-slate-300 dark:border-slate-700 shrink-0"
                  >
                    Tải ảnh từ máy tính
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Bottom toolbar */}
            <div className="px-6 py-4 border-t border-slate-200/10 dark:border-white/5 bg-black/5 dark:bg-white/5 rounded-b-2xl flex flex-col sm:flex-row gap-3 sm:items-center justify-between shrink-0">
              
              {/* Color list overlay */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1 shrink-0">Màu sắc:</span>
                {keepColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setModalColor(color.id)}
                    title={color.name}
                    className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all ${color.bullet} relative`}
                  >
                    {modalColor === color.id && (
                      <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>

              {/* Toggle switch standard or checklist directly */}
              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={() => {
                    setModalShowChecklist(!modalShowChecklist);
                    if (modalChecklist.length === 0) {
                      setModalChecklist([{ item: 'Mục công việc đầu tiên...', done: false }]);
                    }
                  }}
                  className={`px-3 py-1 flex items-center gap-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[10px] font-bold rounded transition-all ${modalShowChecklist ? 'text-indigo-600 bg-indigo-50/80 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-350'}`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {modalShowChecklist ? "Hiển thị checklist" : "Hiện Checklist"}
                </button>

                <button 
                  onClick={saveEditModal} 
                  className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-md transition-colors"
                >
                  Đóng & Lưu
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default NotesView;
