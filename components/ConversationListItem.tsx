
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
    // Find the other participant (not the current user)
    const otherParticipant = conversation.participants.find(p => 
        p.id !== 'me' && p.id !== currentUserId
    );
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (!otherParticipant) return null;

    const time = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
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
            <Avatar user={otherParticipant} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-slate-800 truncate">{otherParticipant.name}</p>
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
