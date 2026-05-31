import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Contact } from './ContactCard';
import { UserPlusIcon, XIcon } from './icons';

interface CreateContactModalProps {
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

const CreateContactModal: React.FC<CreateContactModalProps> = ({ onClose, onSave }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('fullName') + ' là bắt buộc.');
      return;
    }

    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
      department: department.trim(),
      avatar: avatar.trim(),
      type: 'personal',
      managerId: null,
    };

    onSave(newContact);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0" onClick={onClose}></div>
      <form onSubmit={handleSave} className="relative w-full max-w-lg bg-[--color-surface-tertiary] backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up max-h-full">
        <header className="p-4 border-b border-[--color-border-secondary] flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold text-[--color-text-primary] flex items-center gap-2">
            <UserPlusIcon className="w-6 h-6" />
            {t('createContact')}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary]" aria-label={t('close')}>
            <XIcon className="w-5 h-5"/>
          </button>
        </header>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          <InputField label={t('fullName')} id="name" value={name} onChange={setName} required />
          <InputField label={t('emailAddress')} id="email" type="email" value={email} onChange={setEmail} />
          <InputField label={t('phoneNumber')} id="phone" type="tel" value={phone} onChange={setPhone} />
          <InputField label={t('jobTitle')} id="title" value={title} onChange={setTitle} />
          <InputField label={t('companyDepartment')} id="department" value={department} onChange={setDepartment} />
          <InputField label={t('avatarUrlOptional')} id="avatar" value={avatar} onChange={setAvatar} placeholder="https://..." />
        </div>

        <footer className="p-4 mt-auto border-t border-[--color-border-secondary] flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-[--color-text-secondary] font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors">{t('cancel')}</button>
          <button type="submit" className="py-2 px-6 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">{t('saveContact')}</button>
        </footer>
      </form>
    </div>
  );
};

// Helper component for form fields
interface InputFieldProps {
    label: string;
    id: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, id, value, onChange, type = 'text', required = false, placeholder }) => (
    <div>
        <label htmlFor={id} className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">{label}</label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={placeholder}
            className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
        />
    </div>
);

export default CreateContactModal;