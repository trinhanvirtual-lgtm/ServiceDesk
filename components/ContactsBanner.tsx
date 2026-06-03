
import React from 'react';

const AnimatedContactsIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 100"
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .group-float { animation: float 6s ease-in-out infinite; }
            @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
            
            .card-pop { transform-origin: bottom center; animation: pop-up 4s ease-in-out infinite; }
            .card-1 { animation-delay: 0s; }
            .card-2 { animation-delay: 0.2s; }
            .card-3 { animation-delay: 0.4s; }

            @keyframes pop-up {
                0% { transform: translateY(20px) scale(0.8); opacity: 0; }
                25% { transform: translateY(0) scale(1); opacity: 1; }
                75% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(20px) scale(0.8); opacity: 0; }
            }
            .line-draw { stroke-dasharray: 20; stroke-dashoffset: 20; animation: draw 4s ease-in-out infinite; }
            @keyframes draw {
                0% { stroke-dashoffset: 20; }
                25% { stroke-dashoffset: 0; }
                75% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -20; }
            }
        `}</style>
        <g className="group-float">
            {/* Lines connecting cards */}
            <path className="line-draw" d="M60 40 V 55" stroke="#a78bfa" strokeWidth="2" />
            <path className="line-draw" style={{animationDelay: '0.2s'}} d="M40 75 H 80" stroke="#a78bfa" strokeWidth="2" />
            
            {/* Top Card (Manager) */}
            <g className="card-pop card-1">
                <rect x="45" y="20" width="30" height="20" rx="3" fill="#fff" />
                <circle cx="60" cy="30" r="4" fill="#c4b5fd" />
            </g>
            
            {/* Bottom Left Card */}
             <g className="card-pop card-2">
                <rect x="25" y="65" width="30" height="20" rx="3" fill="#fff" />
                <circle cx="40" cy="75" r="4" fill="#c4b5fd" />
            </g>

            {/* Bottom Right Card */}
            <g className="card-pop card-3">
                <rect x="65" y="65" width="30" height="20" rx="3" fill="#fff" />
                <circle cx="80" cy="75" r="4" fill="#c4b5fd" />
            </g>
        </g>
    </svg>
);

const ContactsBanner: React.FC = () => {
    return (
        <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-700 text-white overflow-hidden shadow-sm">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">Danh bạ & Sơ đồ tổ chức</h1>
                    <p className="mt-2 text-fuchsia-100 max-w-lg italic">
                        “Kết nối mọi người, định hình cấu trúc, vận hành trơn tru.”
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedContactsIcon />
                </div>
            </div>
        </div>
    );
};

export default ContactsBanner;
