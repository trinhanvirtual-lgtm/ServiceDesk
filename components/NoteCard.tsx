import React from 'react';
import { TrashIcon, PinIcon, BellIcon, UserPlusIcon, PaletteIcon, ImageIcon, ArchiveIcon, MoreVerticalIcon, ShareIcon } from './icons';

type ChecklistItem = {
  item: string;
  done: boolean;
};

export interface Note {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  color: string;
  checklist?: ChecklistItem[];
  isPinned?: boolean;
  createdAt: string;
}

interface NoteCardProps {
  note: Note;
  onTogglePin: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onShareNote?: (note: Note) => void;
}

const colorStyles: Record<string, string> = {
    default: 'bg-white/80',
    red: 'bg-red-200/80',
    orange: 'bg-orange-200/80',
    yellow: 'bg-yellow-200/80',
    green: 'bg-green-200/80',
    blue: 'bg-blue-200/80',
    purple: 'bg-purple-200/80',
};


const NoteCard: React.FC<NoteCardProps> = ({ note, onTogglePin, onDeleteNote, onShareNote }) => {
    const bgColor = colorStyles[note.color] || colorStyles.default;

    return (
        <div className={`break-inside-avoid mb-4 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group relative ${bgColor}`}>
            <div className="flex justify-between items-start mb-2">
                {note.title && <h3 className="font-bold text-[17px] text-slate-800 leading-tight">{note.title}</h3>}
                <button 
                  onClick={() => onTogglePin(note.id)} 
                  className={`opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-black/5 transition-all ${note.isPinned ? 'opacity-100 text-blue-600' : 'text-slate-500'}`}
                  title={note.isPinned ? "Bỏ ghim" : "Ghim ghi chú"}
                >
                     <PinIcon className="w-5 h-5"/>
                </button>
            </div>
            
            {note.content && <p className="text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>}
            
            {note.checklist && (
                <div className="space-y-1.5 mt-3">
                     {note.checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2.5">
                            <input type="checkbox" defaultChecked={item.done} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors" />
                            <span className={`text-sm flex-1 ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.item}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-5 pt-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="flex items-center gap-0.5">
                    <button title="Nhắc nhở" className="p-2 rounded-full hover:bg-black/5 text-slate-600 transition-colors"><BellIcon className="w-4 h-4" /></button>
                    <button title="Người cộng tác" className="p-2 rounded-full hover:bg-black/5 text-slate-600 transition-colors"><UserPlusIcon className="w-4 h-4" /></button>
                    <button title="Màu sắc" className="p-2 rounded-full hover:bg-black/5 text-slate-600 transition-colors"><PaletteIcon className="w-4 h-4" /></button>
                    <button title="Thêm hình ảnh" className="p-2 rounded-full hover:bg-black/5 text-slate-600 transition-colors"><ImageIcon className="w-4 h-4" /></button>
                    <button title="Lưu trữ" className="p-2 rounded-full hover:bg-black/5 text-slate-600 transition-colors"><ArchiveIcon className="w-4 h-4" /></button>
                    <button title="Thêm" className="p-2 rounded-full hover:bg-black/5 text-slate-600 transition-colors"><MoreVerticalIcon className="w-4 h-4" /></button>
                </div>
                
                <div className="flex items-center gap-1">
                    {onShareNote && (
                        <button onClick={() => onShareNote(note)} className="p-1.5 rounded-full hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all" title="Chia sẻ liên kết">
                            <ShareIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => onDeleteNote(note.id)} className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all" title="Xóa">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteCard;
