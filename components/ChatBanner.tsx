import React from 'react';

const AnimatedChatIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 120 100" 
    className="w-24 h-24 drop-shadow-lg"
    aria-hidden="true"
  >
    <style>{`
      .chat-group {
        animation: float 6s ease-in-out infinite;
      }
      .bubble-1 {
        transform-origin: center;
        animation: pulse 4s ease-in-out infinite;
        animation-delay: 1s;
      }
      .typing-dot {
        opacity: 0;
        animation: typing 2.5s ease-in-out infinite;
      }
      .dot-1 { animation-delay: 0s; }
      .dot-2 { animation-delay: 0.3s; }
      .dot-3 { animation-delay: 0.6s; }

      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
        100% { transform: translateY(0px); }
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      @keyframes typing {
        0% { opacity: 0; transform: translateY(0); }
        25% { opacity: 1; transform: translateY(-2px); }
        50% { opacity: 0; transform: translateY(0); }
        100% { opacity: 0; }
      }
    `}</style>
    <g className="chat-group">
      {/* Back bubble */}
      <path className="bubble-1" fill="#fff" opacity="0.8" d="M20,65 Q5,65 5,50 Q5,35 20,35 H60 Q75,35 75,50 Q75,65 60,65 H40 L28,78 L32,65 H20 Z" />
      {/* Front bubble */}
      <g>
        <path fill="#fff" d="M100,45 Q115,45 115,30 Q115,15 100,15 H60 Q45,15 45,30 Q45,45 60,45 H80 L92,58 L88,45 H100 Z" />
        <circle className="typing-dot dot-1" cx="65" cy="30" r="3" fill="#60a5fa" />
        <circle className="typing-dot dot-2" cx="78" cy="30" r="3" fill="#60a5fa" />
        <circle className="typing-dot dot-3" cx="91" cy="30" r="3" fill="#60a5fa" />
      </g>
    </g>
  </svg>
);

const ChatBanner: React.FC = () => {
  return (
    <div className="relative py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-700 text-white overflow-hidden shadow-lg shrink-0">
      <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-white/10 rounded-full opacity-50 z-0" aria-hidden="true"></div>
      <div className="absolute top-2 left-2 w-20 h-20 bg-white/10 rounded-full opacity-50 z-0" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold">Trung tâm Trao đổi</h1>
          <p className="mt-1 text-purple-100 max-w-md italic text-sm">
            “Trao đổi đúng lúc – phản hồi đúng người – lưu đúng nơi.”
          </p>
        </div>
        
        <div className="shrink-0 hidden md:block">
          <AnimatedChatIcon />
        </div>
      </div>
    </div>
  );
};

export default ChatBanner;