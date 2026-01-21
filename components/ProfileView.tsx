
import React, { useState, useRef, useEffect } from 'react';
import type { Conversation, User } from '../types';
import { 
    ArrowLeftIcon, 
    MessageIcon, 
    CallIcon, 
    MoreIcon, 
    CopyIcon,
    UsersIcon,
    MessengerIcon,
    TrashIcon,
    GiftIcon,
    ImageIcon,
} from '../constants';

interface ProfileViewProps {
    conversation: Conversation;
    onClose: () => void;
    onUpdate?: (updates: Partial<Conversation>) => void;
    onAddMember?: (user: User) => void;
    onRemoveMember?: (userId: string) => void;
    availableUsers?: User[];
}

type Tab = 'Media' | 'Files' | 'Links' | 'Voice' | 'GIFs' | 'Groups';

export const ProfileView: React.FC<ProfileViewProps> = ({ 
    conversation, 
    onClose, 
    onRemoveMember,
    availableUsers = []
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('Media');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const isGroup = conversation.type === 'group';
    const otherParticipant = conversation.participants.find(p => p.id !== 'me');
    const displayUser = isGroup ? null : otherParticipant;
    
    const [isEditing, setIsEditing] = useState(false);
    const [editFirstName, setEditFirstName] = useState(displayUser?.name.split(' ')[0] || conversation.name || '');
    const [editLastName, setEditLastName] = useState(displayUser?.name.split(' ').slice(1).join(' ') || '');
    const [editNotes, setEditNotes] = useState('');

    const isAdmin = conversation.admins?.includes('me');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`Copied to clipboard: ${text}`);
    };

    const tabs: Tab[] = ['Media', 'Files', 'Links', 'Voice', 'GIFs', 'Groups'];

    const renderDetailItem = (label: string, value: string) => (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0 group">
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-green-600 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-[16px] font-semibold text-slate-800 truncate">{value}</p>
            </div>
            <button 
                onClick={() => handleCopy(value)}
                className="ml-4 p-2.5 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
                title={`Copy ${label}`}
            >
                <CopyIcon className="h-5 w-5" />
            </button>
        </div>
    );

    const renderEditView = () => (
        <div className="flex-1 overflow-y-auto pb-10 animate-in fade-in duration-300">
            <div className="flex flex-col items-center pt-8 pb-4">
                <div className="relative mb-8">
                    {isGroup ? (
                        conversation.avatar ? (
                            <img src={conversation.avatar} className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-lg" alt="" />
                        ) : (
                            <div className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center ring-4 ring-white shadow-lg">
                                <UsersIcon className="h-16 w-16 text-slate-300" />
                            </div>
                        )
                    ) : (
                        displayUser?.avatar === 'gemini' ? (
                            <div className="h-32 w-32 rounded-full bg-slate-50 flex items-center justify-center ring-4 ring-white shadow-lg">
                                <MessengerIcon className="h-20 w-20 text-green-500" />
                            </div>
                        ) : (
                            <img src={displayUser?.avatar} className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-lg" alt="" />
                        )
                    )}
                </div>

                <div className="w-full max-w-md px-4 space-y-4">
                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                        <input 
                            type="text" 
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            placeholder="First Name"
                            className="w-full px-5 py-4 text-[16px] font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
                        />
                        <input 
                            type="text" 
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            placeholder="Last Name"
                            className="w-full px-5 py-4 text-[16px] font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm flex items-center pr-4">
                            <textarea 
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Add Notes"
                                rows={1}
                                className="flex-1 px-5 py-4 text-[16px] font-bold text-slate-800 bg-transparent outline-none resize-none placeholder:text-slate-300"
                            />
                            <button className="text-slate-300 hover:text-slate-500 transition-colors">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                            </button>
                        </div>
                        <p className="px-5 text-[12px] font-bold text-slate-400">only visible to you</p>
                    </div>

                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
                        <button className="w-full px-5 py-4 flex items-center text-left hover:bg-slate-50 transition-colors">
                            <div className="h-6 w-6 mr-4 flex items-center justify-center text-sky-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <span className="text-[15px] font-bold text-sky-500">Suggest Photo for {editFirstName}</span>
                        </button>
                        <button className="w-full px-5 py-4 flex items-center text-left hover:bg-slate-50 transition-colors">
                            <div className="h-6 w-6 mr-4 flex items-center justify-center text-sky-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-[15px] font-bold text-sky-500">Set Photo for {editFirstName}</span>
                        </button>
                    </div>
                    <p className="px-5 text-[12px] font-bold text-slate-400 leading-relaxed">
                        You can replace {editFirstName}'s photo with another photo that only you will see.
                    </p>

                    <div className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-sm mt-8">
                        <button className="w-full px-5 py-4 text-left text-[15px] font-black text-red-500 hover:bg-red-50 transition-colors">
                            Delete Contact
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDefaultView = () => (
        <div className="flex-1 overflow-y-auto pb-10">
            {/* Profile Immersive Section */}
            <div className="flex flex-col items-center pt-10 pb-8 px-4 bg-white border-b border-slate-100 shadow-sm">
                <div className="relative mb-6">
                    {isGroup ? (
                        conversation.avatar ? (
                            <img src={conversation.avatar} className="h-36 w-36 rounded-full object-cover ring-4 ring-slate-50 shadow-xl" alt="" />
                        ) : (
                            <div className="h-36 w-36 rounded-full bg-slate-100 flex items-center justify-center ring-4 ring-slate-50 shadow-xl">
                                <UsersIcon className="h-20 w-20 text-slate-300" />
                            </div>
                        )
                    ) : (
                        displayUser?.avatar === 'gemini' ? (
                            <div className="h-36 w-36 rounded-full bg-slate-50 flex items-center justify-center ring-4 ring-green-100 shadow-xl">
                                <MessengerIcon className="h-24 w-24 text-green-500" />
                            </div>
                        ) : (
                            <img src={displayUser?.avatar} className="h-36 w-36 rounded-full object-cover ring-4 ring-slate-50 shadow-xl" alt="" />
                        )
                    )}
                    <span className="absolute bottom-2 right-2 block h-6 w-6 rounded-full bg-green-500 border-4 border-white shadow-sm"></span>
                </div>
                
                <h1 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">
                    {isGroup ? conversation.name : displayUser?.name}
                </h1>
                
                <div className="flex items-center space-x-2 text-sm text-slate-400 font-bold mb-8">
                    <span>last seen recently</span>
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-black uppercase tracking-wider">online</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-4 w-full max-sm:max-w-sm">
                    <button 
                        onClick={onClose}
                        className="flex-1 flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-3xl transition-all group"
                    >
                        <MessageIcon className="h-6 w-6 text-green-600 mb-1.5 group-active:scale-90 transition-transform" />
                        <span className="text-[11px] font-black text-green-600 uppercase">Message</span>
                    </button>
                    {!isGroup && (
                        <button className="flex-1 flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-3xl transition-all group">
                            <CallIcon className="h-6 w-6 text-green-600 mb-1.5 group-active:scale-90 transition-transform" />
                            <span className="text-[11px] font-black text-green-600 uppercase">Call</span>
                        </button>
                    )}
                    <div className="flex-1 relative" ref={moreMenuRef}>
                        <button 
                            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                            className={`w-full flex flex-col items-center justify-center p-4 rounded-3xl transition-all group ${isMoreMenuOpen ? 'bg-green-600 text-white' : 'bg-green-50 hover:bg-green-100 active:bg-green-200'}`}
                        >
                            <MoreIcon className={`h-6 w-6 mb-1.5 group-active:scale-90 transition-transform ${isMoreMenuOpen ? 'text-white' : 'text-green-600'}`} />
                            <span className={`text-[11px] font-black uppercase ${isMoreMenuOpen ? 'text-white' : 'text-green-600'}`}>More</span>
                        </button>

                        {isMoreMenuOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[24px] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <MoreMenuItem 
                                    icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>} 
                                    label="Video" 
                                />
                                <MoreMenuItem 
                                    icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.4 4.6l-1.4 1.4M2 2l20 20M10.73 5.08A2 2 0 0 1 12 5a7 7 0 0 1 7 7 2 2 0 0 1-.08 1.27M13.73 21a2 2 0 0 1-3.46 0"/><path d="M7 7a7 7 0 0 0-1.73 11"/></svg>} 
                                    label="Mute" 
                                />
                                <MoreMenuItem 
                                    icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} 
                                    label="Secret" 
                                />
                                <MoreMenuItem 
                                    icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>} 
                                    label="Share" 
                                />
                                <MoreMenuItem 
                                    icon={<GiftIcon className="h-5 w-5" />} 
                                    label="Send a Gift" 
                                />
                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                <MoreMenuItem 
                                    icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>} 
                                    label="Block User" 
                                    variant="danger"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="px-4 mt-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    {!isGroup ? (
                        <div className="divide-y divide-slate-50">
                            {renderDetailItem('username', displayUser?.username || `@user_${displayUser?.id}`)}
                            {renderDetailItem('phone', displayUser?.phone || 'Not provided')}
                            {renderDetailItem('birthday', displayUser?.birthday || 'Not provided')}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Participants</h3>
                                {isAdmin && (
                                    <button className="text-green-600 text-xs font-black hover:underline uppercase">
                                        Add Member
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {conversation.participants.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl transition-colors">
                                        <div className="flex items-center">
                                            <img 
                                                src={p.avatar === 'gemini' ? 'https://aistudiocdn.com/logo/gemini-sparkle.png' : p.avatar} 
                                                className="h-11 w-11 rounded-full mr-4 border-2 border-slate-100" 
                                                alt="" 
                                            />
                                            <div>
                                                <p className="text-[15px] font-bold text-slate-800">{p.id === 'me' ? 'You' : p.name}</p>
                                                <p className="text-[11px] font-bold text-slate-400">{p.username}</p>
                                            </div>
                                        </div>
                                        {isAdmin && p.id !== 'me' && (
                                            <button 
                                                onClick={() => onRemoveMember?.(p.id)} 
                                                className="text-slate-300 hover:text-red-500 p-2.5 hover:bg-red-50 rounded-full transition-all"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Media & Content Tabs */}
            <div className="mt-8 bg-white border-t border-slate-100 shadow-sm">
                <div className="flex items-center px-6 space-x-8 border-b border-slate-50 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all shrink-0 ${
                                activeTab === tab ? 'text-green-600 border-green-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="p-0.5 grid grid-cols-3 gap-0.5 min-h-[300px] bg-slate-50">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                        <div key={i} className="aspect-square bg-slate-200 overflow-hidden relative group cursor-pointer border border-white/10">
                            <img 
                                src={`https://picsum.photos/seed/${conversation.id}-${i}/300/300`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                                alt="Shared media content" 
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-green-900/0 group-hover:bg-green-900/10 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 text-slate-800 animate-in slide-in-from-right duration-300 z-50">
            {/* Header Nav */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
                <button 
                    onClick={isEditing ? () => setIsEditing(false) : onClose} 
                    className="flex items-center text-green-600 font-bold hover:opacity-70 transition-all active:scale-95 text-[15px]"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    <span>Back</span>
                </button>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Info</h2>
                <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="text-green-600 font-bold hover:opacity-70 transition-all active:scale-95 text-[15px]"
                >
                    {isEditing ? 'Done' : 'Edit'}
                </button>
            </div>

            {isEditing ? renderEditView() : renderDefaultView()}
        </div>
    );
};

const MoreMenuItem: React.FC<{ icon: React.ReactNode, label: string, variant?: 'default' | 'danger' }> = ({ icon, label, variant = 'default' }) => (
    <button className={`w-full flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left ${variant === 'danger' ? 'text-red-500' : 'text-slate-700'}`}>
        <span className="mr-3 opacity-60">{icon}</span>
        <span className="text-[15px] font-bold tracking-tight">{label}</span>
    </button>
);
