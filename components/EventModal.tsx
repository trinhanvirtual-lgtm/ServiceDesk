import React, { useState, useRef, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  RefreshCw, 
  MapPin, 
  Video, 
  Plus, 
  X, 
  List, 
  Sparkles, 
  Globe, 
  Home
} from 'lucide-react';
import { CalendarEvent } from './CalendarView';
import { mockTaskLists } from './TasklistView';
import { initialContacts } from './ContactsView';

interface EventModalProps {
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id' | 'color'> & { id?: string }) => void;
  initialEvent?: CalendarEvent;
  defaultTitle?: string;
}

const companyMeetingRooms = [
  'Phòng họp Alpha (Tầng 1)',
  'Phòng họp Beta (Tầng 2 - Lớn)',
  'Phòng họp Gamma (Tầng 3 - Kỹ thuật)',
  'Phòng họp Delta (Tầng 4)',
  'Phòng Hội nghị lớn (Tầng G)',
];

const EventModal: React.FC<EventModalProps> = ({ onClose, onSave, initialEvent, defaultTitle }) => {
  const [title, setTitle] = useState(initialEvent?.title || defaultTitle || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [date, setDate] = useState(
    initialEvent?.date 
      ? new Date(initialEvent.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '10:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(
    initialEvent?.recurrence || 'none'
  );

  // New features states
  const [guests, setGuests] = useState<string[]>(initialEvent?.guests || []);
  const [guestInput, setGuestInput] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [listId, setListId] = useState(initialEvent?.listId || '');
  const [locationType, setLocationType] = useState<'offline' | 'online'>(
    initialEvent?.locationType || 'offline'
  );
  const [meetingRoom, setMeetingRoom] = useState(
    initialEvent?.meetingRoom || companyMeetingRooms[0]
  );
  const [onlineLink, setOnlineLink] = useState(
    initialEvent?.onlineLink || 'https://meet.google.com/abc-defg-hij'
  );
  const [onlineNotes, setOnlineNotes] = useState(
    initialEvent?.onlineNotes || ''
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter contacts based on guestInput
  const suggestedContacts = initialContacts.filter((contact) => {
    const query = guestInput.toLowerCase().trim();
    if (!query) return false;
    
    // Check if contact already added
    const isAlreadyAdded = guests.some(
      (g) => g.toLowerCase() === contact.email.toLowerCase() || g.toLowerCase() === contact.name.toLowerCase()
    );
    if (isAlreadyAdded) return false;

    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  });

  const handleAddGuest = (guest: string) => {
    const cleanGuest = guest.trim();
    if (!cleanGuest) return;
    
    if (!guests.some((g) => g.toLowerCase() === cleanGuest.toLowerCase())) {
      setGuests([...guests, cleanGuest]);
    }
    setGuestInput('');
    setShowContactDropdown(false);
  };

  const handleRemoveGuest = (indexToRemove: number) => {
    setGuests(guests.filter((_, idx) => idx !== indexToRemove));
  };

  const handleGuestInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's an input, treat as custom email/guest name and add
      if (guestInput.trim()) {
        handleAddGuest(guestInput.trim());
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề sự kiện.");
      return;
    }
    onSave({
      id: initialEvent?.id,
      title: title.trim(),
      description: description.trim(),
      date: new Date(date + 'T00:00:00'), // Adjust for timezone
      startTime,
      endTime,
      recurrence,
      guests,
      listId,
      locationType,
      meetingRoom: locationType === 'offline' ? meetingRoom : undefined,
      onlineLink: locationType === 'online' ? onlineLink : undefined,
      onlineNotes: locationType === 'online' ? onlineNotes : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={onClose}></div>
      <form onSubmit={handleSave} className="relative w-full max-w-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col my-8 animate-scale-in max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {initialEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 select-none no-scrollbar">
          
          {/* Title input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiêu đề sự kiện *</label>
            <input 
              type="text" 
              placeholder="Nhập tiêu đề cuộc họp, sự kiện..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full text-lg font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Time Picker Row */}
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Thời gian & Ngày diễn ra</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Ngày sự kiện</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Thời gian bắt đầu</label>
                <input 
                  type="time" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Thời gian kết thúc</label>
                <input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Select List Feature ("Sự kiện cho chọn danh sách") */}
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <List className="w-4 h-4 text-blue-500" />
              <span>Gắn vào list công việc</span>
            </div>
            
            <select
              value={listId}
              onChange={e => setListId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="">-- Không gắn vào danh sách công việc --</option>
              {mockTaskLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.tasks.length} công việc)
                </option>
              ))}
            </select>
          </div>

          {/* Location tab and selector feature */}
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Phương thức địa điểm</span>
              </span>
              
              {/* Type Switcher tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLocationType('offline')}
                  className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${locationType === 'offline' ? 'bg-white dark:bg-slate-850 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <Home className="w-3.5 h-3.5" />
                  Trực tiếp
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('online')}
                  className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${locationType === 'online' ? 'bg-white dark:bg-slate-850 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Trực tuyến (Online)
                </button>
              </div>
            </div>

            {/* Render conditional inputs */}
            {locationType === 'offline' ? (
              <div className="space-y-1.5 animate-fade-in-up">
                <label className="text-xs font-bold text-slate-500">Phòng họp công ty *</label>
                <select
                  value={meetingRoom}
                  onChange={e => setMeetingRoom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-200 font-medium"
                >
                  {companyMeetingRooms.map((room) => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Chọn một trong những phòng thực tế có sẵn của công ty.</p>
              </div>
            ) : (
              <div className="space-y-3.5 animate-fade-in-up">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Đường link họp trực tuyến *</label>
                  <div className="relative">
                    <input
                      type="url"
                      required={locationType === 'online'}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={onlineLink}
                      onChange={e => setOnlineLink(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-blue-600 dark:text-blue-400"
                    />
                    <Video className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Ghi chú họp trực tuyến</label>
                  <input
                    type="text"
                    placeholder="Mật khẩu phòng, hướng dẫn chuẩn bị..."
                    value={onlineNotes}
                    onChange={e => setOnlineNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add Guests from Contacts or External Email feature */}
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Khách mời (Từ danh bạ hoặc bên ngoài)</span>
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nhập tên, email danh bạ hoặc gõ email bên ngoài..."
                  value={guestInput}
                  onChange={e => {
                    setGuestInput(e.target.value);
                    setShowContactDropdown(true);
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  onKeyDown={handleGuestInputKeyDown}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <button 
                  type="button"
                  onClick={() => handleAddGuest(guestInput)}
                  disabled={!guestInput.trim()}
                  className="px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-850 text-white disabled:text-slate-400 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 active:scale-95 duration-75"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showContactDropdown && suggestedContacts.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto py-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">Được gợi ý từ Danh bạ</div>
                  {suggestedContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleAddGuest(contact.name || contact.email)}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {contact.name ? contact.name.charAt(0) : '@'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{contact.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{contact.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Badges of added guests */}
            {guests.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {guests.map((g, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1.5 bg-blue-50/75 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-300 py-1 pl-2.5 pr-1.5 rounded-full text-xs font-bold"
                  >
                    <span className="truncate max-w-40">{g}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveGuest(idx)}
                      className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">Chưa có khách mời nào được thêm vào cuộc họp.</p>
            )}
          </div>

          {/* Sync recurrence option */}
          <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span>Chu kỳ lặp lại</span>
            </div>
            
            <select 
              value={recurrence}
              onChange={e => setRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly')}
              className="w-full bg-slate-50 dark:bg-slate-900 p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="none">Sự kiện một lần (Không lặp lại)</option>
              <option value="daily">Mỗi ngày</option>
              <option value="weekly">Mỗi tuần</option>
              <option value="monthly">Mỗi tháng</option>
              <option value="yearly">Mỗi năm</option>
            </select>
          </div>

          {/* Description field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung chi tiết cuộc họp</label>
            <textarea
              placeholder="Nhập ghi chú thêm hoặc chương trình cuộc họp..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm text-slate-700 dark:text-slate-200 resize-y"
            />
          </div>

        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-white dark:bg-slate-900">
          <button 
            type="button" 
            onClick={onClose} 
            className="py-2.5 px-5 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            className="py-2.5 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-blue-500/20 text-sm"
          >
            {initialEvent ? 'Cập nhật sự kiện' : 'Tạo sự kiện'}
          </button>
        </footer>

      </form>
    </div>
  );
};

export default EventModal;
