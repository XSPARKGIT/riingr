
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Conversation, User, Call } from '../types';
import { ConversationListItem } from './ConversationListItem';
import { ContactsView } from './ContactsView';
import { RecentCallsView } from './RecentCallsView';
import { SettingsSidebar } from './SettingsView';
import { ConversationContextMenu } from './ConversationContextMenu';
import { GroupCreationModal } from './GroupCreationModal';
import { UsersIcon, CallIcon, MessageIcon, SettingsIcon, INITIAL_CALLS } from '../constants';

interface ConversationListProps {
    conversations: Conversation[];
    selectedConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onSelectSettings: (category: string | null) => void;
    activeSettingsCategory: string | null;
    onTogglePin?: (id: string) => void;
    onDeleteConversation?: (id: string) => void;
    onSelectContact?: (user: User) => void;
    currentUserId?: string;
    currentUser?: User;
    contacts?: User[];
    onContactAdded?: () => void;
    onCreateGroup?: (name: string, participantIds: string[], avatar?: string) => Promise<void>;
    allUsers?: User[];
    isSyncing?: boolean;
    mutedConversations?: Map<string, number | null>;
    onMute?: (conversationId: string, mutedUntil: number | null) => Promise<void>;
    onUnmute?: (conversationId: string) => Promise<void>;
    onOpenGroupSettings?: (conversationId: string) => void;
    onJoinByInvite?: (token: string) => Promise<void>;
}

type NavSection = 'contacts' | 'calls' | 'chats' | 'settings';

export const ConversationList: React.FC<ConversationListProps> = ({ 
    conversations, 
    selectedConversationId, 
    onSelectConversation,
    onSelectSettings,
    activeSettingsCategory,
    onTogglePin,
    onDeleteConversation,
    onSelectContact,
    currentUserId,
    currentUser,
    contacts = [],
    onContactAdded,
    onCreateGroup,
    allUsers = [],
    isSyncing = false,
    mutedConversations = new Map(),
    onMute,
    onUnmute,
    onOpenGroupSettings,
    onJoinByInvite
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState<NavSection>('chats');
    const [isNewChatMenuOpen, setIsNewChatMenuOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [recentCalls] = useState<Call[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, conversation: Conversation } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Sync activeSection with selected state from parent if needed
    useEffect(() => {
        if (selectedConversationId) setActiveSection('chats');
        if (activeSettingsCategory) setActiveSection('settings');
    }, [selectedConversationId, activeSettingsCategory]);

    // Handle outside clicks for the New Chat menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsNewChatMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper function to calculate unread count for a conversation
    const getUnreadCount = (conversation: Conversation, userId?: string): number => {
        if (!userId) return 0;
        return conversation.messages.filter(message => {
            // Only count messages from other users
            if (message.senderId === userId || message.senderId === 'me') return false;
            // Count if message is not in readBy array
            const readBy = message.readBy || [];
            return !readBy.includes(userId);
        }).length;
    };

    // Calculate unread counts for all conversations
    const unreadCounts = useMemo(() => {
        const counts = new Map<string, number>();
        conversations.forEach(convo => {
            counts.set(convo.id, getUnreadCount(convo, currentUserId));
        });
        return counts;
    }, [conversations, currentUserId]);

    // Calculate total unread conversations for nav badge
    const totalUnreadConversations = useMemo(() => {
        return Array.from(unreadCounts.values()).filter(count => count > 0).length;
    }, [unreadCounts]);

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const lastA = a.messages[a.messages.length - 1]?.timestamp || 0;
            const lastB = b.messages[b.messages.length - 1]?.timestamp || 0;
            return lastB - lastA;
        });
    }, [conversations]);

    const filteredConversations = sortedConversations.filter(convo => {
        const other = convo.participants.find(p => 
            p.id !== 'me' && p.id !== currentUserId
        );
        return other?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Combine contacts with users from conversations
    const allUniqueUsers = useMemo(() => {
        const userMap = new Map<string, User>();
        // Add contacts first
        contacts.forEach(user => {
            userMap.set(user.id, user);
        });
        // Add users from conversations
        conversations.forEach(convo => {
            convo.participants.forEach(user => {
                if (user.id !== 'me' && user.id !== currentUserId) {
                    userMap.set(user.id, user);
                }
            });
        });
        return Array.from(userMap.values());
    }, [conversations, contacts, currentUserId]);

    const handleNavClick = (section: NavSection) => {
        setActiveSection(section);
        if (section !== 'settings') onSelectSettings(null);
    };

    const handleContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, conversation });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
            {activeSection === 'chats' ? (
                <>
                    <div className="p-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-10 pt-safe">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chats</h2>
                            <div className="relative" ref={menuRef}>
                                <button 
                                    onClick={() => setIsNewChatMenuOpen(!isNewChatMenuOpen)}
                                    className={`p-2 rounded-lg transition-all ${isNewChatMenuOpen ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'}`}
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>

                                {isNewChatMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                                        <NewChatMenuItem 
                                            icon={<UsersGroupIcon className="h-5 w-5" />} 
                                            label="New Group" 
                                            onClick={() => {
                                                setIsNewChatMenuOpen(false);
                                                setIsGroupModalOpen(true);
                                            }} 
                                        />
                                        <NewChatMenuItem 
                                            icon={<LockIcon className="h-5 w-5" />} 
                                            label="New Secret Chat" 
                                            onClick={() => setIsNewChatMenuOpen(false)} 
                                        />
                                        <NewChatMenuItem 
                                            icon={<MegaphoneIcon className="h-5 w-5" />} 
                                            label="New Channel" 
                                            onClick={() => setIsNewChatMenuOpen(false)} 
                                        />
                                        {onJoinByInvite && (
                                            <NewChatMenuItem 
                                                icon={<MegaphoneIcon className="h-5 w-5" />} 
                                                label="Join Group via Invite Link" 
                                                onClick={async () => {
                                                    setIsNewChatMenuOpen(false);
                                                    const input = window.prompt('Paste the invite link or token:');
                                                    if (!input) return;
                                                    try {
                                                        const url = new URL(input, window.location.origin);
                                                        const tokenFromQuery = url.searchParams.get('invite');
                                                        const token = tokenFromQuery || input.trim();
                                                        if (!token) return;
                                                        await onJoinByInvite(token);
                                                    } catch {
                                                        const token = input.trim();
                                                        if (!token) return;
                                                        await onJoinByInvite(token);
                                                    }
                                                }} 
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search chats"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-xl py-2 px-10 text-sm focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                            />
                            <div className="absolute left-3 top-2.5 text-slate-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto no-scrollbar">
                        {isSyncing && filteredConversations.length === 0 ? (
                            // Show loading placeholders when syncing and no conversations yet
                            <>
                                {[...Array(5)].map((_, index) => (
                                    <ConversationListPlaceholder key={`loading-${index}`} />
                                ))}
                            </>
                        ) : filteredConversations.length > 0 ? (
                            <>
                                {filteredConversations.map(convo => (
                                    <ConversationListItem 
                                        key={convo.id} 
                                        conversation={convo}
                                        isSelected={convo.id === selectedConversationId}
                                        onSelect={onSelectConversation}
                                        onContextMenu={handleContextMenu}
                                        currentUserId={currentUserId}
                                        isMuted={(() => {
                                            const mutedUntil = mutedConversations.get(convo.id);
                                            if (mutedUntil === undefined || mutedUntil === null) return false;
                                            if (mutedUntil === -1) return true; // Forever
                                            return mutedUntil > Date.now(); // Check if still muted
                                        })()}
                                        unreadCount={unreadCounts.get(convo.id) || 0}
                                    />
                                ))}
                                {isSyncing && (
                                    // Show loading placeholder at the end when syncing with existing conversations
                                    <ConversationListPlaceholder />
                                )}
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center px-6 py-10 text-center">
                                <div className="max-w-xs">
                                    <div className="h-14 w-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                                        <MessageIcon className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {searchQuery ? 'No chats match your search' : 'No chats yet'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {searchQuery ? 'Try another name or clear the search.' : 'Start a new chat to see your messages here.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </nav>
                </>
            ) : activeSection === 'contacts' ? (
                <div className="flex-1 overflow-hidden">
                    <ContactsView 
                        users={contacts.length > 0 ? contacts : allUniqueUsers} 
                        onSelectContact={onSelectContact || (() => {})} 
                        currentUserId={currentUserId}
                        onContactAdded={onContactAdded}
                    />
                </div>
            ) : activeSection === 'calls' ? (
                <div className="flex-1 overflow-hidden">
                    <RecentCallsView calls={recentCalls} users={allUniqueUsers} />
                </div>
            ) : activeSection === 'settings' ? (
                <div className="flex-1 overflow-hidden">
                    {currentUser ? (
                    <SettingsSidebar 
                            user={currentUser} 
                        activeCategory={activeSettingsCategory} 
                        onSelectCategory={onSelectSettings} 
                    />
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Loading user data...
                        </div>
                    )}
                </div>
            ) : null}

            <div className="flex-shrink-0 h-[72px] bg-white border-t border-slate-100 flex items-center justify-around px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <NavButton active={activeSection === 'contacts'} onClick={() => handleNavClick('contacts')} icon={<UsersIcon className="h-6 w-6" />} />
                <NavButton active={activeSection === 'calls'} onClick={() => handleNavClick('calls')} icon={<CallIcon className="h-6 w-6" />} />
                <NavButton active={activeSection === 'chats'} onClick={() => handleNavClick('chats')} icon={<MessageIcon className="h-6 w-6" />} badge={totalUnreadConversations > 0 ? totalUnreadConversations : undefined} />
                <NavButton active={activeSection === 'settings'} onClick={() => handleNavClick('settings')} icon={<SettingsIcon className="h-6 w-6" />} />
            </div>

            {contextMenu && (
                <ConversationContextMenu 
                    x={contextMenu.x}
                    y={contextMenu.y}
                    conversation={contextMenu.conversation}
                    onClose={() => setContextMenu(null)}
                    onTogglePin={onTogglePin || (() => {})}
                    onDelete={onDeleteConversation || (() => {})}
                    onMute={onMute ? async (mutedUntil) => {
                        await onMute(contextMenu.conversation.id, mutedUntil);
                    } : undefined}
                    onUnmute={onUnmute ? async () => {
                        await onUnmute(contextMenu.conversation.id);
                    } : undefined}
                    onOpenGroupSettings={onOpenGroupSettings && contextMenu.conversation.type === 'group' ? () => {
                        onOpenGroupSettings(contextMenu.conversation.id);
                        setContextMenu(null);
                    } : undefined}
                    mutedUntil={mutedConversations.get(contextMenu.conversation.id)}
                />
            )}

            {onCreateGroup && currentUserId && (
                <GroupCreationModal
                    isOpen={isGroupModalOpen}
                    onClose={() => setIsGroupModalOpen(false)}
                    onCreateGroup={onCreateGroup}
                    contacts={contacts}
                    currentUserId={currentUserId}
                    allUsers={allUsers}
                />
            )}
        </div>
    );
};

const NewChatMenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center w-full px-4 py-3 hover:bg-green-50 transition-colors text-left group"
    >
        <div className="mr-3 text-green-600 transition-colors">
            {icon}
        </div>
        <span className="text-[15px] font-bold text-slate-700 group-hover:text-green-700 transition-colors">
            {label}
        </span>
    </button>
);

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, badge?: number }> = ({ active, onClick, icon, badge }) => (
    <button onClick={onClick} className={`relative p-3 rounded-2xl transition-all group ${active ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
        <div className={`transition-transform duration-200 group-active:scale-90 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
        {badge !== undefined && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{badge}</span>
        )}
    </button>
);

// Internal icons for the New Chat menu
const UsersGroupIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const LockIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const MegaphoneIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
);

// Loading placeholder component that matches ConversationListItem design
const ConversationListPlaceholder: React.FC = () => {
    return (
        <div className="flex items-center p-3 space-x-4 animate-pulse">
            {/* Avatar placeholder */}
            <div className="relative h-12 w-12 flex-shrink-0">
                <div className="h-full w-full rounded-full bg-slate-200"></div>
            </div>
            {/* Content placeholder */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                    {/* Name placeholder */}
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    {/* Time placeholder */}
                    <div className="h-3 bg-slate-200 rounded w-10"></div>
                </div>
                {/* Message placeholder */}
                <div className="h-3 bg-slate-200 rounded w-32"></div>
            </div>
        </div>
    );
};
