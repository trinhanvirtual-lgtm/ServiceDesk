
import React from 'react';
import AiAssistantBanner from './AiAssistantBanner';
import { User } from '../App';
import { MicIcon, PaperAirplaneIcon } from './icons';

interface AiAssistantViewProps {
  user: User;
}

const AiAssistantView: React.FC<AiAssistantViewProps> = ({ user }) => {
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
    };

    return (
        <main className="flex-1 flex flex-col bg-white/40 backdrop-blur-xl min-h-0 m-4 rounded-xl shadow-lg overflow-hidden">
            <div className="shrink-0 p-6">
                <AiAssistantBanner />
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-6 pt-0">
                <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
                    {/* Chat Messages Area */}
                    <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-4 -mr-4">
                        {/* AI Welcome Message */}
                        <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">AI</div>
                             <div className="bg-white/60 p-4 rounded-xl rounded-tl-none shadow-sm max-w-lg">
                                <p className="font-semibold text-slate-800">Xin chào, {user.name}!</p>
                                <p className="text-slate-700">Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể yêu cầu tôi tóm tắt email, đọc lịch họp, hoặc tìm kiếm tài liệu.</p>
                             </div>
                        </div>
                        {/* User example message */}
                        <div className="flex items-start gap-4 justify-end">
                             <div className="bg-blue-500 text-white p-4 rounded-xl rounded-tr-none shadow-sm max-w-lg">
                                <p>Đọc giúp tôi các công việc cần làm hôm nay trong Tasklist.</p>
                             </div>
                             <div className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0">{getInitials(user.name)}</div>
                        </div>
                    </div>
                    {/* Input Area */}
                    <div className="mt-6 shrink-0">
                        <div className="relative">
                             <textarea 
                                rows={1} 
                                onInput={handleInput}
                                placeholder="Nhấn 🎙️ để nói hoặc nhập yêu cầu..."
                                className="w-full bg-white/70 border border-slate-300/70 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500 text-slate-800 rounded-xl py-3 pl-12 pr-14 transition-all resize-none overflow-hidden"
                             />
                             <button className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-600 transition-colors" aria-label="Sử dụng giọng nói">
                                <MicIcon className="w-5 h-5"/>
                             </button>
                             <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors" aria-label="Gửi tin nhắn">
                                <PaperAirplaneIcon className="w-5 h-5"/>
                             </button>
                        </div>
                        <p className="text-xs text-center text-slate-500 mt-2">Trợ lý AI có thể mắc lỗi. Hãy xác minh các thông tin quan trọng.</p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default AiAssistantView;
