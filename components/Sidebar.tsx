import React from 'react';
import type { Conversation, User } from '../types';
import { UsersIcon, MessageIcon, CallIcon, SettingsIcon, PlusIcon } from '../constants';

interface SidebarProps {
    conversations: Conversation[];
    contacts: User[];
    currentUserId?: string;
    selectedConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onSelectContact?: (user: User) => void;
    onSelectSettings?: (category: string | null) => void;
    activeSection?: 'chats' | 'contacts' | 'calls' | 'settings';
    onCreateGroup?: () => void;
    mutedConversations?: Map<string, number | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
    conversations,
    contacts,
    currentUserId,
    selectedConversationId,
    onSelectConversation,
    onSelectContact,
    onSelectSettings,
    activeSection = 'chats',
    onCreateGroup,
    mutedConversations = new Map(),
}) => {
    // Get unique users from conversations and contacts
    const allUsers = React.useMemo(() => {
        const userMap = new Map<string, User>();
        
        // Add contacts
        contacts.forEach(user => {
            if (user.id !== currentUserId && user.id !== 'me') {
                userMap.set(user.id, user);
            }
        });
        
        // Add users from conversations
        conversations.forEach(convo => {
            if (convo.type === 'direct') {
                const other = convo.participants.find(p => p.id !== currentUserId && p.id !== 'me');
                if (other) {
                    userMap.set(other.id, other);
                }
            }
        });
        
        return Array.from(userMap.values());
    }, [contacts, conversations, currentUserId]);

    // Get unread count for a conversation
    const getUnreadCount = (conversation: Conversation): number => {
        if (!currentUserId) return 0;
        return conversation.messages.filter(message => {
            // Only count messages from other users
            if (message.senderId === currentUserId || message.senderId === 'me') return false;
            // Count if message is not in readBy array
            const readBy = message.readBy || [];
            return !readBy.includes(currentUserId);
        }).length;
    };

    // Check if conversation is muted
    const isMuted = (conversationId: string): boolean => {
        const mutedUntil = mutedConversations.get(conversationId);
        if (mutedUntil === undefined || mutedUntil === null) return false;
        if (mutedUntil === -1) return true;
        return mutedUntil > Date.now();
    };

    return (
        <div className="w-16 md:w-20 flex flex-col items-center py-4 bg-slate-50 border-r border-slate-200 overflow-y-auto no-scrollbar">
            {/* New Chat Button */}
            <button
                onClick={onCreateGroup}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center mb-4 transition-all shadow-lg hover:shadow-xl active:scale-95"
                title="New Chat"
            >
                <PlusIcon className="h-5 w-5 md:h-6 md:w-6" />
            </button>

            {/* Conversations/Contacts as circular avatars */}
            <div className="flex-1 w-full space-y-2 px-2">
                {conversations.slice(0, 20).map((convo) => {
                    const isSelected = convo.id === selectedConversationId;
                    const unreadCount = getUnreadCount(convo);
                    const muted = isMuted(convo.id);
                    
                    // Get avatar for conversation
                    let avatar: React.ReactNode;
                    let bgColor = 'bg-slate-200';
                    
                    if (convo.type === 'group') {
                        // Group: show group icon or first letter of name
                        const firstLetter = convo.name?.[0]?.toUpperCase() || 'G';
                        avatar = (
                            <div className="w-full h-full flex items-center justify-center text-slate-700 font-black text-sm md:text-base">
                                {firstLetter}
                            </div>
                        );
                        bgColor = 'bg-blue-500';
                    } else {
                        // Direct message: show other participant's avatar
                        const other = convo.participants.find(p => p.id !== currentUserId && p.id !== 'me');
                        if (other?.avatar) {
                            avatar = (
                                <img 
                                    src={other.avatar} 
                                    alt={other.name || 'User'} 
                                    className="w-full h-full object-cover rounded-full"
                                />
                            );
                        } else {
                            const firstLetter = other?.name?.[0]?.toUpperCase() || '?';
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-red-500'];
                            const colorIndex = (other?.id?.charCodeAt(0) || 0) % colors.length;
                            bgColor = colors[colorIndex];
                            avatar = (
                                <div className="w-full h-full flex items-center justify-center text-white font-black text-sm md:text-base">
                                    {firstLetter}
                                </div>
                            );
                        }
                    }

                    return (
                        <button
                            key={convo.id}
                            onClick={() => onSelectConversation(convo.id)}
                            className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full ${bgColor} flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                                isSelected ? 'ring-2 ring-green-600 ring-offset-2' : ''
                            } ${muted ? 'opacity-60' : ''}`}
                            title={convo.type === 'group' ? convo.name : convo.participants.find(p => p.id !== currentUserId)?.name}
                        >
                            {avatar}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                            {muted && (
                                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-slate-400 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                    );
                })}

                {/* Show contacts that aren't in conversations yet */}
                {allUsers.slice(0, 10).map((user) => {
                    const hasConversation = conversations.some(c => 
                        c.type === 'direct' && c.participants.some(p => p.id === user.id)
                    );
                    if (hasConversation) return null;

                    const firstLetter = user.name?.[0]?.toUpperCase() || '?';
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-red-500'];
                    const colorIndex = (user.id?.charCodeAt(0) || 0) % colors.length;
                    const bgColor = colors[colorIndex];

                    return (
                        <button
                            key={user.id}
                            onClick={() => onSelectContact?.(user)}
                            className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full ${bgColor} flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
                            title={user.name}
                        >
                            {user.avatar ? (
                                <img 
                                    src={user.avatar} 
                                    alt={user.name || 'User'} 
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-black text-sm md:text-base">
                                    {firstLetter}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Bottom Navigation */}
            <div className="w-full space-y-2 px-2 pt-4 border-t border-slate-200">
                <button
                    onClick={() => onSelectSettings?.('profile')}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all hover:bg-slate-200 ${
                        activeSection === 'settings' ? 'bg-green-600 text-white' : 'bg-white text-slate-600'
                    }`}
                    title="Settings"
                >
                    <SettingsIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
            </div>
        </div>
    );
};
