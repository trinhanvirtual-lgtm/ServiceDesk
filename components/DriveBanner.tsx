
import React from 'react';

const AnimatedDriveIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .cloud-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .file-icon {
                transform-origin: 50% 50%;
                opacity: 0;
            }
            .file-1 {
                animation: file-fly-in 5s ease-out infinite;
                animation-delay: 0s;
            }
            .file-2 {
                 animation: file-fly-in 5s ease-out infinite;
                animation-delay: 1s;
            }
             .file-3 {
                 animation: file-fly-out 5s ease-in infinite;
                animation-delay: 2.5s;
            }
            @keyframes file-fly-in {
                0% { transform: translate(-30px, 10px) scale(0.5); opacity: 0; }
                20% { transform: translate(0px, 0px) scale(1); opacity: 1; }
                80% { transform: translate(0px, 0px) scale(1); opacity: 1; }
                100% { transform: translate(0px, 0px) scale(1); opacity: 0; }
            }
            @keyframes file-fly-out {
                 0% { transform: translate(0px, 0px) scale(1); opacity: 1; }
                20% { transform: translate(30px, -10px) scale(0.5); opacity: 0; }
                100% { transform: translate(30px, -10px) scale(0.5); opacity: 0; }
            }
        `}</style>
        <g className="cloud-group">
            {/* Cloud shape */}
            <path d="M 60,30 C 40,30 40,50 60,50 L 90,50 C 100,50 100,40 90,40 C 90,25 75,25 75,40" fill="#fff" transform="translate(-15, 15)" />
            <path d="M 60,30 C 40,30 40,50 60,50 L 90,50 C 100,50 100,40 90,40 C 90,25 75,25 75,40" fill="#60a5fa" opacity="0.5" transform="translate(-10, 20)" />

            {/* Animated Files */}
            <g transform="translate(45, 45)">
                <rect className="file-icon file-1" x="0" y="0" width="15" height="20" rx="2" fill="#34d399" />
                <rect className="file-icon file-2" x="5" y="-5" width="15" height="20" rx="2" fill="#facc15" />
                <rect className="file-icon file-3" x="-5" y="5" width="15" height="20" rx="2" fill="#f87171" />
            </g>
        </g>
    </svg>
);


const DriveBanner: React.FC = () => {
    return (
        <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-700 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">Kho lưu trữ tập trung</h1>
                    <p className="mt-2 text-sky-100 max-w-lg italic">
                        “Mọi tập tin – Một nơi – Mọi lúc – Một kết nối”
                    </p>
                </div>
        
                <div className="shrink-0 hidden md:block">
                    <AnimatedDriveIcon />
                </div>
            </div>
        </div>
    );
};

export default DriveBanner;
