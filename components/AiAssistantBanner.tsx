
import React from 'react';

const AnimatedAiIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .brain-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .brain-path {
                animation: pulse 4s ease-in-out infinite;
                stroke-dasharray: 10;
                stroke-dashoffset: 0;
            }
            @keyframes pulse {
                 0%, 100% { stroke-dashoffset: 0; }
                 50% { stroke-dashoffset: 20; }
            }
            .spark {
                animation: sparkle 3s ease-in-out infinite;
                opacity: 0;
            }
            .spark-1 { animation-delay: 0s; }
            .spark-2 { animation-delay: 1s; }
            .spark-3 { animation-delay: 2s; }

            @keyframes sparkle {
                0% { opacity: 0; transform: scale(0.5); }
                25% { opacity: 1; transform: scale(1.2); }
                50% { opacity: 0; transform: scale(0.5); }
                100% { opacity: 0; }
            }
        `}</style>
        <g className="brain-group">
            {/* Brain Outline */}
            <path className="brain-path" d="M50 20 C 20 20, 20 60, 50 60 C 50 70, 30 80, 50 90 C 70 80, 50 70, 50 60 C 80 60, 80 20, 50 20 Z M70 20 C 100 20, 100 60, 70 60 C 70 70, 90 80, 70 90 C 50 80, 70 70, 70 60 C 40 60, 40 20, 70 20 Z" fill="none" stroke="#a78bfa" strokeWidth="2" />
            
            {/* Sparks */}
            <circle className="spark spark-1" cx="35" cy="45" r="4" fill="#f0abfc" />
            <circle className="spark spark-2" cx="85" cy="45" r="4" fill="#f0abfc" />
            <circle className="spark spark-3" cx="60" cy="70" r="5" fill="#c4b5fd" />
        </g>
    </svg>
);


const AiAssistantBanner: React.FC = () => {
  return (
    <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-800 text-white overflow-hidden shadow-lg">
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full z-0" aria-hidden="true"></div>
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">Trợ lý ảo AI</h1>
          <p className="mt-2 text-purple-200 max-w-lg italic">
            "Giao tiếp thông minh. Hiểu ý. Làm nhanh."
          </p>
        </div>
        
        <div className="shrink-0 hidden md:block">
          <AnimatedAiIcon />
        </div>
      </div>
    </div>
  );
};

export default AiAssistantBanner;
