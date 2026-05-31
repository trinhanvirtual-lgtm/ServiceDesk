import React, { useState, useMemo } from 'react';
import { User, RecentItem } from '../App';
import MeetingBanner from './MeetingBanner';
import { ClockIcon, UsersIcon, VideoIcon, MailIcon, PlusIcon, GoogleIcon, SyncIcon, FileTextIcon, FilePdfIcon, DownloadIcon, CopyIcon, CalendarPlusIcon, ShareIcon } from './icons';
import { useLanguage } from './LanguageContext';

// --- TYPES ---
type MeetingType = 'Nội bộ' | 'Giao ban' | 'Đối tác / khách hàng' | 'Phỏng vấn';
type MeetingStatus = 'Sắp diễn ra' | 'Đã kết thúc' | 'Huỷ';

interface Attendee {
  name: string;
  avatar: string; // URL or initials
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  date: Date;
  startTime: string;
  endTime: string;
  organizer: Attendee;
  attendees: Attendee[];
  meetLink: string;
  notes: string;
  agenda?: string;
  attachments?: { name: string; url: string }[];
  minutes: {
    content: string;
    actionItems: { task: string, owner: string, deadline: string }[];
  };
  source?: 'google';
}

// --- MOCK DATA ---
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

export const mockAttendees: { [key: string]: Attendee } = {
  'user': { name: 'Hung Thai', avatar: 'HT' },
  'an': { name: 'Trần Văn An', avatar: 'https://i.pravatar.cc/150?u=1' },
  'binh': { name: 'Lê Thị Bình', avatar: 'https://i.pravatar.cc/150?u=2' },
  'cuong': { name: 'Phạm Minh Cường', avatar: 'https://i.pravatar.cc/150?u=3' },
  'dung': { name: 'Vũ Thị Dung', avatar: 'https://i.pravatar.cc/150?u=4' },
  'em': { name: 'Hoàng Văn Em', avatar: 'https://i.pravatar.cc/150?u=5' },
};

export const initialMeetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Họp giao ban tuần Team Công nghệ',
    type: 'Giao ban',
    status: 'Sắp diễn ra',
    date: new Date(currentYear, currentMonth, now.getDate() + 2),
    startTime: '09:00',
    endTime: '10:00',
    organizer: mockAttendees.binh,
    attendees: [mockAttendees.user, mockAttendees.binh, mockAttendees.cuong, mockAttendees.dung],
    meetLink: 'https://meet.google.com/xyz-abc-def',
    notes: '',
    agenda: '1. Cập nhật tiến độ dự án tuần trước\\n2. Báo cáo vướng mắc\\n3. Đề xuất giải pháp\\n4. Lên kế hoạch tuần này',
    attachments: [
        { name: 'Báo_cáo_tuần_trước.pdf', url: '#' },
        { name: 'Kế_hoạch_tuần_này.docx', url: '#' }
    ],
    minutes: {
      content: 'Review tiến độ sprint, các vấn đề blocker, và kế hoạch tuần tới.',
      actionItems: []
    }
  },
  {
    id: 'm2',
    title: 'Demo sản phẩm cho Đối tác Acme Inc.',
    type: 'Đối tác / khách hàng',
    status: 'Sắp diễn ra',
    date: new Date(currentYear, currentMonth, now.getDate() + 3),
    startTime: '14:00',
    endTime: '15:30',
    organizer: mockAttendees.user,
    attendees: [mockAttendees.user, mockAttendees.em, { name: 'John Doe', avatar: 'JD' }],
    meetLink: 'https://meet.google.com/ghi-jkl-mno',
    notes: 'Cần chuẩn bị sẵn slide deck và môi trường demo.',
    agenda: '1. Giới thiệu tổng quan sản phẩm\\n2. Demo các tính năng chính\\n3. Q&A',
    attachments: [
        { name: 'Slide_Demo.pptx', url: '#' }
    ],
    minutes: {
      content: 'Trình bày các tính năng mới của sản phẩm, thảo luận về cơ hội hợp tác.',
      actionItems: [{ task: 'Gửi báo giá chi tiết', owner: 'Hoàng Văn Em', deadline: 'EOD' }]
    }
  },
  {
    id: 'm3',
    title: 'Phỏng vấn ứng viên Lập trình viên',
    type: 'Phỏng vấn',
    status: 'Đã kết thúc',
    date: new Date(currentYear, currentMonth, now.getDate() - 1),
    startTime: '10:30',
    endTime: '11:30',
    organizer: mockAttendees.cuong,
    attendees: [mockAttendees.cuong, mockAttendees.dung],
    meetLink: 'https://meet.google.com/pqr-stu-vwx',
    notes: 'Ứng viên có kỹ năng tốt về React, cần hỏi thêm về kinh nghiệm làm việc với hệ thống lớn.',
    agenda: '1. Tự giới thiệu\\n2. Câu hỏi kỹ thuật chung\\n3. Bài tập tình huống\\n4. Ứng viên đặt câu hỏi',
    attachments: [
        { name: 'CV_Nguyen_Van_A.pdf', url: '#' },
        { name: 'Ket_qua_bai_test.txt', url: '#' }
    ],
    minutes: {
      content: 'Phỏng vấn kỹ thuật và văn hóa với ứng viên Nguyễn Văn A.',
      actionItems: [{ task: 'Gửi email thông báo kết quả', owner: 'Phạm Minh Cường', deadline: 'Tomorrow' }]
    }
  },
    {
    id: 'm4',
    title: 'Thảo luận nội bộ về Chiến lược Q4',
    type: 'Nội bộ',
    status: 'Đã kết thúc',
    date: new Date(currentYear, currentMonth, now.getDate() - 2),
    startTime: '16:00',
    endTime: '17:00',
    organizer: mockAttendees.an,
    attendees: [mockAttendees.an, mockAttendees.binh, mockAttendees.em],
    meetLink: 'https://meet.google.com/aaa-bbb-ccc',
    notes: '',
    agenda: '1. Đánh giá kết quả Q3\\n2. Định hướng chiến lược Q4\\n3. Phân bổ nguồn lực',
    minutes: {
      content: 'Thống nhất mục tiêu và các OKR chính cho quý 4.',
      actionItems: [
          { task: 'Team Marketing hoàn thiện kế hoạch chi tiết', owner: 'Hoàng Văn Em', deadline: 'End of Week' },
          { task: 'Team Tech xác định các epic chính', owner: 'Lê Thị Bình', deadline: 'End of Week' },
        ]
    }
  },
  {
    id: 'm5',
    title: 'Họp đột xuất - Sự cố hệ thống',
    type: 'Nội bộ',
    status: 'Huỷ',
    date: new Date(currentYear, currentMonth, now.getDate()),
    startTime: '11:00',
    endTime: '11:30',
    organizer: mockAttendees.binh,
    attendees: [mockAttendees.binh, mockAttendees.cuong],
    meetLink: 'https://meet.google.com/ddd-eee-fff',
    notes: 'Sự cố đã được giải quyết, không cần họp nữa.',
    agenda: 'Trạng thái hệ thống và các bước xử lý khắc phục.',
    minutes: { content: '', actionItems: [] }
  }
];

const mockGoogleCalendarMeetings: Meeting[] = [
  {
    id: 'g-meet-1',
    title: 'Product Strategy Sync (from Google)',
    type: 'Nội bộ',
    status: 'Sắp diễn ra',
    date: new Date(currentYear, currentMonth, now.getDate() + 5),
    startTime: '11:00',
    endTime: '12:00',
    organizer: mockAttendees.em,
    attendees: [mockAttendees.user, mockAttendees.an, mockAttendees.em],
    meetLink: 'https://meet.google.com/ggg-hhh-iii',
    notes: 'Synced from Google Calendar.',
    minutes: { content: '', actionItems: [] },
    source: 'google'
  }
];

// --- HELPER COMPONENTS & FUNCTIONS ---
const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const statusConfig: Record<MeetingStatus, { icon: string; bg: string; text: string }> = {
  'Sắp diễn ra': { icon: '⏱️', bg: 'bg-blue-100', text: 'text-blue-800' },
  'Đã kết thúc': { icon: '✅', bg: 'bg-green-100', text: 'text-green-800' },
  'Huỷ': { icon: '⛔', bg: 'bg-red-100', text: 'text-red-800' },
};

const statusOrder: Record<MeetingStatus, number> = { 'Sắp diễn ra': 1, 'Đã kết thúc': 2, 'Huỷ': 3 };

interface MeetingViewProps {
  user: User;
  onItemViewed: (item: RecentItem) => void;
  isEmbedded?: boolean;
}

const MeetingView: React.FC<MeetingViewProps> = ({ onItemViewed, isEmbedded = false }) => {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(meetings.find(m => m.status === 'Sắp diễn ra')?.id || meetings[0].id);
  const [activeFilters, setActiveFilters] = useState<{ type: MeetingType[], status: MeetingStatus[] }>({ type: [], status: [] });
  const [addedToCalendarIds, setAddedToCalendarIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const { t } = useLanguage();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleShare = (meeting: Meeting) => {
    const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=meeting&shareId=${meeting.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast(`Đã sao chép liên kết cuộc họp: "${meeting.title}"!`);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(`Đã sao chép liên kết cuộc họp: "${meeting.title}"!`);
    });
  };

  const selectedMeeting = useMemo(() => meetings.find(m => m.id === selectedMeetingId), [meetings, selectedMeetingId]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => {
      const typeMatch = activeFilters.type.length === 0 || activeFilters.type.includes(meeting.type);
      const statusMatch = activeFilters.status.length === 0 || activeFilters.status.includes(meeting.status);
      return typeMatch && statusMatch;
    }).sort((a,b) => (statusOrder[a.status] - statusOrder[b.status] || a.startTime.localeCompare(b.startTime)));
  }, [meetings, activeFilters]);

  const toggleFilter = (category: 'type' | 'status', value: MeetingType | MeetingStatus) => {
    setActiveFilters(prev => {
      if (category === 'type') {
        const filters = prev.type;
        const typedValue = value as MeetingType;
        const newFilters = filters.includes(typedValue)
          ? filters.filter(f => f !== typedValue)
          : [...filters, typedValue];
        return { ...prev, type: newFilters };
      } else { // status
        const filters = prev.status;
        const typedValue = value as MeetingStatus;
        const newFilters = filters.includes(typedValue)
          ? filters.filter(f => f !== typedValue)
          : [...filters, typedValue];
        return { ...prev, status: newFilters };
      }
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(t('syncing'));
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMeetings(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMeetings = mockGoogleCalendarMeetings.filter(m => !existingIds.has(m.id));
        if (newMeetings.length === 0) {
            setSyncMessage('Đã cập nhật.');
            return prev;
        }
        return [...prev, ...newMeetings];
    });
    setIsSyncing(false);
    setSyncMessage(t('syncSuccess'));
    setTimeout(() => setSyncMessage(''), 3000);
  };

  const handleAddToCalendar = async (meeting: Meeting) => {
    // Simulate adding to Google Calendar
    setSyncMessage(t('syncing'));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAddedToCalendarIds(prev => new Set([...prev, meeting.id]));
    setSyncMessage(t('syncSuccess'));
    setTimeout(() => setSyncMessage(''), 3000);
  };
  
  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeetingId(meeting.id);
    onItemViewed({
        id: `meeting-${meeting.id}`,
        name: meeting.title,
        type: 'meeting',
        icon: <VideoIcon />,
        itemId: meeting.id
    });
  }

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text)
        .then(() => {
            // Optional: You could add a toast notification here
            console.log('Copied to clipboard');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
  }

  return (
    <main className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isEmbedded ? 'p-0' : 'p-[3px] pb-24 md:pb-8'}`}>
      <div className={`flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar ${isEmbedded ? 'p-0' : ''}`}>
        {!isEmbedded && <MeetingBanner />}

        <div className="flex flex-col md:flex-row items-center gap-4 shrink-0">
          <button className="w-full md:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-br from-blue-500 to-sky-600 text-white font-bold rounded-lg shadow-lg hover:shadow-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all transform hover:scale-105">
              <PlusIcon className="w-5 h-5"/>
              <span>Cuộc họp mới</span>
          </button>
          <div className="w-full md:w-auto flex-grow flex items-center gap-2">
              <div className="relative flex-grow">
                  <VideoIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                      type="text"
                      placeholder="Nhập mã hoặc đường liên kết"
                      className="w-full bg-white/60 border border-slate-300/60 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500 text-slate-800 rounded-lg py-3 pl-12 pr-4 transition-all"
                  />
              </div>
              <button className="flex-shrink-0 py-3 px-5 rounded-lg text-slate-700 font-semibold hover:bg-white/70 transition-colors border border-slate-300/60 bg-white/50">
                  Tham gia
              </button>
          </div>
          <button onClick={handleSync} disabled={isSyncing} title={isSyncing ? t('syncing') : t('syncWithMeetingsCalendar')} className="p-3 rounded-lg bg-white/70 text-indigo-700 font-bold shadow-md hover:bg-white transition-all transform hover:scale-105 disabled:opacity-60">
              <SyncIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {syncMessage && <p className="text-sm text-center font-semibold text-green-700">{syncMessage}</p>}


        <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex min-h-0">
          
          {/* Left Pane: Filters */}
          <div className="w-1/4 max-w-[280px] border-r border-white/50 flex flex-col">
            <div className="p-4 border-b border-white/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Lịch họp</h2>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              <div>
                  <h3 className="font-semibold text-slate-600 mb-2">Loại cuộc họp</h3>
                  {(['Nội bộ', 'Giao ban', 'Đối tác / khách hàng', 'Phỏng vấn'] as MeetingType[]).map(type => (
                      <button key={type} onClick={() => toggleFilter('type', type)} className={`w-full text-left p-2 rounded-md flex items-center gap-2 ${activeFilters.type.includes(type) ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-white/50'}`}>
                          <input type="checkbox" readOnly checked={activeFilters.type.includes(type)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                          <span className="font-medium">{type}</span>
                      </button>
                  ))}
              </div>
              <div>
                  <h3 className="font-semibold text-slate-600 mb-2">Trạng thái</h3>
                  {(['Sắp diễn ra', 'Đã kết thúc', 'Huỷ'] as MeetingStatus[]).map(status => (
                      <button key={status} onClick={() => toggleFilter('status', status)} className={`w-full text-left p-2 rounded-md flex items-center gap-2 ${activeFilters.status.includes(status) ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-white/50'}`}>
                          <input type="checkbox" readOnly checked={activeFilters.status.includes(status)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                          <span className="font-medium">{statusConfig[status].icon} {status}</span>
                      </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Center Pane: Meeting List */}
          <div className="w-1/3 border-r border-white/50 flex flex-col">
              <div className="p-4 border-b border-white/50 shrink-0">
                  <h3 className="text-lg font-bold text-slate-800">Danh sách ({filteredMeetings.length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">
                  {filteredMeetings.map(m => (
                      <div key={m.id} className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${selectedMeetingId === m.id ? 'bg-white/80' : 'hover:bg-white/50'}`}>
                          <button onClick={() => handleSelectMeeting(m)} className="flex-1 overflow-hidden" aria-label="Select meeting">
                              <p className="font-bold text-slate-800 truncate flex items-center gap-2">
                                {(m.source === 'google' || addedToCalendarIds.has(m.id)) && <GoogleIcon className="w-4 h-4 shrink-0" title="From Google Calendar" />}
                                {m.title}
                              </p>
                              <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1"><ClockIcon className="w-4 h-4" /> {m.startTime} - {m.endTime}</p>
                          </button>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${statusConfig[m.status].bg} ${statusConfig[m.status].text}`}>{m.status}</div>
                              <div className="flex items-center gap-1">
                                  {m.status === 'Sắp diễn ra' && m.source !== 'google' && !addedToCalendarIds.has(m.id) && (
                                      <button onClick={(e) => { e.stopPropagation(); handleAddToCalendar(m); }} className="text-slate-400 hover:text-green-600 p-1.5 rounded-md hover:bg-black/5 transition-colors" title={t('addToCalendar')}>
                                          <CalendarPlusIcon className="w-4 h-4" />
                                      </button>
                                  )}
                                  {m.meetLink && (
                                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(m.meetLink); }} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-black/5 transition-colors" title="Copy Google Meet Link">
                                          <CopyIcon className="w-4 h-4" />
                                      </button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleShare(m); }} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-black/5 transition-colors" title="Chia sẻ liên kết">
                                      <ShareIcon className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Right Pane: Meeting Details */}
          <div className="flex-1 flex flex-col min-w-0">
              {selectedMeeting ? (
                  <>
                  <div className="p-4 border-b border-white/50 shrink-0 flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                          {(selectedMeeting.source === 'google' || addedToCalendarIds.has(selectedMeeting.id)) && <GoogleIcon className="w-6 h-6 shrink-0" title="From Google Calendar" />}
                          {selectedMeeting.title}
                        </h2>
                        <p className="text-sm font-semibold mt-1 text-indigo-600">{selectedMeeting.type}</p>
                      </div>
                      {selectedMeeting.status === 'Sắp diễn ra' && selectedMeeting.source !== 'google' && !addedToCalendarIds.has(selectedMeeting.id) && (
                          <button onClick={() => handleAddToCalendar(selectedMeeting)} className="flex items-center gap-2 py-2 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all transform active:scale-95">
                              <CalendarPlusIcon className="w-5 h-5 text-indigo-600" />
                              <span>{t('addToCalendar')}</span>
                          </button>
                      )}
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                      <div className="flex gap-2">
                          <a href={selectedMeeting.meetLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-br from-green-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all transform hover:scale-105">
                            <VideoIcon className="w-5 h-5" /> <span>Tham gia bằng Google Meet</span>
                          </a>
                          <button onClick={() => copyToClipboard(selectedMeeting.meetLink)} className="p-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-indigo-400" title="Copy Meeting Link">
                              <CopyIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleShare(selectedMeeting)} className="p-3 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-indigo-400 text-indigo-600" title="Chia sẻ liên kết">
                              <ShareIcon className="w-5 h-5" />
                          </button>
                      </div>
                      
                      <div>
                          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Người tham dự ({selectedMeeting.attendees.length})</h3>
                          <div className="flex flex-wrap gap-3">
                              {selectedMeeting.attendees.map(a => (
                                  <div key={a.name} className="flex items-center gap-2 p-2 bg-white/50 rounded-lg" title={a.name}>
                                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                          {a.avatar.startsWith('http') ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover rounded-full" /> : getInitials(a.name)}
                                      </div>
                                      <span className="font-medium text-slate-700 truncate max-w-[100px]">{a.name}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {selectedMeeting.agenda && (
                          <div>
                              <h3 className="font-bold text-slate-700 mb-2">Chương trình họp (Agenda)</h3>
                              <div className="p-3 bg-white/60 rounded-lg border border-slate-300/70 text-slate-800 whitespace-pre-wrap text-sm">
                                  {selectedMeeting.agenda}
                              </div>
                          </div>
                      )}

                      {selectedMeeting.attachments && selectedMeeting.attachments.length > 0 && (
                          <div>
                              <h3 className="font-bold text-slate-700 mb-2">Tài liệu đính kèm</h3>
                              <div className="flex flex-col gap-2">
                                  {selectedMeeting.attachments.map((file, idx) => (
                                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-slate-300/70 hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors">
                                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                                            {file.name.endsWith('.pdf') ? <FilePdfIcon className="w-5 h-5" /> : <FileTextIcon className="w-5 h-5" />}
                                          </div>
                                          <span className="font-medium text-sm text-indigo-700 hover:underline flex-1 truncate">{file.name}</span>
                                          <DownloadIcon className="w-4 h-4 text-slate-400" />
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div>
                          <h3 className="font-bold text-slate-700 mb-2">Ghi chú nhanh</h3>
                          <textarea 
                              defaultValue={selectedMeeting.notes}
                              placeholder="Thêm ghi chú cho cuộc họp..."
                              className="w-full p-3 bg-white/60 rounded-lg border border-slate-300/70 min-h-[80px] focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                      </div>
                      
                      <div className="p-4 bg-indigo-50/50 rounded-lg">
                          <h3 className="font-bold text-slate-700 mb-3">Biên bản họp</h3>
                          <div className="space-y-4 text-sm text-slate-800">
                            <p><strong className="text-slate-600">Nội dung:</strong> {selectedMeeting.minutes.content}</p>
                            {selectedMeeting.minutes.actionItems.length > 0 && (
                                <div>
                                    <strong className="text-slate-600">Giao việc:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        {selectedMeeting.minutes.actionItems.map((item, i) => (
                                            <li key={i}>
                                                {item.task} - <span className="font-semibold">{item.owner}</span> (Deadline: {item.deadline})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="flex justify-end pt-2">
                                <button className="flex items-center gap-2 py-2 px-3 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 shadow-md transition-colors">
                                    <MailIcon className="w-4 h-4" />
                                    <span>Gửi biên bản qua Email</span>
                                </button>
                            </div>
                          </div>
                      </div>

                  </div>
                  </>
              ) : (
                  <div className="flex-1 flex items-center justify-center">
                      <p className="text-slate-500">Chọn một cuộc họp để xem chi tiết</p>
                  </div>
              )}
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

export default MeetingView;
