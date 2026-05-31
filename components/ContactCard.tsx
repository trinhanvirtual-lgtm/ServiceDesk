import React from 'react';
import { MailIcon, PencilIcon, TrashIcon, ChatIcon } from './icons';

export interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  avatar: string; // URL or initials
  department: string;
  managerId?: string | null;
  type: 'personal' | 'directory';
  source?: 'google';
}

interface ContactCardProps {
  contact: Contact;
  onChatClick?: (e: React.MouseEvent, contact: Contact) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onChatClick }) => {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group relative">
      <div className="flex flex-col items-center text-center">
        {contact.avatar && contact.avatar.startsWith('http') ? (
          <img src={contact.avatar} alt={contact.name} className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-white/50" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-2xl mb-3 ring-2 ring-white/50">
            {getInitials(contact.name)}
          </div>
        )}
        <h3 className="font-bold text-lg text-slate-800">{contact.name}</h3>
        <p className="text-sm text-cyan-700 font-semibold">{contact.title}</p>
        <p className="text-xs text-slate-500 mt-1">{contact.department}</p>
        
        <div className="w-full border-t border-slate-200/80 my-3"></div>

        <div className="text-sm text-slate-600 space-y-1 w-full text-left px-2">
            <p className="flex items-center gap-2 truncate">
                <MailIcon className="w-4 h-4 text-slate-400 shrink-0"/>
                <a href={`mailto:${contact.email}`} className="hover:text-cyan-600">{contact.email}</a>
            </p>
            <p className="flex items-center gap-2 truncate">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>{contact.phone}</span>
            </p>
        </div>
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={(e) => { e.stopPropagation(); if(onChatClick) onChatClick(e, contact); }}
            className="p-2 rounded-full bg-white/50 hover:bg-white text-cyan-600 transition-colors shadow-sm"
            title="Trò chuyện"
        >
            <ChatIcon className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-full bg-white/50 hover:bg-white text-slate-600 transition-colors shadow-sm"><PencilIcon className="w-4 h-4" /></button>
        <button className="p-2 rounded-full bg-white/50 hover:bg-white text-red-500 transition-colors shadow-sm"><TrashIcon className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default ContactCard;