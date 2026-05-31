import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../App';
import { HashtagIcon, PaperAirplaneIcon, SearchIcon, XIcon, PlusIcon, SmileIcon, UserCircleIcon } from './icons';
import ChatBanner from './ChatBanner';
import { initialContacts } from './ContactsView';
import { db, auth } from '../firebase';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    arrayRemove,
    arrayUnion,
    addDoc, 
    updateDoc,
    serverTimestamp, 
    orderBy, 
    limit,
    Timestamp,
    getDoc,
    doc
} from 'firebase/firestore';
import Markdown from 'react-markdown';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // In a real app we might show a toast, but for the platform we throw so the agent can see it if it fails during testing
  // However, normally for users we just log it and maybe set an error state.
}

interface Message {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  createdAt?: unknown;
  reactions?: { [emoji: string]: string[] };
}

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  members: string[];
  unreadCount?: number;
  avatar?: string;
  source?: 'google';
  online?: boolean; // For DMs
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

interface ChatViewProps {
  user: User;
  allUsers?: User[];
}

export const mockMessages: Message[] = [];

const ChatView: React.FC<ChatViewProps> = ({ user, allUsers = [] }) => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [isSelectingContact, setIsSelectingContact] = useState(false);
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [selectTab, setSelectTab] = useState<'employees' | 'contacts'>('employees');

    const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✅', '🚀'];

    const getDMHelper = (channel: Channel, currentUserUid: string) => {
        const otherMemberId = channel.members.find(mId => mId !== currentUserUid) || '';
        
        // Find in allUsers
        const foundUser = allUsers.find(u => u.id === otherMemberId);
        if (foundUser) {
            return {
                name: foundUser.name,
                avatar: foundUser.avatar,
                online: true,
                role: foundUser.role === 'superadmin' ? 'Quản trị viên cấp cao' : foundUser.role === 'admin' ? 'Quản trị viên' : 'Thành viên'
            };
        }
        
        // Find in initialContacts
        const foundContact = initialContacts.find(c => c.id === otherMemberId);
        if (foundContact) {
            return {
                name: foundContact.name,
                avatar: foundContact.avatar,
                online: false,
                role: foundContact.title
            };
        }
        
        // Fallback
        return {
            name: channel.name,
            avatar: channel.avatar,
            online: false,
            role: 'Thành viên'
        };
    };

    const handleSelectContactChat = async (contact: { id: string; name: string; avatar?: string }) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Check if DM with this contact already exists in our channels
        const existingDm = channels.find(c => 
            c.type === 'dm' && 
            c.members.includes(currentUser.uid) && 
            c.members.includes(contact.id)
        );

        if (existingDm) {
            setActiveChannel(existingDm);
            setIsSelectingContact(false);
            setContactSearchTerm('');
            return;
        }

        // Create new DM channel
        const path = 'channels';
        try {
            const docRef = await addDoc(collection(db, path), {
                name: contact.name,
                type: 'dm',
                members: [currentUser.uid, contact.id],
                avatar: contact.avatar,
                createdAt: Date.now()
            });

            setIsSelectingContact(false);
            setContactSearchTerm('');

            // Automatically switch to the newly created DM
            const newDmSnap = await getDoc(docRef);
            if (newDmSnap.exists()) {
                setActiveChannel({ id: newDmSnap.id, ...newDmSnap.data() } as Channel);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, path);
        }
    };

    // Listen for channels
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser || user.id.startsWith('user-')) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'channels'),
            where('members', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChannels = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Channel[];
            
            setChannels(fetchedChannels);
            if (fetchedChannels.length > 0 && !activeChannel) {
                setActiveChannel(fetchedChannels[0]);
            }
            setIsLoading(false);
        }, (error) => {
             handleFirestoreError(error, OperationType.GET, 'channels');
             setIsLoading(false);
        });

        return () => unsubscribe();
    }, [activeChannel]);

    // Listen for messages in active channel
    useEffect(() => {
        if (!activeChannel || !auth.currentUser || user.id.startsWith('user-')) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, 'channels', activeChannel.id, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(100)
        );

        let isFirstSnapshot = true;

        const speakMessage = (text: string) => {
            const isSpeechEnabled = localStorage.getItem('aiSpeechEnabled') !== 'false';
            if (!isSpeechEnabled) return;
            
            if ('speechSynthesis' in window) {
                // Pre-cancel to clear queue if preferred, but usually we want to hear consecutive short messages.
                // However, for immediate feedback it's often better to cancel.
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                const selectedVoiceURI = localStorage.getItem('selectedVoiceURI');
                const isRobotEffect = localStorage.getItem('aiRobotEffectEnabled') === 'true';

                if (selectedVoiceURI) {
                    const voices = window.speechSynthesis.getVoices();
                    const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
                    if (voice) utterance.voice = voice;
                }
                
                if (isRobotEffect) {
                    utterance.pitch = 0.2;
                    utterance.rate = 0.8;
                } else {
                    utterance.pitch = 1;
                    utterance.rate = 1;
                }

                window.speechSynthesis.speak(utterance);
            }
        };

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt as Timestamp;
                return {
                    id: doc.id,
                    ...data,
                    timestamp: createdAt ? createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'
                };
            }) as Message[];

            if (!isFirstSnapshot) {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        if (data.authorId !== auth.currentUser?.uid && data.content) {
                            speakMessage(data.content);
                        }
                    }
                });
            }
            
            isFirstSnapshot = false;
            setMessages(fetchedMessages);
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `channels/${activeChannel.id}/messages`);
        });

        return () => {
            unsubscribe();
            // Optionally stop speaking when unmounting/switching channels
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [activeChannel, user.id]);

    const handleToggleReaction = async (messageId: string, emoji: string) => {
        if (!activeChannel || !auth.currentUser) return;
        
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const userId = auth.currentUser.uid;
        const currentReactions = message.reactions?.[emoji] || [];
        const hasReacted = currentReactions.includes(userId);

        const messageRef = doc(db, 'channels', activeChannel.id, 'messages', messageId);
        
        try {
            if (hasReacted) {
                await updateDoc(messageRef, {
                    [`reactions.${emoji}`]: arrayRemove(userId)
                });
            } else {
                await updateDoc(messageRef, {
                    [`reactions.${emoji}`]: arrayUnion(userId)
                });
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `channels/${activeChannel.id}/messages/${messageId}`);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeChannel || !auth.currentUser) return;

        const messageContent = newMessage;
        setNewMessage('');

        const path = `channels/${activeChannel.id}/messages`;
        try {
            await addDoc(collection(db, 'channels', activeChannel.id, 'messages'), {
                channelId: activeChannel.id,
                content: messageContent,
                authorId: auth.currentUser.uid,
                authorName: user.name,
                authorAvatar: getInitials(user.name),
                createdAt: serverTimestamp()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, path);
        }
    };

    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!newChannelName.trim() || !currentUser) return;

        const path = 'channels';
        try {
            const docRef = await addDoc(collection(db, path), {
                name: newChannelName.trim(),
                type: 'channel',
                members: [currentUser.uid],
                createdAt: serverTimestamp()
            });
            setNewChannelName('');
            setIsCreatingChannel(false);
            
            // Auto switch to new channel
            const newChannelSnap = await getDoc(docRef);
            if (newChannelSnap.exists()) {
                setActiveChannel({ id: newChannelSnap.id, ...newChannelSnap.data() } as Channel);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, path);
        }
    };

    const handleChannelSelect = (channel: Channel) => {
        setActiveChannel(channel);
        // Reset search when changing channel
        setSearchTerm('');
        setIsSearchOpen(false);
    };

    const filteredMessages = useMemo(() => {
        if (!searchTerm.trim()) return messages;
        return messages.filter(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, messages]);

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
                <ChatBanner />
                
                <div className="flex-1 bg-white/40 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 flex min-h-0">
                        {/* Left Pane: Channels and DMs */}
                        <div className="w-64 bg-white/30 backdrop-blur-lg border-r border-white/50 flex flex-col">
                            <div className="p-4 border-b border-white/50 shrink-0">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800">Trao đổi</h2>
                                    <div className="flex gap-1">
                                        <button onClick={() => setIsSelectingContact(true)} className="p-1.5 rounded-full hover:bg-black/10 text-slate-600" title="Nhắn tin với danh bạ">
                                            <UserCircleIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setIsCreatingChannel(true)} className="p-1.5 rounded-full hover:bg-black/10 text-slate-600" title="Tạo kênh mới">
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {isCreatingChannel && (
                                <div className="p-3 bg-white/50 border-b border-white/50 animate-fade-in-down">
                                    <form onSubmit={handleCreateChannel} className="space-y-2">
                                        <input 
                                            type="text" 
                                            autoFocus
                                            placeholder="Tên kênh mới..." 
                                            value={newChannelName}
                                            onChange={e => setNewChannelName(e.target.value)}
                                            className="w-full text-sm p-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 text-xs bg-cyan-600 text-white p-1.5 rounded-md font-bold hover:bg-cyan-700">Tạo</button>
                                            <button type="button" onClick={() => setIsCreatingChannel(false)} className="flex-1 text-xs bg-slate-200 text-slate-600 p-1.5 rounded-md font-bold hover:bg-slate-300">Hủy</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                                {isLoading ? (
                                    <div className="p-2 text-sm text-slate-500 animate-pulse text-center">Đang tải...</div>
                                ) : (
                                    <>
                                        <h3 className="px-2 py-1 text-xs font-bold text-slate-500 uppercase">Kênh</h3>
                                        {channels.filter(c => c.type === 'channel').length === 0 && (
                                            <p className="px-2 py-1 text-xs text-slate-400 italic">Chưa có kênh nào.</p>
                                        )}
                                        {channels.filter(c => c.type === 'channel').map(channel => (
                                            <button key={channel.id} onClick={() => handleChannelSelect(channel)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${activeChannel?.id === channel.id ? 'bg-white/80 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-white/50'}`}>
                                                <HashtagIcon className="w-5 h-5 text-slate-500" />
                                                <span className="truncate">{channel.name}</span>
                                                {channel.unreadCount && channel.unreadCount > 0 && <span className="ml-auto text-xs font-bold bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full">{channel.unreadCount}</span>}
                                            </button>
                                        ))}

                                        <h3 className="px-2 pt-4 pb-1 text-xs font-bold text-slate-500 uppercase">Tin nhắn trực tiếp</h3>
                                        {channels.filter(c => c.type === 'dm').length === 0 && (
                                            <p className="px-2 py-1 text-xs text-slate-400 italic">Chưa có cuộc hội thoại nào.</p>
                                        )}
                                        {channels.filter(c => c.type === 'dm').map(channel => {
                                            const dmInfo = auth.currentUser ? getDMHelper(channel, auth.currentUser.uid) : { name: channel.name, avatar: channel.avatar, online: false, role: 'Thành viên' };
                                            return (
                                                <button key={channel.id} onClick={() => handleChannelSelect(channel)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${activeChannel?.id === channel.id ? 'bg-white/80 text-slate-900' : 'text-slate-600 hover:bg-white/50'}`}>
                                                    <div className="relative shrink-0">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                                                            {dmInfo.avatar && dmInfo.avatar.startsWith('http') ? (
                                                                <img src={dmInfo.avatar} alt={dmInfo.name} className="w-full h-full object-cover rounded-full" />
                                                            ) : (
                                                                dmInfo.avatar || getInitials(dmInfo.name)
                                                            )}
                                                        </div>
                                                        <span className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ${dmInfo.online ? 'bg-green-500' : 'bg-slate-400'} ring-1 ring-white dark:ring-slate-700`}></span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-medium block text-xs truncate">{dmInfo.name}</span>
                                                    </div>
                                                    {channel.unreadCount && channel.unreadCount > 0 && <span className="ml-auto text-xs font-bold bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full">{channel.unreadCount}</span>}
                                                </button>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Center Pane: Message Feed */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {activeChannel ? (
                                <>
                                    <div className="p-4 border-b border-white/50 shrink-0">
                                        {isSearchOpen ? (
                                            <div className="flex items-center gap-2 animate-fade-in-down">
                                                <SearchIcon className="w-5 h-5 text-slate-400"/>
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder={`Tìm trong ${activeChannel.type === 'channel' ? '#' : ''}${activeChannel.name}`}
                                                    className="w-full bg-transparent focus:outline-none placeholder:text-slate-500"
                                                />
                                                <button onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }} className="p-1 rounded-full hover:bg-black/10 text-slate-500">
                                                    <XIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        ) : (
                                            (() => {
                                                const dmInfo = activeChannel.type === 'dm' && auth.currentUser 
                                                    ? getDMHelper(activeChannel, auth.currentUser.uid) 
                                                    : { name: activeChannel.name, avatar: activeChannel.avatar, online: false };
                                                return (
                                                    <div className="flex justify-between items-center">
                                                        <div className="truncate">
                                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 truncate">
                                                                {activeChannel.type === 'channel' ? `#${activeChannel.name}` : dmInfo.name}
                                                                {activeChannel.type === 'dm' && (
                                                                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dmInfo.online ? 'bg-green-500' : 'bg-slate-400'}`} title={dmInfo.online ? 'Online' : 'Offline'}></span>
                                                                )}
                                                            </h2>
                                                            <p className="text-sm text-slate-600 truncate">
                                                                {activeChannel.type === 'dm' 
                                                                    ? (dmInfo.online ? 'Đang hoạt động' : 'Ngoại tuyến')
                                                                    : 'Chào mừng bạn đến với kênh thảo luận.'
                                                                }
                                                            </p>
                                                        </div>
                                                        <button onClick={() => setIsSearchOpen(true)} className="p-2 rounded-full hover:bg-black/10 text-slate-500 shrink-0" title="Tìm kiếm trong cuộc trò chuyện">
                                                            <SearchIcon className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                        {filteredMessages.length === 0 && !searchTerm && (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
                                                <p className="text-lg font-medium">Bắt đầu cuộc trò chuyện</p>
                                                <p className="text-sm">Gửi tin nhắn đầu tiên trong kênh này.</p>
                                            </div>
                                        )}
                                        {filteredMessages.map(msg => (
                                            <div key={msg.id} className="flex items-start gap-3 animate-fade-in">
                                                <div className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-white/50">{msg.authorAvatar || getInitials(msg.authorName)}</div>
                                                <div className="flex-1 min-w-0 group relative">
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="font-semibold text-slate-800 truncate">{msg.authorName}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{msg.timestamp}</p>
                                                    </div>
                                                    <div className="text-slate-700 break-words leading-relaxed prose prose-sm max-w-none">
                                                        <Markdown>{msg.content}</Markdown>
                                                    </div>
                                                    
                                                    {/* Reactions Display */}
                                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {Object.entries(msg.reactions).map(([emoji, users]) => {
                                                                if (!users || users.length === 0) return null;
                                                                const hasReacted = auth.currentUser && users.includes(auth.currentUser.uid);
                                                                return (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => handleToggleReaction(msg.id, emoji)}
                                                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors border ${
                                                                            hasReacted 
                                                                                ? 'bg-cyan-100 border-cyan-200 text-cyan-700' 
                                                                                : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'
                                                                        }`}
                                                                    >
                                                                        <span>{emoji}</span>
                                                                        <span className="font-bold">{users.length}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Reaction Button Tool */}
                                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm overflow-hidden z-10">
                                                        <div className="flex px-1">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id);
                                                                }}
                                                                className="p-1.5 hover:bg-slate-100 text-slate-500 transition-colors"
                                                                title="Add reaction"
                                                            >
                                                                <SmileIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        
                                                        {showEmojiPicker === msg.id && (
                                                            <div className="absolute right-0 bottom-full mb-1 p-1 bg-white border border-slate-200 rounded-lg shadow-xl flex gap-1 z-20 animate-scale-in origin-bottom-right">
                                                                {commonEmojis.map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => {
                                                                            handleToggleReaction(msg.id, emoji);
                                                                            setShowEmojiPicker(null);
                                                                        }}
                                                                        className="p-1.5 hover:bg-slate-100 rounded transition-transform hover:scale-125"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 border-t border-white/50 bg-white/40">
                                        <form onSubmit={handleSendMessage} className="relative">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder={`Nhắn trong ${activeChannel.type === 'channel' ? '#' : ''}${activeChannel.name}`}
                                                className="w-full bg-white/70 border border-transparent focus:bg-white focus:border-cyan-400 focus:ring-0 focus:outline-none placeholder-slate-500 text-slate-800 rounded-lg py-3 pl-4 pr-12 transition-all duration-300 shadow-inner"
                                            />
                                            <button type="submit" className="absolute inset-y-0 right-0 px-4 flex items-center text-cyan-600 hover:text-cyan-700 transition-colors">
                                                <PaperAirplaneIcon className="w-5 h-5"/>
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-400 p-10 text-center space-y-4">
                                    <HashtagIcon className="w-12 h-12 opacity-20" />
                                    <div>
                                        <p className="text-xl font-bold">Không tìm thấy nội dung</p>
                                        <p className="text-sm max-w-xs mx-auto">Vui lòng tạo kênh mới để bắt đầu thảo luận.</p>
                                    </div>
                                    <button onClick={() => setIsCreatingChannel(true)} className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 transition-all shadow-lg hover:shadow-cyan-500/30">
                                        Tạo kênh đầu tiên
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Chọn người trong hệ thống / danh bạ để chat */}
            {isSelectingContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] animate-scale-in overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Bắt đầu cuộc trò chuyện</h3>
                                <p className="text-xs text-slate-500">Chọn một tài khoản hoặc liên hệ để bắt đầu chat trực tiếp 1-on-1.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsSelectingContact(false);
                                    setContactSearchTerm('');
                                }}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Top Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectTab('employees')}
                                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center ${
                                    selectTab === 'employees'
                                        ? 'border-cyan-600 text-cyan-600 bg-white'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
                                }`}
                            >
                                Tài khoản hệ thống ({allUsers ? allUsers.filter(u => u.id !== user.id).length : 0})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectTab('contacts')}
                                className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center ${
                                    selectTab === 'contacts'
                                        ? 'border-cyan-600 text-cyan-600 bg-white'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
                                }`}
                            >
                                Danh bạ ({initialContacts.length})
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-3 bg-slate-50 border-b border-slate-100 shrink-0">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={contactSearchTerm}
                                    onChange={(e) => setContactSearchTerm(e.target.value)}
                                    placeholder={selectTab === 'employees' ? 'Tìm tài khoản theo tên hoặc email...' : 'Tìm trong danh bạ...'}
                                    className="w-full bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none placeholder-slate-400 text-sm text-slate-800 rounded-lg py-2 pl-9 pr-3 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Contacts/Employees List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                            {selectTab === 'employees' ? (
                                allUsers
                                    .filter(u => u.id !== user.id)
                                    .filter(u => 
                                        u.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || 
                                        u.email.toLowerCase().includes(contactSearchTerm.toLowerCase())
                                    )
                                    .map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleSelectContactChat(emp)}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm overflow-hidden uppercase">
                                                {emp.avatar && emp.avatar.startsWith('http') ? (
                                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    getInitials(emp.name)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-cyan-700 transition-colors">{emp.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                                                <span className="inline-block mt-0.5 bg-cyan-50 text-cyan-700 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider">
                                                    {emp.role === 'superadmin' ? 'Quản trị viên cấp cao' : emp.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                                                </span>
                                            </div>
                                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">Trò chuyện</span>
                                            </div>
                                        </button>
                                    ))
                            ) : (
                                initialContacts
                                    .filter(c => 
                                        c.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || 
                                        (c.department && c.department.toLowerCase().includes(contactSearchTerm.toLowerCase()))
                                    )
                                    .map(contact => (
                                        <button
                                            key={contact.id}
                                            onClick={() => handleSelectContactChat(contact)}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-indigo-550 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm overflow-hidden uppercase">
                                                {contact.avatar && contact.avatar.startsWith('http') ? (
                                                    <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    getInitials(contact.name)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-cyan-700 transition-colors">{contact.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{contact.title}</p>
                                                {contact.department && (
                                                    <span className="inline-block mt-0.5 bg-slate-100 text-slate-600 group-hover:bg-cyan-55 group-hover:text-cyan-700 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider">
                                                        Phòng {contact.department}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">Trò chuyện</span>
                                            </div>
                                        </button>
                                    ))
                            )}
                            {selectTab === 'employees' && allUsers.filter(u => u.id !== user.id).filter(u => 
                                u.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || 
                                u.email.toLowerCase().includes(contactSearchTerm.toLowerCase())
                            ).length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Không tìm thấy tài khoản nhân viên nào thỏa mãn.
                                </div>
                            )}
                            {selectTab === 'contacts' && initialContacts.filter(c => 
                                c.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || 
                                (c.department && c.department.toLowerCase().includes(contactSearchTerm.toLowerCase()))
                            ).length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Không tìm thấy liên hệ nào.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setIsSelectingContact(false);
                                    setContactSearchTerm('');
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default ChatView;
