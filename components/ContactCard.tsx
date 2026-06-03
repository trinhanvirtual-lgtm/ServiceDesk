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
    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group relative">
      <div className="flex flex-col items-center text-center">
        {contact.avatar && contact.avatar.startsWith('http') ? (
          <img src={contact.avatar} alt={contact.name} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-slate-100 dark:border-slate-800" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-2xl mb-3 border-2 border-slate-100 dark:border-slate-800">
            {getInitials(contact.name)}
          </div>
        )}
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{contact.name}</h3>
        <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{contact.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{contact.department}</p>
        
        <div className="w-full border-t border-slate-200 dark:border-slate-800 my-3"></div>

        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2 w-full text-left px-2">
            <p className="flex items-center gap-2 truncate">
                <MailIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0"/>
                <a href={`mailto:${contact.email}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{contact.email}</a>
            </p>
            <p className="flex items-center gap-2 truncate">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>{contact.phone}</span>
            </p>
        </div>
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={(e) => { e.stopPropagation(); if(onChatClick) onChatClick(e, contact); }}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 transition-colors shadow-sm"
            title="Trò chuyện"
        >
            <ChatIcon className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"><PencilIcon className="w-4 h-4" /></button>
        <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-red-500 dark:text-red-400 transition-colors shadow-sm"><TrashIcon className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default ContactCard;