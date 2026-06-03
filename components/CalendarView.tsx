import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, PlusIcon, SyncIcon, CheckCircleIcon, VideoIcon, CalendarIcon } from './icons';
import { useLanguage } from './LanguageContext';
import CalendarBanner from './CalendarBanner';
import MeetingView, { initialMeetings, Meeting } from './MeetingView';
import { User, RecentItem } from '../App';
import { mockTaskLists } from './TasklistView';
import { MapPin, Video as LucideVideo, Users as LucideUsers, List as LucideList, FileText, ExternalLink } from 'lucide-react';

export interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    color: 'blue' | 'orange' | 'red' | 'green';
    isGoogleEvent?: boolean;
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    guests?: string[];
    listId?: string;
    locationType?: 'offline' | 'online';
    meetingRoom?: string;
    onlineLink?: string;
    onlineNotes?: string;
}

export const mockEvents: CalendarEvent[] = [
    { id: 'evt1', date: new Date(new Date().getFullYear(), new Date().getMonth(), 8), title: 'Project Alpha Kick-off', startTime: '09:00', endTime: '10:00', color: 'blue' },
    { id: 'evt2', date: new Date(new Date().getFullYear(), new Date().getMonth(), 8), title: 'Review OKR Q3', startTime: '14:00', endTime: '15:00', color: 'orange' },
    { id: 'evt3', date: new Date(new Date().getFullYear(), new Date().getMonth(), 15), title: 'HR Training Session', startTime: '10:00', endTime: '12:00', color: 'red' },
    { id: 'evt4', date: new Date(new Date().getFullYear(), new Date().getMonth(), 22), title: 'Design Sprint Week', startTime: '09:00', endTime: '17:00', color: 'blue' },
    { id: 'evt5', date: new Date(new Date().getFullYear(), new Date().getMonth(), 23), title: 'Team Building Event', startTime: '13:00', endTime: '18:00', color: 'red' },
];


interface CalendarViewProps {
    user: User;
    events: CalendarEvent[];
    onSaveEvent: (event: Omit<CalendarEvent, 'id' | 'color'> & { id?: string; color?: CalendarEvent['color'] }) => void;
    onEditEvent: (event: CalendarEvent) => void;
    onOpenModal: () => void;
    onItemViewed: (item: RecentItem) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ user, events, onSaveEvent, onEditEvent, onOpenModal, onItemViewed }) => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'meetings'>('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
    const { language, t } = useLanguage();

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const placeholderDays = Array.from({ length: startDayOfWeek });

    const getWeekDays = () => {
        const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
        return Array.from(Array(7).keys()).map(day => 
            formatter.format(new Date(Date.UTC(2021, 5, day)))
        );
    }
    const weekDays = getWeekDays();

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
        setExpandedDays(new Set()); // Reset expanded days on month change
    };
    
    const handleDayClick = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const toggleExpandDay = (e: React.MouseEvent, day: number) => {
        e.stopPropagation();
        setExpandedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(day)) {
                newSet.delete(day);
            } else {
                newSet.add(day);
            }
            return newSet;
        });
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage('Đang đồng bộ cuộc họp...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        // Sync Meetings from Meeting Module
        const meetingTypeToColor: Record<Meeting['type'], CalendarEvent['color']> = {
            'Giao ban': 'orange',
            'Đối tác / khách hàng': 'green',
            'Nội bộ': 'blue',
            'Phỏng vấn': 'red',
        };

        initialMeetings.forEach(meeting => {
            if (meeting.status === 'Sắp diễn ra') {
                 // Using title and date to check for duplicates as ID isn't on the final event object
                const eventExists = events.some(e => e.title === `[Họp] ${meeting.title}` && e.date.getTime() === meeting.date.getTime());
                if (!eventExists) {
                    const newMeetingEvent = {
                        date: meeting.date,
                        title: `[Họp] ${meeting.title}`,
                        startTime: meeting.startTime,
                        endTime: meeting.endTime,
                        color: meetingTypeToColor[meeting.type] || 'blue',
                    };
                    onSaveEvent(newMeetingEvent);
                }
            }
        });


        setIsSyncing(false);
        setSyncMessage('Đồng bộ cuộc họp thành công!');
        setTimeout(() => setSyncMessage(''), 3000);
    };

    const doesEventOccurOnDate = (event: CalendarEvent, targetDate: Date) => {
        const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
        const queryDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        
        if (queryDate < eventDate) return false;

        if (!event.recurrence || event.recurrence === 'none') {
            return queryDate.getTime() === eventDate.getTime();
        }
        if (event.recurrence === 'daily') {
            return true;
        }
        if (event.recurrence === 'weekly') {
            return queryDate.getDay() === eventDate.getDay();
        }
        if (event.recurrence === 'monthly') {
            return queryDate.getDate() === eventDate.getDate();
        }
        if (event.recurrence === 'yearly') {
            return queryDate.getDate() === eventDate.getDate() && queryDate.getMonth() === eventDate.getMonth();
        }
        return false;
    };

    const eventsForSelectedDay = useMemo(() => {
        return events
            .filter(e => doesEventOccurOnDate(e, selectedDate))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [events, selectedDate]);

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                <div className="shrink-0 flex flex-col gap-4">
                    <CalendarBanner />
                    <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl shadow-sm border border-white/50 self-start">
                        <button 
                            onClick={() => setActiveTab('calendar')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <CalendarIcon className="w-5 h-5" />
                            <span>Lịch biểu</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('meetings')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'meetings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <VideoIcon className="w-5 h-5" />
                            <span>Cuộc hẹn</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'meetings' ? (
                    <div className="flex-1 min-h-0 bg-transparent">
                        <MeetingView user={user} onItemViewed={onItemViewed} isEmbedded={true} />
                    </div>
                ) : (
                <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex flex-col lg:flex-row min-h-0">
                    {/* Main Calendar View */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-white/50 shrink-0 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-4">
                                <h1 className="text-xl font-bold text-slate-800">
                                    {currentDate.toLocaleString(language, { month: 'long' })} {currentDate.getFullYear()}
                                </h1>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-md hover:bg-white/60"><ChevronLeftIcon className="w-5 h-5 text-slate-600" /></button>
                                    <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-white/60 text-slate-700">{t('today')}</button>
                                    <button onClick={() => changeMonth(1)} className="p-1.5 rounded-md hover:bg-white/60"><ChevronLeftIcon className="w-5 h-5 text-slate-600 rotate-180" /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                               {syncMessage && (
                                   <div className="text-sm font-semibold text-emerald-700 bg-emerald-100/90 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm border border-emerald-200">
                                       <CheckCircleIcon className="w-4 h-4" />
                                       {syncMessage}
                                   </div>
                               )}
                                <button onClick={handleSync} disabled={isSyncing} title="Đồng bộ cuộc họp" className="flex items-center gap-2 py-2 px-4 rounded-lg bg-white/70 text-indigo-700 font-bold shadow-md hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-wait">
                                    <SyncIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">Đồng bộ cuộc họp</span>
                                </button>
                                <button onClick={onOpenModal} className="flex items-center gap-2 py-2 px-4 bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/40 transition-all transform hover:scale-[1.02] active:scale-95">
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">{t('createEvent')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-2 lg:p-4 overflow-auto no-scrollbar">
                            <div className="grid grid-cols-7 gap-px bg-slate-200/80 ring-1 ring-slate-200/80">
                                {weekDays.map(day => (
                                    <div key={day} className="text-center py-2 text-xs lg:text-sm font-semibold text-slate-600 bg-white/40">{day}</div>
                                ))}
                                {placeholderDays.map((_, i) => <div key={`p-${i}`} className="bg-slate-100/30 min-h-[80px] lg:min-h-[120px]"></div>)}
                                {monthDays.map(day => {
                                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    const isSelected = selectedDate.toDateString() === date.toDateString();
                                    const dailyEvents = events.filter(e => doesEventOccurOnDate(e, date));
                                    const isExpanded = expandedDays.has(day);
                                    return (
                                        <button key={day} onClick={() => handleDayClick(day)} className={`bg-white/40 p-2 min-h-[80px] lg:min-h-[120px] flex flex-col gap-1 relative text-left transition-colors ${isSelected ? 'bg-blue-100/50' : 'hover:bg-white/80'}`}>
                                            <span className={`font-semibold text-sm self-start ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-800'}`}>{day}</span>
                                            <div className="hidden lg:flex flex-col gap-1 overflow-hidden">
                                            {dailyEvents.slice(0, isExpanded ? dailyEvents.length : 3).map((event, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                                                    className={`p-1 rounded-md text-xs font-semibold text-white truncate cursor-pointer bg-${event.color}-500 hover:brightness-110 active:scale-95 transition-all`} 
                                                    title={event.title}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dailyEvents.length > 3 && (
                                                <button onClick={(e) => toggleExpandDay(e, day)} className="text-xs text-slate-500 hover:text-slate-700 font-semibold mt-1 text-left">
                                                    {isExpanded ? (t('showLess') || 'Thu gọn') : `+ ${dailyEvents.length - 3} more`}
                                                </button>
                                            )}
                                            </div>
                                            <div className="lg:hidden flex flex-wrap gap-1 mt-1">
                                                {dailyEvents.slice(0,4).map(event => (
                                                    <div key={event.id} className={`w-2 h-2 rounded-full bg-${event.color}-500`}></div>
                                                ))}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Details Pane */}
                    <div className="w-full lg:w-1/3 lg:max-w-sm border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-850 flex flex-col shrink-0 bg-white/20 dark:bg-slate-900/10">
                         <div className="p-4 border-b border-slate-200 dark:border-slate-850">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{t('eventsOn')} {selectedDate.toLocaleDateString(language, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                         </div>
                         <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                            {eventsForSelectedDay.length > 0 ? (
                                 <div className="space-y-3">
                                    {eventsForSelectedDay.map(event => {
                                        const matchedList = mockTaskLists.find(l => l.id === event.listId);
                                        return (
                                            <div 
                                                key={event.id} 
                                                onClick={() => onEditEvent(event)}
                                                className="p-4 bg-white/80 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-850 rounded-xl flex flex-col gap-2.5 cursor-pointer hover:bg-white dark:hover:bg-slate-950 hover:shadow-md transition-all duration-150 active:scale-[0.98]"
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <div className={`mt-1.5 w-2 h-2 rounded-full bg-${event.color}-500 shrink-0`}></div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-slate-800 dark:text-white leading-snug">{event.title}</p>
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{event.startTime} - {event.endTime}</p>
                                                    </div>
                                                </div>

                                                {/* Assigned list indicator */}
                                                {matchedList && (
                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md self-start">
                                                        <LucideList className="w-3 h-3" />
                                                        <span>List: {matchedList.name}</span>
                                                    </div>
                                                )}

                                                {/* Conditional Location Details Rendering */}
                                                {event.locationType === 'online' ? (
                                                    <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 rounded-lg space-y-1">
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                                            <LucideVideo className="w-3.5 h-3.5" />
                                                            <span>Trực tuyến (Online)</span>
                                                        </div>
                                                        <a 
                                                            href={event.onlineLink} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono truncate"
                                                        >
                                                            <span className="truncate">{event.onlineLink || 'https://meet.google.com/abc-defg-hij'}</span>
                                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                                        </a>
                                                        {event.onlineNotes && (
                                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 flex gap-1 mt-1 font-medium italic">
                                                                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                                                <span>{event.onlineNotes}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    event.locationType === 'offline' && (
                                                        <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 rounded-lg space-y-0.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                <span>Trực tiếp tại phòng họp</span>
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                {event.meetingRoom || 'Phòng họp Alpha (Tầng 1)'}
                                                            </div>
                                                        </div>
                                                    )
                                                )}

                                                {/* Invited guests display block */}
                                                {event.guests && event.guests.length > 0 && (
                                                    <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <LucideUsers className="w-3 h-3" />
                                                            <span>Khách mời ({event.guests.length})</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {event.guests.map((g, gi) => (
                                                                <span 
                                                                    key={gi} 
                                                                    className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200/40 dark:border-slate-750"
                                                                >
                                                                    {g}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* General details note if description exits */}
                                                {event.description && (
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1 line-clamp-2">
                                                        {event.description}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center py-10">
                                    <p className="text-sm font-medium">{t('noEventsScheduled')}</p>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
                )}
            </div>
        </main>
    );
};

export default CalendarView;