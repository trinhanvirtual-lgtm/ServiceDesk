import React, { useState, useRef, useEffect } from 'react';
import { 
  Trash2, 
  Pin, 
  Bell, 
  UserPlus, 
  Palette, 
  Image as ImageIcon, 
  Archive, 
  Share2, 
  Check, 
  CheckSquare, 
  Square,
  Tag,
  File as FileIcon,
  X,
  Paperclip
} from 'lucide-react';
import { initialContacts } from './ContactsView';

export interface ChecklistItem {
  item: string;
  done: boolean;
}

export interface Note {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  color: string;
  checklist?: ChecklistItem[];
  isPinned?: boolean;
  createdAt: string;
  imageUrl?: string;
  sharedWith?: string[];
  attachments?: {
    name: string;
    url: string;
    size?: string;
    type: string;
  }[];
}

interface NoteCardProps {
  note: Note;
  onTogglePin: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onShareNote?: (note: Note) => void;
  onUpdateNote: (updatedNote: Note) => void;
  onEditNote: (note: Note) => void;
}

export const keepColors = [
  { id: 'default', name: 'Trắng', bg: 'bg-white dark:bg-slate-900', border: 'border-slate-200 dark:border-slate-800', bullet: 'bg-white border-slate-300' },
  { id: 'red', name: 'Đỏ', bg: 'bg-red-50/95 dark:bg-[#5c2b29]/90', border: 'border-red-200 dark:border-red-950', bullet: 'bg-red-300 dark:bg-red-700' },
  { id: 'orange', name: 'Cam', bg: 'bg-amber-50/95 dark:bg-[#614a19]/90', border: 'border-amber-200 dark:border-amber-950', bullet: 'bg-amber-300 dark:bg-amber-700' },
  { id: 'yellow', name: 'Vàng', bg: 'bg-yellow-50/95 dark:bg-[#5b5420]/90', border: 'border-yellow-200 dark:border-yellow-950', bullet: 'bg-yellow-200 dark:bg-yellow-600' },
  { id: 'green', name: 'Lục', bg: 'bg-emerald-50/95 dark:bg-[#344439]/90', border: 'border-emerald-200 dark:border-[#1d2d22]', bullet: 'bg-emerald-300 dark:bg-emerald-700' },
  { id: 'teal', name: 'Lam lục', bg: 'bg-teal-50/95 dark:bg-[#1a4a54]/90', border: 'border-teal-200 dark:border-teal-950', bullet: 'bg-teal-300 dark:bg-teal-700' },
  { id: 'blue', name: 'Xanh dương', bg: 'bg-sky-50/95 dark:bg-[#2d4257]/90', border: 'border-sky-200 dark:border-sky-950', bullet: 'bg-sky-300 dark:bg-sky-700' },
  { id: 'purple', name: 'Tím', bg: 'bg-purple-50/95 dark:bg-[#422e5a]/90', border: 'border-purple-200 dark:border-purple-950', bullet: 'bg-purple-300 dark:bg-purple-700' },
  { id: 'pink', name: 'Hồng', bg: 'bg-pink-50/95 dark:bg-[#5c223a]/90', border: 'border-pink-200 dark:border-pink-950', bullet: 'bg-pink-300 dark:bg-pink-700' },
  { id: 'grey', name: 'Xám', bg: 'bg-slate-50/95 dark:bg-[#2c3033]/90', border: 'border-slate-200 dark:border-slate-800', bullet: 'bg-slate-300 dark:bg-slate-600' },
];

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onTogglePin, 
  onDeleteNote, 
  onShareNote, 
  onUpdateNote, 
  onEditNote 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const cardAttachmentInputRef = useRef<HTMLInputElement>(null);

  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onUpdateNote({ ...note, imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCardAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const sizeKB = Math.round(file.size / 1024);
        const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
        const newAttachment = {
          name: file.name,
          url: reader.result,
          size: sizeStr,
          type: file.type || 'application/octet-stream'
        };
        const updatedAttachments = note.attachments ? [...note.attachments, newAttachment] : [newAttachment];
        onUpdateNote({ ...note, attachments: updatedAttachments });
      }
    };
    reader.readAsDataURL(file);
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  const activeColor = keepColors.find(c => c.id === note.color) || keepColors[0];

  const handleToggleCheckItem = (index: number) => {
    if (!note.checklist) return;
    const updatedChecklist = note.checklist.map((item, idx) => 
      idx === index ? { ...item, done: !item.done } : item
    );
    onUpdateNote({
      ...note,
      checklist: updatedChecklist
    });
  };

  const handleSelectColor = (colorId: string) => {
    onUpdateNote({
      ...note,
      color: colorId
    });
    setShowColorPicker(false);
  };

  // Group checklist items into active and completed for clean Keep style
  const activeItems = note.checklist ? note.checklist.filter(item => !item.done) : [];
  const completedItems = note.checklist ? note.checklist.filter(item => item.done) : [];

  return (
    <div 
      className={`break-inside-avoid relative mb-4 p-4 rounded-xl border flex flex-col justify-between shadow-sm hover:shadow-md dark:hover:shadow-black/40 transition-all duration-200 group ${activeColor.bg} ${activeColor.border}`}
      id={`note-card-${note.id}`}
    >
      {/* Pin Icon overlay, always available on hover, or showing permanently if pinned */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(note.id);
        }} 
        className={`absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-150 ${note.isPinned ? 'opacity-100 text-yellow-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`}
        title={note.isPinned ? "Bỏ ghim" : "Ghim ghi chú"}
      >
        <Pin className={`w-4 h-4 fill-current ${note.isPinned ? 'scale-110 rotate-45' : 'scale-100'}`} />
      </button>

      {/* Main card body area (Clickable to edit) */}
      <div 
        className="cursor-pointer pb-2" 
        onClick={() => onEditNote(note)}
      >
        {/* Optional Image */}
        {note.imageUrl && (
          <div className="w-full mb-3 rounded-lg overflow-hidden max-h-48 border border-slate-100 dark:border-slate-800">
            <img src={note.imageUrl} alt="Note image" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        {/* Optional File Attachments */}
        {note.attachments && note.attachments.length > 0 && (
          <div className="mt-2 mb-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {note.attachments.map((file, idx) => {
              const isImg = file.type.startsWith('image/');
              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-950/40 border border-slate-150/10 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-left"
                >
                  <a 
                    href={file.url} 
                    download={file.name} 
                    className="flex items-center gap-2 min-w-0 flex-1 hover:underline"
                    title={`Click để tải xuống: ${file.name}`}
                  >
                    {isImg ? (
                      <ImageIcon className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    ) : (
                      <FileIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    )}
                    <div className="min-w-0 pr-2">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 truncate leading-snug">{file.name}</p>
                      {file.size && <p className="text-[9px] text-slate-400 font-medium">{file.size}</p>}
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedAttachments = note.attachments?.filter((_, fidx) => fidx !== idx);
                      onUpdateNote({ ...note, attachments: updatedAttachments?.length ? updatedAttachments : undefined });
                    }}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded transition-colors shrink-0"
                    title="Xóa đính kèm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Title */}
        {note.title && (
          <h3 className="font-bold text-[16px] text-slate-800 dark:text-slate-100 leading-tight mb-2 pr-6">
            {note.title}
          </h3>
        )}

        {/* Content (Text style) */}
        {note.content && (
          <p className="text-sm text-slate-600 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        )}

        {/* Checklist View (Keep style) */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="mt-2 space-y-1">
            {/* Active Items */}
            {activeItems.map((item, idx) => {
              const originalIndex = note.checklist!.findIndex(original => original === item);
              return (
                <div 
                  key={`act-${idx}`} 
                  className="flex items-start gap-2.5 py-0.5 text-xs text-slate-700 dark:text-slate-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCheckItem(originalIndex);
                  }}
                >
                  <Square className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                  <span className="flex-1">{item.item}</span>
                </div>
              );
            })}

            {/* Completed Separator & Checked Items */}
            {completedItems.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                {completedItems.map((item, idx) => {
                  const originalIndex = note.checklist!.findIndex(original => original === item);
                  return (
                    <div 
                      key={`comp-${idx}`} 
                      className="flex items-start gap-2.5 py-0.5 text-xs text-slate-400 dark:text-slate-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCheckItem(originalIndex);
                      }}
                    >
                      <CheckSquare className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
                      <span className="line-through flex-1">{item.item}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tags / Labels */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md"
              >
                <Tag className="w-2.5 h-2.5 opacity-60" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Shared With Contacts Avatars */}
        {note.sharedWith && note.sharedWith.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200/5 dark:border-white/5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Được chia sẻ với:</span>
            <div className="flex -space-x-1 overflow-hidden">
              {note.sharedWith.map((contactId) => {
                const contact = initialContacts.find(c => c.id === contactId);
                if (!contact) return null;
                return (
                  <div key={contactId} title={`${contact.name} (${contact.email})`} className="relative shrink-0 select-none">
                    {contact.avatar && contact.avatar.startsWith('http') ? (
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        referrerPolicy="no-referrer"
                        className="w-4.5 h-4.5 rounded-full border border-white dark:border-slate-900 object-cover"
                      />
                    ) : (
                      <span className="w-4.5 h-4.5 rounded-full border border-white dark:border-slate-900 bg-indigo-500 dark:bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center">
                        {contact.name.split(' ').pop()?.[0] || 'C'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbars (Visible on card hover) */}
      <div className="flex items-center justify-between mt-4 border-t border-slate-200/10 dark:border-white/5 pt-2 opacity-0 group-hover:opacity-100 transition-all duration-150">
        <div className="flex items-center gap-0.5 relative">
          <button 
            title="Nhắc nhở" 
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          
          {onShareNote ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onShareNote(note);
              }}
              title="Chia sẻ với Danh bạ" 
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              title="Người cộng tác" 
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}
          
          {/* Color palette popover trigger */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              title="Đổi màu sắc" 
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div 
                ref={colorPickerRef}
                className="absolute left-0 bottom-8 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-xl flex gap-1.5 items-center w-max"
              >
                {keepColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectColor(color.id);
                    }}
                    title={color.name}
                    className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all ${color.bullet} relative`}
                  >
                    {note.color === color.id && (
                      <Check className="w-3 h-3 text-slate-600 dark:text-slate-300 absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input 
            type="file" 
            ref={cardFileInputRef} 
            onChange={handleCardImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            title="Thêm hình ảnh từ thiết bị" 
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              cardFileInputRef.current?.click();
            }}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          <input 
            type="file" 
            ref={cardAttachmentInputRef} 
            onChange={handleCardAttachmentUpload} 
            className="hidden" 
          />
          <button 
            title="Đính kèm tài liệu" 
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              cardAttachmentInputRef.current?.click();
            }}
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          
          <button 
            title="Kho lưu trữ" 
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="flex items-center gap-0.5">
          {onShareNote && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onShareNote(note);
              }} 
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-600 dark:hover:text-sky-400 transition-colors" 
              title="Chia sẻ liên kết"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note.id);
            }} 
            className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 transition-colors" 
            title="Xóa ghi chú"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
