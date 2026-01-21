import React, { useState, useRef, useEffect } from 'react';
import type { Message, User } from '../types';
import { ReplyIcon, CheckIcon, DoubleCheckIcon, PinIcon, StarIcon, MessengerIcon, FolderIcon } from '../constants';

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
    onReply: () => void;
    replyToMessage?: Message;
    participants: User[];
    onContextMenu: (e: React.MouseEvent, msg: Message) => void;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
    onVotePoll?: (messageId: string, optionIndex: number) => void;
    onScrollToMessage?: (id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, 
    isOwnMessage, 
    onReply, 
    replyToMessage, 
    participants,
    onContextMenu,
    isFirstInGroup,
    isLastInGroup,
    onVotePoll,
    onScrollToMessage
}) => {
    const [offsetX, setOffsetX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startXRef = useRef(0);
    const threshold = 60;

    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleStart = (clientX: number) => {
        startXRef.current = clientX;
        setIsSwiping(true);
    };

    const handleMove = (clientX: number) => {
        if (!isSwiping) return;
        const deltaX = clientX - startXRef.current;
        if (deltaX > 0) setOffsetX(Math.min(deltaX, 100));
    };

    const handleEnd = () => {
        if (offsetX >= threshold) onReply();
        setIsSwiping(false);
        setOffsetX(0);
    };

    const renderContent = (text: string) => {
        const parts = text.split(/(\[.*?\]\(.*?\))/g);
        return parts.map((part, i) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="underline font-bold break-all">{match[1]}</a>;
            }
            return part;
        });
    };

    const radiusClasses = isOwnMessage
        ? `${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-tr-sm'} ${isLastInGroup ? 'rounded-br-2xl' : 'rounded-br-sm'} rounded-l-2xl`
        : `${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-tl-sm'} ${isLastInGroup ? 'rounded-bl-2xl' : 'rounded-bl-sm'} rounded-r-2xl`;

    const bubbleClasses = isOwnMessage
        ? `bg-green-600 text-white ${radiusClasses}`
        : `bg-white text-slate-800 ${radiusClasses} border border-slate-100`;

    // Calculate total votes for the poll
    const totalVotes = message.poll?.options.reduce((acc, opt) => acc + opt.votes, 0) || 0;

    return (
        <div 
            className={`relative flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} w-full select-none group min-w-0`}
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onContextMenu={(e) => onContextMenu(e, message)}
        >
            <div 
                className={`max-w-[90%] sm:max-w-[75%] min-w-0 relative ${!isSwiping ? 'transition-transform duration-300' : ''}`}
                style={{ transform: `translateX(${offsetX}px)` }}
            >
                {/* Pinned Indicator Above Bubble */}
                {message.isPinned && (
                    <div className={`flex items-center space-x-1.5 mb-1 opacity-60 px-2 min-w-0 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <PinIcon className="h-3 w-3 text-green-600 shrink-0" />
                        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest truncate">Pinned</span>
                    </div>
                )}

                <div className={`shadow-sm flex flex-col relative min-w-0 ${bubbleClasses}`}>
                    {replyToMessage && (
                        <div 
                            onClick={(e) => { e.stopPropagation(); onScrollToMessage?.(replyToMessage.id); }}
                            className="mx-2 mt-2 bg-black/5 rounded-lg p-2 border-l-4 border-green-400 text-left cursor-pointer hover:bg-black/10 transition-colors min-w-0"
                        >
                            <p className="text-[10px] font-bold opacity-70 uppercase truncate">{participants.find(p => p.id === replyToMessage.senderId)?.name}</p>
                            <p className="text-xs italic truncate opacity-80">{replyToMessage.text || 'Media'}</p>
                        </div>
                    )}
                    
                    {/* Render Image */}
                    {message.imageUrl && (
                        <div className="p-1 shrink-0"><img src={message.imageUrl} className="rounded-xl w-full max-h-80 object-cover" alt="Shared media" /></div>
                    )}

                    {/* Render Location */}
                    {message.location && (
                        <div className="p-2 space-y-2 min-w-0">
                             <div className="bg-slate-100 rounded-xl overflow-hidden aspect-[16/9] relative group/map">
                                <img 
                                    src={`https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=225&fit=crop`} 
                                    className="w-full h-full object-cover"
                                    alt="Map location"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/map:opacity-100 transition-opacity">
                                    <span className="bg-white text-slate-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">Open in Maps</span>
                                </div>
                             </div>
                             <div className="px-2 pb-1 min-w-0">
                                <p className="text-[13px] font-black uppercase tracking-widest text-green-500 mb-0.5 truncate">Location</p>
                                <p className="text-[14px] font-bold leading-tight opacity-90 truncate">
                                    {message.location.address || `${message.location.lat.toFixed(4)}, ${message.location.lng.toFixed(4)}`}
                                </p>
                                <a 
                                    href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold underline opacity-60 mt-1 inline-block"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View on Google Maps
                                </a>
                             </div>
                        </div>
                    )}

                    {/* Render Poll */}
                    {message.poll && (
                        <div className="p-3 sm:p-4 min-w-[200px] max-w-full space-y-3 sm:space-y-4">
                            <div className="flex items-start space-x-2 min-w-0">
                                <div className="p-1.5 sm:p-2 bg-teal-500/10 rounded-lg shrink-0">
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                </div>
                                <h4 className="text-[14px] sm:text-[16px] font-black leading-tight flex-1 break-words min-w-0">{message.poll.question}</h4>
                            </div>
                            
                            <div className="space-y-2 sm:space-y-2.5 min-w-0">
                                {message.poll.options.map((option, idx) => {
                                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                                    const isVoted = option.votedBy.includes('me');

                                    return (
                                        <button 
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); onVotePoll?.(message.id, idx); }}
                                            className="w-full relative h-10 sm:h-12 rounded-xl sm:rounded-2xl border border-black/5 overflow-hidden text-left hover:scale-[1.02] active:scale-[0.98] transition-all group/poll-opt min-w-0"
                                        >
                                            <div 
                                                className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${isOwnMessage ? 'bg-white/20' : 'bg-teal-500/15'}`} 
                                                style={{ width: `${percentage}%` }}
                                            />
                                            <div className="relative h-full flex items-center justify-between px-3 sm:px-4 min-w-0">
                                                <span className={`text-[13px] sm:text-[14px] font-bold truncate pr-4 min-w-0 ${isVoted ? (isOwnMessage ? 'text-white' : 'text-teal-700') : ''}`}>
                                                    {option.text}
                                                </span>
                                                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                                                    {isVoted && <CheckIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${isOwnMessage ? 'text-white' : 'text-teal-600'}`} />}
                                                    <span className={`text-[10px] sm:text-[12px] font-black opacity-60`}>
                                                        {Math.round(percentage)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] sm:text-[11px] font-black text-center opacity-40 uppercase tracking-widest pt-1 border-t border-black/5 shrink-0">
                                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                            </p>
                        </div>
                    )}

                    {/* Render File Attachment */}
                    {message.file && (
                        <div className="p-2 min-w-0">
                            <div className={`flex items-center p-2.5 sm:p-3 pr-3 sm:pr-4 rounded-xl border border-black/5 min-w-0 ${isOwnMessage ? 'bg-black/10' : 'bg-slate-50'}`}>
                                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center mr-2.5 sm:mr-3 shadow-sm shrink-0 ${isOwnMessage ? 'bg-white/20' : 'bg-blue-500'}`}>
                                    <FolderIcon className={`h-5 w-5 sm:h-6 sm:w-6 text-white`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] sm:text-[14px] font-bold truncate leading-tight mb-0.5">{message.file.name}</p>
                                    <p className="text-[10px] sm:text-[11px] font-black opacity-50 uppercase tracking-widest truncate">{message.file.size} • {message.file.type}</p>
                                </div>
                                <button className={`ml-1.5 sm:ml-2 p-1.5 sm:p-2 rounded-full hover:bg-black/5 transition-colors shrink-0`}>
                                    <svg className="h-4 w-4 sm:h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Render Text */}
                    {message.text && (
                        <div className="px-3 sm:px-4 py-2 sm:py-2.5 min-w-0">
                            <p className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium overflow-wrap-anywhere">
                                {renderContent(message.text)}
                            </p>
                            
                            {message.translation && (
                                <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-black/5 animate-in fade-in duration-500 min-w-0">
                                    <div className="flex items-center space-x-1 mb-1 shrink-0">
                                        <MessengerIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-40" />
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">AI Translation</span>
                                    </div>
                                    <p className={`text-[12px] sm:text-[13px] leading-relaxed italic break-words ${isOwnMessage ? 'text-white/80' : 'text-slate-500'}`}>
                                        {message.translation}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`flex items-center justify-end px-3 pb-1.5 -mt-2 space-x-1 shrink-0 ${isOwnMessage ? 'text-white/70' : 'text-slate-400'}`}>
                        {message.isStarred && <StarIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 ${isOwnMessage ? 'text-white/60' : 'text-yellow-400'}`} />}
                        <span className="text-[8px] sm:text-[9px] font-black uppercase shrink-0">{time}</span>
                        {isOwnMessage && (
                            <div className="flex items-center shrink-0 space-x-0.5">
                                {/* Sync Status Indicator */}
                                {message.syncStatus === 'pending' && (
                                    <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                    </svg>
                                )}
                                {message.syncStatus === 'syncing' && (
                                    <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {message.syncStatus === 'failed' && (
                                    <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                                    </svg>
                                )}
                                {/* Message Status Indicators (only show if synced or no sync status) */}
                                {(!message.syncStatus || message.syncStatus === 'synced') && (
                                    <>
                                {message.status === 'sent' && <CheckIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                                {(message.status === 'delivered' || message.status === 'read') && (
                                    <DoubleCheckIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${message.status === 'read' ? 'text-sky-300' : ''}`} />
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};