import React, { useState } from 'react';
import { ClockIcon, UsersIcon, LinkIcon, SyncIcon } from './icons';
import { CalendarEvent } from './CalendarView';
import { useLanguage } from './LanguageContext';

interface EventModalProps {
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id' | 'color'> & { id?: string }) => void;
  initialEvent?: CalendarEvent;
  defaultTitle?: string;
}

const EventModal: React.FC<EventModalProps> = ({ onClose, onSave, initialEvent, defaultTitle }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(initialEvent?.title || defaultTitle || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [date, setDate] = useState(initialEvent?.date ? initialEvent.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '10:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(initialEvent?.recurrence || 'none');
  
  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) {
        alert("Event title is required.");
        return;
      }
      onSave({
        id: initialEvent?.id,
        title,
        description,
        date: new Date(date + 'T00:00:00'), // Adjust for timezone
        startTime,
        endTime,
        recurrence,
      });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={onClose}></div>
      <form onSubmit={handleSave} className="relative w-full max-w-lg bg-white/80 backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
        <header className="p-4 border-b border-slate-200/80 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">{t('createEvent')}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-400/20 text-slate-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>
        <div className="p-5 flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Event Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full text-xl font-semibold bg-transparent border-b border-slate-300/80 focus:border-cyan-500 py-2 px-1 focus:outline-none transition-colors"
          />
          <div className="flex items-center gap-3 flex-wrap">
             <ClockIcon className="w-5 h-5 text-slate-500 shrink-0" />
             <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="bg-white/60 p-2 rounded-md border border-slate-300/70"/>
             <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="bg-white/60 p-2 rounded-md border border-slate-300/70"/>
             <span>to</span>
             <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="bg-white/60 p-2 rounded-md border border-slate-300/70"/>
          </div>
          <div className="flex items-center gap-3">
             <UsersIcon className="w-5 h-5 text-slate-500 shrink-0" />
             <input type="text" placeholder="Add guests..." className="flex-1 bg-white/60 p-2 rounded-md border border-slate-300/70" />
          </div>
           <div className="flex items-center gap-3">
             <LinkIcon className="w-5 h-5 text-slate-500 shrink-0" />
             <select className="flex-1 bg-white/60 p-2 rounded-md border border-slate-300/70 text-slate-700">
                <option>Gắn vào...</option>
                <option>Task / Dự án</option>
                <option>Mục tiêu (OKR)</option>
                <option>Nhân sự (HRM)</option>
             </select>
          </div>
          <div className="flex items-center gap-3">
             <SyncIcon className="w-5 h-5 text-slate-500 shrink-0" />
             <select 
                value={recurrence}
                onChange={e => setRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                className="flex-1 bg-white/60 p-2 rounded-md border border-slate-300/70 text-slate-700"
             >
                <option value="none">{t('doesNotRepeat') || 'Does not repeat'}</option>
                <option value="daily">{t('daily') || 'Daily'}</option>
                <option value="weekly">{t('weekly') || 'Weekly'}</option>
                <option value="monthly">{t('monthly') || 'Monthly'}</option>
                <option value="yearly">{t('yearly') || 'Yearly'}</option>
             </select>
          </div>
          <textarea
            placeholder="Description or notes..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-white/60 p-2 rounded-md border border-slate-300/70 mt-2 resize-y"
          ></textarea>
        </div>
        <footer className="p-4 mt-auto border-t border-slate-200/80 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-slate-700 font-semibold hover:bg-slate-400/20 transition-colors">{t('cancel')}</button>
          <button type="submit" className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md">{t('save')} Event</button>
        </footer>
      </form>
    </div>
  );
};

export default EventModal;