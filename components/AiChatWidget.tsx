import React, { useState, useEffect, useRef } from 'react';
import { User } from '../App';
import { MicIcon, PaperAirplaneIcon, XIcon } from './icons';
import { GoogleGenAI } from '@google/genai';
import { mockTaskLists } from './TasklistView';
import { mockEmails } from './EmailClient';
import { mockEvents } from './CalendarView';
import { mockNotes } from './NotesView';
import { initialContacts } from './ContactsView';
// [FIX] Corrected import from MeetingView. It exports 'initialMeetings', not 'mockMeetings'.
import { initialMeetings as mockMeetings } from './MeetingView';
import { db } from '../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

// Interface for chat messages
interface Message {
  author: 'ai' | 'user';
  text: string;
}

// Builds a context string and system instruction addon based on keywords in the user's input.
const buildContextPrompt = async (userInput: string): Promise<{ context: string; systemInstructionAddon: string }> => {
    let context = '';
    const addons: string[] = [];
    
    // Task context
    if (/tác vụ|task|công việc|việc cần làm/i.test(userInput)) {
        const pendingTasks = mockTaskLists.flatMap(list =>
            list.tasks.filter(task => !task.completed).map(task => ({
                task: task.text,
                list: list.name,
                notes: task.notes,
                dueDate: task.dueDate
            }))
        );
        if (pendingTasks.length > 0) {
            context += `\n\nTask Data: ${JSON.stringify(pendingTasks)}`;
            addons.push('tasks');
        }
    }

    // Projects context
    if (/dự án|project/i.test(userInput)) {
        try {
            const projectsSnapshot = await getDocs(collection(db, 'projects'));
            const projects: Record<string, unknown>[] = [];
            projectsSnapshot.forEach(doc => projects.push(doc.data()));
            if (projects.length > 0) {
                context += `\n\nProjects Data: ${JSON.stringify(projects)}`;
                addons.push('projects');
            }
        } catch (e) {
            console.error("Error fetching projects for AI context:", e);
        }
    }

    // Website context
    if (/trang web|website|page|cài đặt website/i.test(userInput)) {
        try {
            const pagesSnapshot = await getDocs(collection(db, 'pages'));
            const pages: Record<string, unknown>[] = [];
            pagesSnapshot.forEach(doc => pages.push(doc.data()));
            if (pages.length > 0) {
                context += `\n\nWebsite Pages Data: ${JSON.stringify(pages)}`;
                addons.push('website pages');
            }
        } catch (e) {
            console.error("Error fetching pages for AI context:", e);
        }
    }

    // Email context
    if (/email|thư|hộp thư/i.test(userInput)) {
        const unreadEmails = mockEmails.filter(e => !e.read).map(e => ({ from: e.sender.name, subject: e.subject, snippet: e.snippet }));
        if (unreadEmails.length > 0) {
            context += `\n\nUnread Email Data: ${JSON.stringify(unreadEmails)}`;
            addons.push('emails');
        }
    }

    // Calendar context
    if (/lịch|sự kiện|calendar|event/i.test(userInput)) {
        const relevantEvents = mockEvents; // Simple logic for demo, providing all events
        if (relevantEvents.length > 0) {
            context += `\n\nCalendar Events Data: ${JSON.stringify(relevantEvents)}`;
            addons.push('calendar events');
        }
    }

    // Meeting context
    if (/họp|meeting|cuộc họp/i.test(userInput)) {
        const upcomingMeetings = mockMeetings.filter(m => m.status === 'Sắp diễn ra');
        if (upcomingMeetings.length > 0) {
            context += `\n\nUpcoming Meetings Data: ${JSON.stringify(upcomingMeetings)}`;
            addons.push('meetings');
        }
    }

    // Contacts context
    if (/danh bạ|contact|liên hệ|ai là/i.test(userInput)) {
        const contacts = initialContacts.map(c => ({ name: c.name, title: c.title, email: c.email, department: c.department }));
        context += `\n\nContacts Data: ${JSON.stringify(contacts)}`;
        addons.push('contacts');
    }
    
    // Newsfeed/Blog context
    if (/bảng tin|bài viết|news|blog|post/i.test(userInput)) {
        try {
            const postsSnapshot = await getDocs(query(collection(db, 'posts'), limit(10)));
            const posts: unknown[] = [];
            postsSnapshot.forEach(doc => {
                const data = doc.data();
                posts.push({ author: data.author?.name || 'Anonymous', content_preview: data.content?.substring(0, 50) + '...', type: data.type });
            });
            if (posts.length > 0) {
                context += `\n\nNewsfeed Posts Data: ${JSON.stringify(posts)}`;
                addons.push('newsfeed posts');
            }
        } catch (e) {
            console.error("Error fetching posts for AI context:", e);
        }
    }

    // Notes context
    if (/ghi chú|note/i.test(userInput)) {
        const notes = mockNotes.map(n => ({ title: n.title, content: n.content?.substring(0,50), checklist: n.checklist }));
        context += `\n\nNotes Data: ${JSON.stringify(notes)}`;
        addons.push('notes');
    }

    let systemInstructionAddon = '';
    if (addons.length > 0) {
        systemInstructionAddon = ` You can also answer questions about ${addons.join(', ')}. Use the provided JSON data to answer user questions.`;
    }

    return { context: context.trim(), systemInstructionAddon };
};


// Loading bubble component
const LoadingBubble = () => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">AI</div>
        <div className="bg-[--color-surface-secondary] p-4 rounded-xl rounded-tl-none shadow-sm">
            <div className="flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 bg-[--color-text-subtle] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-[--color-text-subtle] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-[--color-text-subtle] rounded-full animate-bounce"></span>
            </div>
        </div>
    </div>
);

interface AiChatWidgetProps {
  user: User;
  onClose: () => void;
  isRightSidebarOpen?: boolean;
}

const AiChatWidget: React.FC<AiChatWidgetProps> = ({ user, onClose, isRightSidebarOpen }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const speak = (text: string) => {
        const isSpeechEnabled = localStorage.getItem('aiSpeechEnabled') !== 'false';
        if (!isSpeechEnabled || !window.speechSynthesis) return;

        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const isRobotEffectEnabled = localStorage.getItem('aiRobotEffectEnabled') === 'true';
        const selectedVoiceURI = localStorage.getItem('selectedVoiceURI');
        const availableVoices = window.speechSynthesis.getVoices();
        const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            // Fallback logic to find the best Vietnamese voice, prioritizing Nam Minh
            const namMinhVoice = availableVoices.find(v => v.name === 'Nam Minh' && v.lang === 'vi-VN');
            const googleVietnameseVoice = availableVoices.find(v => v.lang === 'vi-VN' && v.name.includes('Google'));
            const anyVietnameseVoice = availableVoices.find(v => v.lang === 'vi-VN');
            
            const fallbackVoice = namMinhVoice || googleVietnameseVoice || anyVietnameseVoice;

            if (fallbackVoice) {
                utterance.voice = fallbackVoice;
                utterance.lang = fallbackVoice.lang;
            } else {
                utterance.lang = 'vi-VN'; // Final fallback
            }
        }
        
        if (isRobotEffectEnabled) {
            utterance.pitch = 0.5;
            utterance.rate = 0.8;
        } else {
            utterance.pitch = 1;
            utterance.rate = 1;
        }

        speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        const welcomeText = `Xin chào ${user.name}! Tôi là trợ lý ảo POW-AI. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi về công việc, email, lịch, cuộc họp, và nhiều hơn nữa. Hãy thử hỏi "có cuộc họp nào hôm nay không?"`;
        const initialMessage: Message = { author: 'ai', text: welcomeText };
        setMessages([initialMessage]);

        const speakTimer = setTimeout(() => speak(welcomeText), 500);

        return () => {
            clearTimeout(speakTimer);
            speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        setInput(target.value);
        target.style.height = 'auto';
        target.style.height = `${Math.min(target.scrollHeight, 128)}px`; // Limit max height
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentInput = input;
        if (!currentInput.trim() || isLoading) return;

        const userMessage: Message = { author: 'user', text: currentInput };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        setIsLoading(true);

        try {
            const { context, systemInstructionAddon } = await buildContextPrompt(currentInput);

            const systemInstruction = `You are a helpful and friendly AI assistant integrated into a project management dashboard named 'POW'. Your name is POW-AI. You are speaking to ${user.name}.${systemInstructionAddon} Respond in a clear, concise, and professional manner, using Markdown for formatting if needed (like lists). Always respond in Vietnamese. Today's date is ${new Date().toLocaleDateString('vi-VN')}.`;
            
            const prompt = `Based on the following data, answer the user's question.\nData: ${context || 'No specific data provided for this query.'}\nUser question: "${currentInput}"`;
            
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }

            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: context ? prompt : currentInput, // if no context, just send plain input
                config: {
                    systemInstruction: systemInstruction,
                }
            });

            const aiText = response.text;
            const aiMessage: Message = { author: 'ai', text: aiText };
            setMessages(prev => [...prev, aiMessage]);
            speak(aiText);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessageText = error instanceof Error && error.message.includes("API key") 
                ? 'Xin lỗi, API key chưa được cấu hình. Vui lòng liên hệ quản trị viên.'
                : 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.';
            const errorMessage: Message = { author: 'ai', text: errorMessageText };
            setMessages(prev => [...prev, errorMessage]);
            speak(errorMessage.text);
        } finally {
            setIsLoading(false);
            // After submitting, reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };


    return (
        <div className={`fixed top-[144px] ${isRightSidebarOpen ? 'right-4 md:right-[340px]' : 'right-4 md:right-[100px]'} w-full max-w-sm sm:max-w-md h-[calc(100vh-168px)] max-h-[550px] bg-[--color-surface-primary] backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in-up transition-all duration-300`}>
            <header className="p-4 border-b border-[--color-border-secondary] flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-[--color-text-primary]">Trợ lý ảo AI</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary]" aria-label="Close">
                    <XIcon className="w-5 h-5"/>
                </button>
            </header>
            
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-4">
                <div className="flex-1 space-y-6">
                    {messages.map((msg, index) => (
                        msg.author === 'ai' ? (
                            <div key={index} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">AI</div>
                                <div className="bg-[--color-surface-secondary] p-4 rounded-xl rounded-tl-none shadow-sm max-w-lg">
                                    <p className="text-[--color-text-secondary] whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ) : (
                            <div key={index} className="flex items-start gap-4 justify-end">
                                <div className="bg-[--color-accent-500] text-white p-4 rounded-xl rounded-tr-none shadow-sm max-w-lg">
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[--color-accent-500] text-white flex items-center justify-center font-bold text-sm shrink-0">{getInitials(user.name)}</div>
                            </div>
                        )
                    ))}
                    {isLoading && <LoadingBubble />}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 mt-auto border-t border-[--color-border-secondary] shrink-0">
                <div className="relative">
                     <textarea 
                        ref={textareaRef}
                        rows={1} 
                        value={input}
                        onChange={handleInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder="Nhấn 🎙️ để nói hoặc nhập..."
                        className="w-full bg-[--color-surface-secondary] border border-[--color-border-secondary] focus:bg-[--color-surface-solid] focus:border-[--color-accent-500] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none placeholder:text-[--color-text-subtle] text-[--color-text-primary] rounded-xl py-3 pl-12 pr-14 transition-all resize-none overflow-y-auto"
                        style={{maxHeight: '128px'}}
                     />
                     <button type="button" className="absolute left-3 top-3.5 p-2 text-[--color-text-subtle] hover:text-[--color-accent-600] transition-colors" aria-label="Sử dụng giọng nói">
                        <MicIcon className="w-5 h-5"/>
                     </button>
                     <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-3 bottom-3 p-2 text-white bg-[--color-accent-600] rounded-full hover:bg-[--color-accent-700] transition-colors disabled:bg-opacity-50 disabled:cursor-not-allowed" aria-label="Gửi tin nhắn">
                        <PaperAirplaneIcon className="w-5 h-5"/>
                     </button>
                </div>
            </form>
        </div>
    );
};

export default AiChatWidget;