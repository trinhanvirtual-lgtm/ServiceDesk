
import React from 'react';

const AnimatedNoteIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 120 100" 
    className="w-20 h-20 drop-shadow-lg"
    aria-hidden="true"
  >
    <style>{`
      .note-group {
        animation: float 6s ease-in-out infinite;
      }
      .pencil {
        transform-origin: bottom right;
        animation: write 5s ease-in-out infinite;
      }
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
        100% { transform: translateY(0px); }
      }
      @keyframes write {
        0% { transform: rotate(15deg) translateX(0); }
        20% { transform: rotate(10deg) translateX(-5px); }
        40% { transform: rotate(15deg) translateX(0); }
        60% { transform: rotate(10deg) translateX(-5px); }
        80% { transform: rotate(15deg) translateX(0); }
        100% { transform: rotate(15deg) translateX(0); }
      }
      .line-draw {
        stroke-dasharray: 50;
        stroke-dashoffset: 50;
        animation: draw-line 5s ease-in-out infinite;
      }
      @keyframes draw-line {
        0% { stroke-dashoffset: 50; }
        20% { stroke-dashoffset: 0; }
        80% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 50; }
      }
    `}</style>
    <g className="note-group">
      {/* Note Paper */}
      <path d="M20,10 L80,10 Q85,10 85,15 L85,85 Q85,90 80,90 L20,90 Q15,90 15,85 L15,15 Q15,10 20,10 Z" fill="#fffbe_b" />
      <path d="M70,10 L85,25 L70,25Z" fill="#fde_68a" opacity="0.6"/>
      <line className="line-draw" x1="25" y1="35" x2="75" y2="35" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="45" x2="65" y2="45" stroke="#fcd_34d" strokeWidth="2" strokeLinecap="round" />

      {/* Pencil */}
      <g className="pencil" transform="translate(65, 20) rotate(15)">
        <polygon points="0,0 5,5 0,10 -30,10 -35,5 -30,0" fill="#facc15"/>
        <polygon points="0,0 5,5 0,10" fill="#fdba74"/>
        <rect x="-30" y="2" width="28" height="6" fill="#4b5563" />
        <polygon points="-35,0 -30,0 -35,5" fill="#1f2937" />
      </g>
    </g>
  </svg>
);


const NotesBanner: React.FC = () => {
  return (
    <div className="relative py-3 px-6 sm:py-4 sm:px-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white overflow-hidden shadow-lg">
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/10 rounded-full opacity-50 z-0" aria-hidden="true"></div>
      <div className="absolute top-4 -right-12 w-48 h-48 bg-white/10 rounded-lg opacity-50 z-0 rotate-45" aria-hidden="true"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">Không gian Ghi chú</h1>
          <p className="mt-2 text-orange-100 max-w-lg italic">
            "Nơi ý tưởng được định hình và thông tin không bao giờ lạc lối."
          </p>
        </div>
        
        <div className="shrink-0 hidden md:block">
          <AnimatedNoteIcon />
        </div>
      </div>
    </div>
  );
};

export default NotesBanner;
