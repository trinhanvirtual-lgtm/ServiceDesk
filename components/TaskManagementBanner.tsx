
import React from 'react';

const AnimatedTaskManagementIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-12 h-12 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .icon-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .target-ring {
                transform-origin: 50% 70%;
                animation: pulse 4s ease-in-out infinite alternate;
            }
            .folder-paper {
                transform-origin: 50% 100%;
                animation: paper-peek 4s ease-in-out infinite;
            }
            @keyframes paper-peek {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            .check {
                stroke-dasharray: 20;
                stroke-dashoffset: 20;
                animation: draw-check 4s ease-in-out infinite;
                animation-delay: 1s;
            }
            @keyframes draw-check {
                0% { stroke-dashoffset: 20; }
                25% { stroke-dashoffset: 0; }
                75% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -20; }
            }
        `}</style>
        <g className="icon-group">
            {/* Target in the back */}
            <circle className="target-ring" cx="60" cy="70" r="30" fill="#a78bfa" opacity="0.5" />
            <circle className="target-ring" style={{animationDelay: '0.2s'}} cx="60" cy="70" r="20" fill="#c4b5fd" opacity="0.7" />
            <circle cx="60" cy="70" r="8" fill="#ede9fe" />

            {/* Folder in the middle */}
            <g transform="translate(10, 15)">
                <path d="M5 20 H50 L55 30 H95 V80 H5Z" fill="#7dd3fc" />
                <rect className="folder-paper" x="25" y="15" width="50" height="40" rx="3" fill="#e0f2fe" />
            </g>

            {/* Task list in front */}
            <g transform="translate(5, 5)">
                <rect x="15" y="10" width="40" height="50" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="22" y1="22" x2="45" y2="22" stroke="#94a3b8" strokeWidth="2" />
                <path className="check" d="M22 18 l-3 3 l-3-3" fill="none" stroke="#34d399" strokeWidth="2.5" transform="translate(15, 22)" />
                <line x1="22" y1="32" x2="45" y2="32" stroke="#94a3b8" strokeWidth="2" />
                <rect x="22" y="40" width="23" height="4" fill="#cbd5e1" />
            </g>
        </g>
    </svg>
);

const TaskManagementBanner: React.FC = () => {
    return (
        <div className="relative py-1.5 px-4 sm:py-2.5 sm:px-6 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-16 h-16 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-center sm:text-left">
                    <h1 className="text-lg sm:text-xl font-bold">Quản lý Công việc</h1>
                    <p className="mt-0.5 text-xs text-fuchsia-100 max-w-lg italic">
                        “Một task – mọi thông tin – không bị rơi rụng, không cần nhớ ngoài đầu.”
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedTaskManagementIcon />
                </div>
            </div>
        </div>
    );
};

export default TaskManagementBanner;
