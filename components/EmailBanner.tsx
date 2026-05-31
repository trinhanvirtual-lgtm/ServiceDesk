import React from 'react';

const AnimatedEmailIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 120 100" 
    className="w-20 h-20 drop-shadow-lg"
    aria-hidden="true"
  >
    <style>{`
      .plane {
        animation: fly 5s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
      .trail {
        stroke-dasharray: 20;
        stroke-dashoffset: 20;
        animation: draw-trail 5s ease-in-out infinite;
        opacity: 0;
      }
      .trail-1 { animation-delay: 0s; }
      .trail-2 { animation-delay: -0.2s; }

      @keyframes fly {
        0% { transform: translateX(80px) translateY(10px) rotate(-15deg); opacity: 0; }
        20% { transform: translateX(20px) translateY(0) rotate(10deg); opacity: 1; }
        80% { transform: translateX(-30px) translateY(-5px) rotate(15deg); opacity: 1; }
        100% { transform: translateX(-100px) translateY(5px) rotate(25deg); opacity: 0; }
      }
      
      @keyframes draw-trail {
        0% { stroke-dashoffset: 20; opacity: 0; }
        20% { opacity: 1; }
        60% { stroke-dashoffset: -40; opacity: 1; }
        80% { stroke-dashoffset: -40; opacity: 0; }
        100% { stroke-dashoffset: -40; opacity: 0; }
      }
    `}</style>
    <g>
      <path className="trail trail-1" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" d="M110 50 C 80 50, 80 40, 50 40" />
      <path className="trail trail-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" d="M110 60 C 80 60, 80 50, 50 50" />
    </g>
    <path 
      className="plane"
      fill="#fff" 
      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" 
      transform="scale(2.5) translate(10, 15)"
    />
  </svg>
);

const EmailBanner: React.FC = () => {
  return (
    <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-green-400 to-teal-600 text-white overflow-hidden shadow-lg shrink-0">
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full opacity-50 z-0" aria-hidden="true"></div>
      <div className="absolute top-4 left-4 w-24 h-24 bg-white/10 rounded-full opacity-50 z-0" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">Trung tâm Email</h1>
          <p className="mt-2 text-teal-100 max-w-md italic">
            “Mỗi email không chỉ là tin nhắn – mà là một mảnh ghép vận hành.”
          </p>
        </div>
        
        <div className="shrink-0 hidden md:block">
          <AnimatedEmailIcon />
        </div>
      </div>
    </div>
  );
};

export default EmailBanner;