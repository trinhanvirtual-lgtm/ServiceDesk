
import React from 'react';

const AnimatedNewsfeedIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-20 h-20 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .feed-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-6px); }
                100% { transform: translateY(0px); }
            }
            .reaction-icon {
                opacity: 0;
                transform-origin: center;
                animation: pop-in 4s ease-in-out infinite;
            }
            .like { animation-delay: 0.5s; }
            .heart { animation-delay: 1.5s; }
            .post-card {
                 animation: pulse 4s ease-in-out infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            
            @keyframes pop-in {
                0% { transform: scale(0.5); opacity: 0; }
                25% { transform: scale(1.1); opacity: 1; }
                50% { transform: scale(1); opacity: 1; }
                75% { transform: scale(1); opacity: 0; }
                100% { opacity: 0; }
            }
        `}</style>
        <g className="feed-group">
            {/* Main Post Card */}
            <rect className="post-card" x="20" y="25" width="80" height="50" rx="8" fill="#fff" />
            <circle cx="35" cy="40" r="5" fill="#c7d2fe" />
            <rect x="45" y="37" width="45" height="6" rx="2" fill="#e0e7ff" />
            <rect x="35" y="50" width="60" height="4" rx="2" fill="#eef2ff" />
            <rect x="35" y="60" width="50" height="4" rx="2" fill="#eef2ff" />

            {/* Floating Reactions */}
            <g className="reaction-icon like" transform="translate(85, 15)">
                <circle r="10" fill="#60a5fa" />
                <path d="M-4 -2 h3 v-5 h2 v5 h3 v2 h-8z" fill="#fff" transform="rotate(20) translate(0, 2)" />
            </g>
             <g className="reaction-icon heart" transform="translate(25, 65)">
                <path d="M0,5 C-5,-10 10,-10 5,0 C10,5 0,15 0,15 C0,15 -10,5 -5,0 C-10,-10 5,-10 0,5 Z" fill="#f472b6"/>
            </g>
        </g>
    </svg>
);


const NewsfeedBanner: React.FC = () => {
  return (
    <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white overflow-hidden shadow-lg">
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">Bảng tin Nội bộ</h1>
          <p className="mt-2 text-cyan-100 max-w-lg italic">
            “Nơi mỗi dòng tin đều tạo nên nhịp sống chung.”
          </p>
        </div>
        
        <div className="shrink-0 hidden md:block">
          <AnimatedNewsfeedIcon />
        </div>
      </div>
    </div>
  );
};

export default NewsfeedBanner;
