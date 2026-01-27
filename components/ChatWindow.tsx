import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Conversation, User, Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { MessageContextMenu } from './MessageContextMenu';
import { ProfileView } from './ProfileView';
import { ArrowLeftIcon, MessengerIcon, CloseIcon, PhoneIcon, UsersIcon, PinIcon } from '../constants';
import { generateImage, summarizeConversation, getSmartReplies, translateText } from '../services/geminiService';
import { subscribeToTypingStatus, markConversationMessagesAsRead } from '../services/firestoreService';

interface ChatWindowProps {
    conversation: Conversation;
    onSendMessage: (text?: string, imageUrl?: string, location?: Message['location'], poll?: Message['poll'], file?: Message['file']) => void;
    onVotePoll: (messageId: string, optionIndex: number) => void;
    isLoading: boolean;
    onBack?: () => void;
    replyingTo: Message | null;
    setReplyingTo: (msg: Message | null) => void;
    onDeleteMessage: (id: string) => void;
    onTogglePin: (id: string) => void;
    onToggleStar: (id: string) => void;
    onAddReaction: (id: string, emoji: string) => void;
    onUpdateMessage?: (messageId: string, updates: Partial<Message>) => void;
    currentUserId?: string; // Add current user ID prop
}

const ChatHeader: React.FC<{
    conversation: Conversation, 
    onBack?: () => void,
    onClick: () => void,
    onSummarize: () => void,
    isSummarizing: boolean,
    currentUserId?: string,
    isMuted?: boolean;
}> = ({ conversation, onBack, onClick, onSummarize, isSummarizing, currentUserId, isMuted = false }) => {
    const isGroup = conversation.type === 'group';
    const otherParticipant = conversation.participants.find(p => p.id !== 'me' && p.id !== currentUserId);

    // Debug logging (removed to reduce console spam)

    const renderAvatar = () => {
        if (isGroup) {
            return conversation.avatar ? (
                <img className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-slate-100" src={conversation.avatar} alt={conversation.name} />
            ) : (
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-slate-100">
                    <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                </div>
            );
        }
        
        const user = otherParticipant!;
        if (user.avatar === 'gemini') {
            return (
                 <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-green-100">
                    <MessengerIcon className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
            );
        }
        return <img className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-slate-100" src={user.avatar} alt={user.name} />;
    };

    const displayName = isGroup ? conversation.name : otherParticipant?.name;
    const subText = isGroup 
        ? (conversation.description 
            ? conversation.description.length > 30 
                ? conversation.description.substring(0, 30) + '...' 
                : conversation.description
            : `${conversation.participants.length} members`)
        : otherParticipant?.isOnline ? 'Active Now' : 'Last seen recently';

    return (
        <div 
            className="flex items-center justify-between px-2 sm:px-3 pb-2 sm:pb-3 border-b border-slate-200 bg-white/95 backdrop-blur-md z-30 sticky top-0 cursor-pointer hover:bg-slate-50 transition-colors shrink-0 pt-safe"
            onClick={onClick}
        >
            <div className="flex items-center min-w-0">
                {onBack && (
                    <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden mr-1 sm:mr-2 p-1.5 sm:p-2 rounded-full hover:bg-slate-100 active:bg-slate-200">
                        <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                    </button>
                )}
                <div className="relative shrink-0">
                    {renderAvatar()}
                    {!isGroup && otherParticipant?.isOnline && (
                        <span className="absolute bottom-0 right-0 block h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                    )}
                </div>
                <div className="ml-2 sm:ml-3 truncate min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-[15px] font-bold text-slate-800 leading-tight truncate">{displayName}</h3>
                        {isMuted && (
                            <svg className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        )}
                    </div>
                    <p className="text-[9px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                        {subText}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-0.5 sm:space-x-1 shrink-0">
                <button 
                    disabled={isSummarizing}
                    onClick={(e) => { e.stopPropagation(); onSummarize(); }}
                    className={`p-1.5 sm:p-2.5 rounded-full transition-all ${isSummarizing ? 'bg-green-100 text-green-600 animate-pulse' : 'hover:bg-green-50 text-green-600'}`}
                    title="AI Smart Summary"
                >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z"/></svg>
                </button>
                {!isGroup && (
                    <button className="p-1.5 sm:p-2.5 rounded-full hover:bg-slate-100 text-green-600" onClick={(e) => e.stopPropagation()}>
                        <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

const SummaryBanner: React.FC<{ text: string, onClose: () => void }> = ({ text, onClose }) => (
    <div className="m-2 sm:m-4 p-3 sm:p-4 bg-white/80 backdrop-blur-xl border border-green-200 rounded-2xl sm:rounded-3xl shadow-xl shadow-green-900/5 animate-in slide-in-from-top duration-500 relative overflow-hidden group shrink-0">
        <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
        <div className="flex items-start justify-between min-w-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                    <MessengerIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-[10px] sm:text-[11px] font-black text-green-600 uppercase tracking-widest">Gemini Smart Summary</span>
                </div>
                <div className="text-xs sm:text-[14px] font-bold text-slate-700 whitespace-pre-line leading-relaxed break-words">
                    {text}
                </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 ml-2 shrink-0">
                <CloseIcon className="h-4 w-4" />
            </button>
        </div>
    </div>
);

const TypingIndicator: React.FC<{ users: User[] }> = ({ users }) => {
    if (users.length === 0) return null;
    
    const names = users.map(u => u.name).join(', ');
    const text = users.length === 1 
        ? `${names} is typing...`
        : `${names} are typing...`;
        
    return (
    <div className="flex items-center space-x-1.5 self-start p-2 sm:p-3 bg-white/80 rounded-xl sm:rounded-2xl ml-4 mb-2 shadow-sm shrink-0">
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
	    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
	    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            <span className="text-xs text-slate-500 ml-2">{text}</span>
    </div>
);
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    conversation, 
    onSendMessage, 
    onVotePoll,
    isLoading, 
    onBack,
    replyingTo,
    setReplyingTo,
    onDeleteMessage,
    onTogglePin,
    onToggleStar,
    onAddReaction,
    onUpdateMessage,
    currentUserId,
    onOpenGroupSettings,
    isMuted = false
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: Message } | null>(null);
    
    // AI Features State
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [smartReplies, setSmartReplies] = useState<string[]>([]);

    // Poll State
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOption1, setPollOption1] = useState('');
    const [pollOption2, setPollOption2] = useState('');

    // Typing Indicator State
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    useEffect(() => {
        // Use setTimeout to ensure DOM is updated before scrolling
        const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        return () => clearTimeout(timer);
    }, [conversation.messages.length, isLoading, isGeneratingImage, summary]);

    // Handle Smart Replies Generation
    useEffect(() => {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const isOwnMessage = lastMessage && (lastMessage.senderId === 'me' || lastMessage.senderId === currentUserId);
        if (lastMessage && !isOwnMessage && !lastMessage.isSystem && lastMessage.text) {
            getSmartReplies(conversation.messages).then(setSmartReplies);
        } else {
            setSmartReplies([]);
        }
    }, [conversation.messages, currentUserId]);

    // Subscribe to typing status
    useEffect(() => {
        if (!conversation.id || !currentUserId || conversation.id === 'gemini-chat') {
            setTypingUsers([]);
            return;
        }

        const unsubscribe = subscribeToTypingStatus(
            conversation.id,
            currentUserId,
            (typingUserIds) => {
                setTypingUsers(typingUserIds);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [conversation.id, currentUserId]);

    // Mark messages as read when conversation is opened
    useEffect(() => {
        if (!conversation.id || !currentUserId || conversation.id === 'gemini-chat') {
            return;
        }

        // Mark all unread messages as read when conversation opens
        // Use a small delay to ensure conversation is fully loaded
        const timer = setTimeout(() => {
            markConversationMessagesAsRead(conversation.id, currentUserId).catch((error) => {
                console.error('Error marking messages as read:', error);
            });
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [conversation.id, currentUserId, conversation.messages.length]);

    const handleSummarize = async () => {
        if (conversation.messages.length < 3) return;
        setIsSummarizing(true);
        try {
            const result = await summarizeConversation(conversation.messages);
            setSummary(result);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleTranslate = async (msg: Message) => {
        if (!msg.text || msg.translation) return;
        try {
            const translation = await translateText(msg.text);
            onUpdateMessage?.(msg.id, { translation });
        } catch (e) {
            console.error("Translation failed");
        }
    };

    const handleSmartReplyClick = (text: string) => {
        onSendMessage(text);
        setSmartReplies([]);
    };

    const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, msg });
    };

    const handleCreatePoll = () => {
        const trimmedQuestion = pollQuestion.trim();
        const trimmedOpt1 = pollOption1.trim();
        const trimmedOpt2 = pollOption2.trim();

        if (!trimmedQuestion || !trimmedOpt1 || !trimmedOpt2) return;
        
        onSendMessage(undefined, undefined, undefined, {
            question: trimmedQuestion,
            options: [
                { text: trimmedOpt1, votes: 0, votedBy: [] },
                { text: trimmedOpt2, votes: 0, votedBy: [] }
            ]
        });
        
        setPollQuestion('');
        setPollOption1('');
        setPollOption2('');
        setIsPollModalOpen(false);
    };

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-green-50/50');
            setTimeout(() => element.classList.remove('bg-green-50/50'), 2000);
        }
    };

    const groupedMessages = useMemo(() => {
        // Sort messages by timestamp ascending (oldest first) as safety net
        const sortedMessages = [...conversation.messages].sort((a, b) => a.timestamp - b.timestamp);
        const groups: { type: 'date' | 'message', content: string | Message, isFirstInGroup?: boolean, isLastInGroup?: boolean }[] = [];
        let lastDate: string | null = null;
        sortedMessages.forEach((msg, idx) => {
            const dateStr = new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
            if (dateStr !== lastDate) {
                groups.push({ type: 'date', content: dateStr });
                lastDate = dateStr;
            }
            const prevMsg = sortedMessages[idx - 1];
            const nextMsg = sortedMessages[idx + 1];
            const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.isSystem || (msg.timestamp - prevMsg.timestamp > 300000);
            const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || nextMsg.isSystem || (nextMsg.timestamp - msg.timestamp > 300000);
            groups.push({ type: 'message', content: msg, isFirstInGroup, isLastInGroup });
        });
        return groups;
    }, [conversation.messages]);

    const pinnedMessage = conversation.messages.find(m => m.isPinned);

    if (isProfileOpen) {
        return (
            <ProfileView 
                conversation={conversation}
                onClose={() => setIsProfileOpen(false)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden min-w-0">
            <ChatHeader 
                conversation={conversation} 
                onBack={onBack} 
                onClick={() => {
                    if (conversation.type === 'group' && onOpenGroupSettings) {
                        onOpenGroupSettings();
                    } else {
                        setIsProfileOpen(true);
                    }
                }}
                onSummarize={handleSummarize}
                isSummarizing={isSummarizing}
                currentUserId={currentUserId}
                isMuted={isMuted}
            />

            {/* Pinned Message Banner */}
            {pinnedMessage && (
                <div 
                    className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2 flex items-center justify-between sticky top-0 z-20 cursor-pointer hover:bg-slate-50 transition-colors animate-in slide-in-from-top duration-300 shrink-0"
                    onClick={() => scrollToMessage(pinnedMessage.id)}
                >
                    <div className="flex items-center min-w-0 flex-1">
                        <PinIcon className="h-4 w-4 text-green-600 mr-3 shrink-0" />
                        <div className="truncate min-w-0">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none mb-0.5">Pinned Message</p>
                            <p className="text-xs font-bold text-slate-700 truncate">
                                {pinnedMessage.text || (pinnedMessage.imageUrl ? 'Photo' : pinnedMessage.poll ? 'Poll' : pinnedMessage.file ? 'File' : 'Media')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePin(pinnedMessage.id); }} 
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors ml-2 shrink-0"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                </div>
            )}
            
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden z-10 no-scrollbar min-h-0">
                {summary && <SummaryBanner text={summary} onClose={() => setSummary(null)} />}
                
                <div className="flex flex-col pb-4 px-2 sm:px-4 w-full min-w-0">
                    {conversation.messages.length === 0 ? (
                        // Empty state with loading placeholders
                        <div className="flex-1 flex items-center justify-center px-6 py-10">
                            <div className="max-w-sm w-full text-center">
                                <div className="h-16 w-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                                    <MessengerIcon className="h-8 w-8" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 mb-2">
                                    {isLoading ? 'Loading messages...' : 'No messages yet'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {isLoading ? 'Syncing your conversation history' : 'Start the conversation by sending a message'}
                                </p>
                                {isLoading && (
                                    <div className="mt-6 space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <MessagePlaceholder key={`placeholder-${i}`} isOwnMessage={i % 2 === 0} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        groupedMessages.map((item, idx) => {
                        if (item.type === 'date') {
                            return (
                                <div key={`date-${idx}`} className="flex justify-center w-full my-4 sm:my-6 sticky top-2 z-10 pointer-events-none shrink-0">
                                    <span className="bg-slate-200/60 backdrop-blur-md text-slate-500 text-[9px] sm:text-[11px] px-3 py-1 rounded-full uppercase tracking-widest font-black shadow-sm border border-white/20 whitespace-nowrap">
                                        {item.content as string}
                                    </span>
                                </div>
                            );
                        }
                        const msg = item.content as Message;
                        // Check if message is from current user (support both 'me' for legacy and actual user ID)
                        const isOwnMessage = msg.senderId === 'me' || msg.senderId === currentUserId;
                        return (
                            <div id={`msg-${msg.id}`} key={msg.id} className={`${item.isLastInGroup ? 'mb-2' : 'mb-0.5'} transition-colors duration-500 rounded-xl w-full min-w-0`}>
                                <MessageBubble 
                                    message={msg} 
                                    isOwnMessage={isOwnMessage} 
                                    onReply={() => setReplyingTo(msg)}
                                    onScrollToMessage={scrollToMessage}
                                    replyToMessage={msg.replyToId ? conversation.messages.find(m => m.id === msg.replyToId) : undefined}
                                    participants={conversation.participants}
                                    onContextMenu={handleContextMenu}
                                    isFirstInGroup={item.isFirstInGroup}
                                    isLastInGroup={item.isLastInGroup}
                                    onVotePoll={onVotePoll}
                                />
                            </div>
                        );
                    }))}
                    {(isLoading || isGeneratingImage) && <TypingIndicator users={[]} />}
                    {typingUsers.length > 0 && (
                        <TypingIndicator 
                            users={typingUsers
                                .map(userId => conversation.participants.find(p => p.id === userId))
                                .filter((user): user is User => user !== undefined)}
                        />
                    )}
                    <div ref={messagesEndRef} className="shrink-0 h-px" />
                </div>
            </div>
            
            <div className="flex flex-col bg-white/95 backdrop-blur-md z-20 border-t border-slate-100 pb-safe shrink-0">
                {/* Reply Preview Bar */}
                {replyingTo && (
                    <div className="px-3 sm:px-4 py-2 border-b border-slate-100 flex items-center bg-slate-50/50 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="w-1 bg-green-500 self-stretch rounded-full mr-3 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-black text-green-600 uppercase tracking-widest mb-0.5">
                                Replying to {conversation.participants.find(p => p.id === replyingTo.senderId)?.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate leading-relaxed">
                                {replyingTo.text || (replyingTo.imageUrl ? 'Photo' : replyingTo.poll ? 'Poll' : replyingTo.file ? 'File' : 'Media')}
                            </p>
                        </div>
                        <button 
                            onClick={() => setReplyingTo(null)} 
                            className="p-1.5 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors ml-2 shrink-0"
                        >
                            <CloseIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {!isLoading && smartReplies.length > 0 && (
                    <div className="flex items-center space-x-2 px-3 sm:px-4 pt-2 sm:pt-3 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2 duration-300">
                        {smartReplies.map((reply, i) => (
                            <button
                                key={i}
                                onClick={() => handleSmartReplyClick(reply)}
                                className="bg-white border border-slate-200 text-slate-600 text-xs sm:text-[13px] font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all shadow-sm active:scale-95 shrink-0"
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                )}

                <MessageInput 
                    onSendMessage={onSendMessage} 
                    onOpenPoll={() => setIsPollModalOpen(true)}
                    conversationId={conversation.id !== 'gemini-chat' ? conversation.id : undefined}
                    currentUserId={currentUserId}
                    onGenerateImage={async (p) => {
                        setIsGeneratingImage(true);
                        const url = await generateImage(p);
                        setIsGeneratingImage(false);
                        return url;
                    }}
                    isLoading={isLoading || isGeneratingImage} 
                />
            </div>

            {/* Poll Creation Modal - Fixed Centering & Fully Responsive */}
            {isPollModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white rounded-[32px] sm:rounded-[40px] w-[92vw] max-w-md p-6 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6 sm:mb-8 shrink-0">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Create Poll</h3>
                            <button 
                                onClick={() => setIsPollModalOpen(false)} 
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto no-scrollbar px-1">
                            <div>
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2.5 block px-1">Question</label>
                                <input 
                                    type="text" 
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                    placeholder="What's the question?"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[22px] py-3.5 sm:py-4 px-4 sm:px-5 text-sm sm:text-[15px] font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none"
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-1">Options</label>
                                <input 
                                    type="text" 
                                    value={pollOption1}
                                    onChange={(e) => setPollOption1(e.target.value)}
                                    placeholder="Option 1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 px-4 sm:px-5 text-sm sm:text-[14px] font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={pollOption2}
                                    onChange={(e) => setPollOption2(e.target.value)}
                                    placeholder="Option 2"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 px-4 sm:px-5 text-sm sm:text-[14px] font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-8 sm:mt-12 flex space-x-3 sm:space-x-4 shrink-0">
                            <button 
                                onClick={() => setIsPollModalOpen(false)}
                                className="flex-1 py-3.5 sm:py-4.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl sm:rounded-[22px] font-black text-sm transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreatePoll}
                                disabled={!pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()}
                                className="flex-1 py-3.5 sm:py-4.5 bg-green-600 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl sm:rounded-[22px] font-black text-sm shadow-xl shadow-green-500/20 transition-all active:scale-95"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Placeholder Component */}
            {contextMenu && (
                <MessageContextMenu 
                    x={contextMenu.x}
                    y={contextMenu.y}
                    message={contextMenu.msg}
                    onClose={() => setContextMenu(null)}
                    onReply={(msg) => setReplyingTo(msg)}
                    onDelete={onDeleteMessage}
                    onCopy={(t) => navigator.clipboard.writeText(t)}
                    onPin={onTogglePin}
                    onStar={onToggleStar}
                    onReport={() => {}}
                    onReact={onAddReaction}
                    onTranslate={() => handleTranslate(contextMenu.msg)}
                />
            )}
        </div>
    );
};

// Message placeholder component for loading states
const MessagePlaceholder: React.FC<{ isOwnMessage: boolean }> = ({ isOwnMessage }) => {
    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full animate-pulse`}>
            <div className={`max-w-[75%] sm:max-w-[60%] flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 space-x-reverse`}>
                {/* Avatar placeholder */}
                <div className="h-8 w-8 rounded-full bg-slate-200 flex-shrink-0"></div>
                {/* Message bubble placeholder */}
                <div className={`flex-1 ${isOwnMessage ? 'bg-green-200' : 'bg-slate-200'} rounded-2xl p-4`}>
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-300 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-300 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};