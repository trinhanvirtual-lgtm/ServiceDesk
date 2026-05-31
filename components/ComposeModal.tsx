
import React, { useRef } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, LinkIcon } from './icons';

interface ComposeModalProps {
  onClose: () => void;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ onClose }) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentEditableRef.current) {
        contentEditableRef.current.focus();
    }
  };

  const handleLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
        execCommand('createLink', url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white/80 backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
        <header className="p-4 border-b border-slate-200/80 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">New Message</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-400/20 text-slate-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>
        <div className="p-4 flex flex-col gap-3">
          <input 
            type="email" 
            placeholder="To"
            className="w-full bg-transparent border-b border-slate-300/80 focus:border-cyan-500 py-2 px-1 focus:outline-none transition-colors"
          />
          <input 
            type="text" 
            placeholder="Subject"
            className="w-full bg-transparent border-b border-slate-300/80 focus:border-cyan-500 py-2 px-1 focus:outline-none transition-colors"
          />
          
          <div className="flex bg-slate-50 border border-slate-300/80 rounded mt-2 p-1 gap-1">
            <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Bold"><BoldIcon className="w-4 h-4" /></button>
            <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Italic"><ItalicIcon className="w-4 h-4" /></button>
            <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Underline"><UnderlineIcon className="w-4 h-4" /></button>
            <div className="w-px bg-slate-300 mx-1"></div>
            <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Bullet List"><ListIcon className="w-4 h-4" /></button>
            <button onClick={handleLink} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Insert Link"><LinkIcon className="w-4 h-4" /></button>
          </div>
          
          <div
            ref={contentEditableRef}
            contentEditable
            role="textbox"
            aria-multiline="true"
            className="w-full min-h-[250px] max-h-[400px] overflow-y-auto bg-transparent focus:outline-none py-2 px-1 resize-none prose prose-slate prose-sm"
            data-placeholder="Your message..."
          ></div>
        </div>
        <footer className="p-4 mt-auto border-t border-slate-200/80 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="py-2 px-5 rounded-lg text-slate-700 font-semibold hover:bg-slate-400/20 transition-colors">Cancel</button>
          <button className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md">Send</button>
        </footer>
      </div>
    </div>
  );
};

export default ComposeModal;
