
import React from 'react';

const AnimatedBlogIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 120 100" 
    className="w-20 h-20 drop-shadow-lg"
    aria-hidden="true"
  >
    <style>{`
      .book-group {
        animation: float 6s ease-in-out infinite;
      }
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
        100% { transform: translateY(0px); }
      }
      .page-turn {
        transform-origin: 0% 50%;
        animation: turn-page 5s ease-in-out infinite;
      }
      @keyframes turn-page {
        0% { transform: perspective(300px) rotateY(0deg); }
        40% { transform: perspective(300px) rotateY(-160deg); }
        60% { transform: perspective(300px) rotateY(-160deg); }
        100% { transform: perspective(300px) rotateY(0deg); }
      }
      .text-line {
        stroke-dasharray: 50;
        stroke-dashoffset: 50;
        animation: draw-text 5s ease-in-out infinite;
      }
      .line-1 { animation-delay: 0.2s; }
      .line-2 { animation-delay: 0.4s; }
      .line-3 { animation-delay: 0.6s; }
      @keyframes draw-text {
        0% { stroke-dashoffset: 50; }
        20% { stroke-dashoffset: 0; }
        80% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -50; }
      }
    `}</style>
    <g className="book-group">
      {/* Book */}
      <path d="M10 15 H 50 V 85 H 10 Z" fill="#fff" />
      <path d="M110 15 H 70 V 85 H 110 Z" fill="#fff" />
      <path d="M60,15 C70,25 70,75 60,85" fill="none" stroke="#e0e7ff" strokeWidth="4"/>
      <path d="M60,15 C50,25 50,75 60,85" fill="#e0e7ff" />
      
      {/* Text on left page */}
      <line className="text-line line-1" x1="20" y1="30" x2="50" y2="30" stroke="#a78bfa" strokeWidth="3" />
      <line className="text-line line-2" x1="20" y1="45" x2="50" y2="45" stroke="#a78bfa" strokeWidth="3" />
      <line className="text-line line-3" x1="20" y1="60" x2="50" y2="60" stroke="#a78bfa" strokeWidth="3" />

      {/* Turning Page */}
      <path className="page-turn" d="M70 15 H 110 V 85 H 70 C 80 75 80 25 70 15 Z" fill="#f3f4f6" />
    </g>
  </svg>
);


const BlogBanner: React.FC = () => {
  return (
    <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white overflow-hidden shadow-lg">
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 rotate-12" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">Bài viết / Blog</h1>
          <p className="mt-2 text-pink-100 max-w-lg italic">
            “Gieo chữ – Gặt hiểu – Kết nối tư tưởng”
          </p>
        </div>
        
        <div className="shrink-0 hidden md:block">
          <AnimatedBlogIcon />
        </div>
      </div>
    </div>
  );
};

export default BlogBanner;
