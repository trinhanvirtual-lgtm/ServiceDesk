import React from 'react';

const CalendarIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    className="w-12 h-12 drop-shadow-lg"
    aria-hidden="true"
  >
    <style>
      {`
        .calendar-main {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(0, -8px); }
          100% { transform: translate(0, 0); }
        }
        .calendar-highlight {
          animation: sparkle 6s ease-in-out infinite;
          animation-delay: 1.5s;
          opacity: 0;
          transform-origin: center;
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          25% { opacity: 0.7; transform: scale(1) rotate(15deg); }
          50% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          100% { opacity: 0; }
        }
      `}
    </style>
    <g className="calendar-main">
      <rect x="10" y="20" width="80" height="70" rx="8" fill="#fff" />
      <rect x="10" y="20" width="80" height="20" rx="8" fill="#f87171" />
      <text 
        x="50" y="68" 
        fontFamily="sans-serif" 
        fontSize="36" 
        fill="#374151" 
        fontWeight="bold" 
        textAnchor="middle"
      >
        25
      </text>
      <circle cx="35" cy="18" r="4" fill="#fecaca" />
      <circle cx="65" cy="18" r="4" fill="#fecaca" />
    </g>
    <path className="calendar-highlight" fill="#fff" d="M80 25 L85 30 L80 35 L75 30 Z" />
  </svg>
);


const CalendarBanner: React.FC = () => {
  return (
    <div className="relative py-1.5 px-4 sm:py-2.5 sm:px-6 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 text-white overflow-hidden shadow-lg w-full">
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full opacity-50 z-0" aria-hidden="true"></div>
      <div className="absolute top-4 -right-12 w-24 h-24 bg-white/10 rounded-lg opacity-50 z-0 rotate-45" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="text-center sm:text-left">
          <h1 className="text-lg sm:text-xl font-bold">Lịch</h1>
          <p className="mt-0.5 text-xs text-indigo-100 max-w-md italic">
            “Lịch là bản đồ của hành động – gắn liền mọi hoạt động, không bỏ sót một giờ nào.”
          </p>
        </div>
        
        <div className="shrink-0 hidden md:block">
          <CalendarIcon />
        </div>
      </div>
    </div>
  );
};

export default CalendarBanner;
