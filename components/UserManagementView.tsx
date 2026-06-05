import React, { useState, useRef, useEffect } from 'react';
import { User } from '../App';
import { useLanguage } from './LanguageContext';
import UserManagementBanner from './UserManagementBanner';
import { ChevronDownIcon, PlusIcon, XIcon, GoogleIcon } from './icons';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase-errors';

interface UserManagementViewProps {
    currentUser: User;
    users: User[];
    onUsersChange: (users: User[]) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

interface CreateUserModalProps {
    onClose: () => void;
    onSave: (user: Omit<User, 'id'>) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onSave }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<User['role']>('member');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, role });
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="bg-[--color-surface-tertiary] border border-[--color-border-secondary] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-6 border-b border-[--color-border-secondary] flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[--color-text-primary]">{t('createUser')}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[--color-text-subtle]">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1">{t('fullName')}</label>
                        <input 
                            required
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-2.5 focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1">{t('emailAddress')}</label>
                        <input 
                            required
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-2.5 focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                            placeholder="email@example.com"
                        />
                        <p className="mt-1 text-[10px] text-[--color-text-subtle]">
                            * Nhân viên có thể đăng nhập bằng tài khoản Google nếu sử dụng email này.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[--color-text-secondary] mb-1">{t('role')}</label>
                        <select 
                            value={role}
                            onChange={(e) => setRole(e.target.value as User['role'])}
                            className="w-full bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] rounded-lg p-2.5 focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                        >
                            <option value="member">{t('role_member')}</option>
                            <option value="admin">{t('role_admin')}</option>
                            <option value="superadmin">{t('role_superadmin')}</option>
                        </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-[--color-border-secondary] text-[--color-text-primary] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[--color-accent-600] text-white font-semibold shadow-lg hover:shadow-[--color-accent-500/20] transition-all active:scale-[0.98]"
                        >
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser, users, onUsersChange }) => {
    const { t } = useLanguage();
    const [message, setMessage] = useState('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        if (userId === currentUser.id) {
            setMessage(t('cannotChangeOwnRole'));
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
        onUsersChange(updatedUsers);

        // Persist to Firestore if not a mock user
        if (!userId.startsWith('user-')) {
            try {
                await updateDoc(doc(db, 'users', userId), { role: newRole });
            } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
            }
        }

        setMessage(t('updateRoleSuccess'));
        setTimeout(() => setMessage(''), 3000);
    };

    const handleCreateUser = async (newUserData: Omit<User, 'id'>) => {
        const tempId = `user-${Date.now()}`;
        const newUser: User = {
            ...newUserData,
            id: tempId,
            avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
        };

        // For real users (not just demo), we should ideally create them in Firebase Auth?
        // But we can't do that from client. 
        // We only create the record in Firestore. 
        // When they log in via Google/Email with this email, they will see their profile.
        
        try {
            await setDoc(doc(db, 'users', tempId), {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar,
                createdAt: serverTimestamp()
            });
            
            // Locally update to show immediate feedback
            // (The subscription in App.tsx will eventually update the correct ID)
            onUsersChange([...users, { ...newUser }]);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${tempId}`);
            // Fallback for demo
            onUsersChange([...users, newUser]);
        }

        setCreateModalOpen(false);
        setMessage(t('addUser') + ' thành công!');
        setTimeout(() => setMessage(''), 3000);
    };

    const roles: { id: User['role']; label: string; description: string }[] = [
        { id: 'superadmin', label: t('role_superadmin'), description: t('role_superadmin_desc') },
        { id: 'admin', label: t('role_admin'), description: t('role_admin_desc') },
        { id: 'member', label: t('role_member'), description: t('role_member_desc') },
    ];
    
    const roleLabels = Object.fromEntries(roles.map(r => [r.id, r.label])) as Record<User['role'], string>;


    return (
        <div className="animate-fade-in-up flex-1 overflow-y-auto no-scrollbar p-[3px] pb-24 md:pb-8 flex flex-col gap-3">
            <div className="shrink-0">
                <UserManagementBanner />
            </div>
            <div className="w-full flex-1">
                <div className="bg-[--color-surface-secondary] rounded-2xl shadow-xl overflow-hidden border border-[--color-border-secondary]">
                    <div className="p-6 border-b border-[--color-border-secondary] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-[--color-text-primary]">{t('userList')}</h2>
                            <p className="text-sm text-[--color-text-subtle]">{users.length} {t('user')}</p>
                        </div>
                        <button 
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-[--color-accent-600] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[--color-accent-500/20] flex items-center justify-center gap-2 hover:bg-[--color-accent-700] transition-all active:scale-[0.98]"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>{t('addUser')}</span>
                        </button>
                    </div>
                    
                    {message && (
                        <div className="p-4 bg-green-500/10 border-b border-green-500/20 text-center animate-fade-in-down">
                            <span className="text-green-600 dark:text-green-400 font-semibold">{message}</span>
                        </div>
                    )}
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-[--color-text-secondary] uppercase bg-[--color-surface-primary]/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4">{t('user')}</th>
                                    <th scope="col" className="px-6 py-4">{t('role')}</th>
                                    <th scope="col" className="px-6 py-4">Liên kết Google</th>
                                    <th scope="col" className="px-6 py-4">{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-[--color-border-primary]/50 hover:bg-[--color-surface-primary]/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[--color-accent-500] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                                                    {user.avatar ? <img src={user.avatar} alt={user.name} className="rounded-full w-full h-full object-cover" /> : getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-[--color-text-primary]">{user.name}</div>
                                                    <div className="text-[--color-[--color-text-subtle]] opacity-75">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative w-48" ref={openDropdown === user.id ? dropdownRef : null}>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                                                    disabled={user.id === currentUser.id && currentUser.role !== 'superadmin'}
                                                    className="w-full text-left bg-[--color-surface-primary] border border-[--color-border-secondary] text-[--color-text-primary] text-sm rounded-lg focus:ring-1 focus:ring-[--color-accent-500] focus:border-[--color-accent-500] p-2 flex justify-between items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[--color-accent-500/50]"
                                                >
                                                    <span>{roleLabels[user.role]}</span>
                                                    <ChevronDownIcon className={`w-4 h-4 text-[--color-text-subtle] transition-transform ${openDropdown === user.id ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openDropdown === user.id && (
                                                    <div className="absolute z-30 mt-2 w-72 bg-[--color-surface-tertiary] backdrop-blur-2xl border border-[--color-border-secondary] rounded-xl shadow-2xl animate-fade-in-down p-1">
                                                        {roles.map(role => (
                                                            <button
                                                                key={role.id}
                                                                onClick={() => {
                                                                    handleRoleChange(user.id, role.id);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className={`w-full text-left p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${user.role === role.id ? 'bg-[--color-accent-500]/10 border border-[--color-accent-500]/20' : ''}`}
                                                            >
                                                                <p className={`font-semibold ${user.role === role.id ? 'text-[--color-accent-600]' : 'text-[--color-text-primary]'}`}>{role.label}</p>
                                                                <p className="text-xs text-[--color-text-subtle] whitespace-normal mt-0.5 line-clamp-2">{role.description}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isGoogleLinked ? (
                                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                                                    <div className="text-red-550 bg-red-500/10 p-1 rounded">
                                                        <GoogleIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-xs truncate max-w-[120px]" title={user.googleEmail || user.email}>
                                                        {user.googleEmail || user.email}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[--color-text-subtle]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    <span className="text-xs">Chưa liên kết</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {t('active')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isCreateModalOpen && <CreateUserModal onClose={() => setCreateModalOpen(false)} onSave={handleCreateUser} />}
        </div>
    );
};

export default UserManagementView;
