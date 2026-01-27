
import React from 'react';
import type { Conversation, User } from '../types';
import { MessengerIcon, PinIcon } from '../constants';

interface ConversationListItemProps {
    conversation: Conversation;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, conversation: Conversation) => void;
    currentUserId?: string;
}

const Avatar: React.FC<{ user: User }> = ({ user }) => {
    if (user.avatar === 'gemini') {
        return (
             <div className="relative h-12 w-12 flex-shrink-0">
                <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center">
                    <MessengerIcon className="h-8 w-8 text-green-500" />
                </div>
                 {user.isOnline && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-50"></span>
                )}
            </div>
        )
    }
    return (
        <div className="relative h-12 w-12 flex-shrink-0">
            <img className="h-full w-full rounded-full object-cover" src={user.avatar} alt={user.name} />
            {user.isOnline && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-gray-50"></span>
            )}
        </div>
    );
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, isSelected, onSelect, onContextMenu, currentUserId }) => {
    const isGroup = conversation.type === 'group';
    
    // For groups, use group name. For DMs, find the other participant
    const otherParticipant = !isGroup ? conversation.participants.find(p => 
        p.id !== 'me' && p.id !== currentUserId
    ) : null;
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    // For DMs, we need an other participant
    if (!isGroup && !otherParticipant) {
        console.error('❌ No other participant found for DM conversation:', {
            conversationId: conversation.id,
            participants: conversation.participants,
            currentUserId,
        });
        return null;
    }

    const time = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
    // Display name: group name for groups, participant name for DMs
    const displayName = isGroup ? conversation.name : otherParticipant?.name;
    
    // For groups, show a group icon instead of user avatar
    const displayAvatar = isGroup ? (
        conversation.avatar || 'group'
    ) : otherParticipant;
    
    const itemClasses = `
        flex items-center p-3 space-x-4 cursor-pointer transition-colors duration-200 ease-in-out
        ${isSelected ? 'bg-green-100' : 'hover:bg-gray-100'}
    `;

    return (
        <div 
            className={itemClasses} 
            onClick={() => onSelect(conversation.id)}
            onContextMenu={(e) => onContextMenu(e, conversation)}
        >
            {isGroup ? (
                <div className="relative h-12 w-12 flex-shrink-0">
                    {conversation.avatar ? (
                        <img className="h-full w-full rounded-full object-cover" src={conversation.avatar} alt={conversation.name} />
                    ) : (
                        <div className="h-full w-full rounded-full bg-slate-200 flex items-center justify-center">
                            <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    )}
                </div>
            ) : (
                <Avatar user={otherParticipant!} />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                    <div className="flex flex-col items-end">
                        <p className="text-xs text-slate-500">{time}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 truncate flex-1 mr-2">
                        {lastMessage ? lastMessage.text : 'No messages yet'}
                    </p>
                    {conversation.isPinned && (
                        <PinIcon className="h-3 w-3 text-slate-400 -rotate-45" />
                    )}
                </div>
            </div>
        </div>
    );
};
