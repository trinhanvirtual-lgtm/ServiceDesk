
import React from 'react';
import { XIcon } from './icons';

interface FloatingAiButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed top-[72px] right-6 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-800 text-white flex items-center justify-center shadow-2xl z-50 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[--color-accent-400]/50`}
      aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
        <img 
            src="https://i.ibb.co/x8Spz9Qm/Avata-AI-POW.gif" 
            alt="AI Assistant"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} 
        />
        <XIcon className={`absolute w-8 h-8 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
      </div>
    </button>
  );
};

export default FloatingAiButton;