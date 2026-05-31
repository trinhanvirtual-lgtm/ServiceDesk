
import React from 'react';

const AnimatedMeetingIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .group-float {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .cam-pulse {
                animation: pulse 3s ease-in-out infinite;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            .line-draw {
                stroke-dasharray: 40;
                stroke-dashoffset: 40;
                animation: draw-line 5s ease-in-out infinite;
            }
            @keyframes draw-line {
                0% { stroke-dashoffset: 40; }
                30% { stroke-dashoffset: 0; }
                70% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -40; }
            }
        `}</style>
        <g className="group-float">
            {/* Calendar base */}
            <path d="M20,20 h80 a5,5 0 0 1 5,5 v55 a5,5 0 0 1 -5,5 h-80 a5,5 0 0 1 -5,-5 v-55 a5,5 0 0 1 5,-5 Z" fill="#fff" />
            <path d="M15,35 h90" stroke="#e9d5ff" strokeWidth="2" />
            <circle cx="30" cy="28" r="3" fill="#c084fc" />
            <circle cx="45" cy="28" r="3" fill="#c084fc" />
            
            {/* Calendar content */}
            <line className="line-draw" x1="30" y1="50" x2="75" y2="50" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
            <rect x="30" y="65" width="30" height="8" rx="2" fill="#e9d5ff" />

            {/* Video Camera */}
            <g className="cam-pulse" transform="translate(65, 55)">
                <path d="m15 13-7 4 7 4v-8Z" fill="#a855f7" />
                <rect x="-10" y="8" width="22" height="14" rx="2" fill="#c084fc" />
            </g>
        </g>
    </svg>
);

const MeetingBanner: React.FC = () => {
    return (
        <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-700 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">Quản lý Cuộc họp</h1>
                    <p className="mt-2 text-indigo-100 max-w-lg italic">
                        “Họp thông minh – Kết nối liền mạch – Quản trị hiệu quả”
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedMeetingIcon />
                </div>
            </div>
        </div>
    );
};

export default MeetingBanner;
