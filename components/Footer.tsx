
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="flex items-center h-12 px-6 bg-white/40 backdrop-blur-lg border-t border-white/50 shrink-0">
      <p className="text-xs text-slate-600">&copy; 2026 Service Desk Manager. All rights reserved.</p>
      <div className="ml-auto text-xs text-slate-600">
        Status: <span className="text-green-600 font-semibold">Online</span>
      </div>
    </footer>
  );
};

export default Footer;