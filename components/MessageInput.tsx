
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SendIcon, PlusIcon, ImageIcon, PinIcon, FlagIcon, MoreIcon, CloseIcon, MessengerIcon, FolderIcon, GiftIcon, StarIcon } from '../constants';
import type { Message, User } from '../types';
import { setTypingStatus, clearTypingStatus } from '../services/firestoreService';
import GifPicker from './GifPicker';
import StickerPicker from './StickerPicker';

interface MessageInputProps {
    onSendMessage: (
        text?: string,
        imageUrl?: string,
        location?: Message['location'],
        poll?: Message['poll'],
        file?: Message['file'],
        mentions?: string[]
    ) => void;
    onOpenPoll?: () => void;
    onGenerateImage?: (prompt: string) => Promise<string | void>;
    isLoading: boolean;
    conversationId?: string;
    currentUserId?: string;
    participants?: User[];
}

interface StagedMedia {
    type: 'image' | 'file';
    dataUrl?: string;
    fileInfo?: Message['file'];
    isAI?: boolean;
    file?: File; // Store original file object for upload
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    onOpenPoll,
    onGenerateImage,
    isLoading,
    conversationId,
    currentUserId,
    participants
}) => {
    const [text, setText] = useState('');
    const [caption, setCaption] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [stagedMedia, setStagedMedia] = useState<StagedMedia | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const captionRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingUpdateRef = useRef<number>(0);
    const uploadAbortControllerRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const [mentions, setMentions] = useState<string[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
    const [showMentionList, setShowMentionList] = useState(false);

    const handleTyping = () => {
        if (!conversationId || !currentUserId) return;
        
        const now = Date.now();
        // Throttle to 1 second
        if (now - lastTypingUpdateRef.current < 1000) return;
        
        lastTypingUpdateRef.current = now;
        setTypingStatus(conversationId, currentUserId, true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout to clear typing status after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
            clearTypingStatus(conversationId, currentUserId);
        }, 3000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear typing status when sending message
        if (conversationId && currentUserId) {
            clearTypingStatus(conversationId, currentUserId);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
        
        if (stagedMedia) {
            handleSendStaged();
            return;
        }
        if (text.trim() && !isLoading) {
            onSendMessage(text.trim(), undefined, undefined, undefined, undefined, mentions);
            setText('');
            setMentions([]);
            setShowMentionList(false);
            setShowActions(false);
        }
    };

    const handleSendStaged = () => {
        if (!stagedMedia) return;
        
        // Clear typing status when sending message
        if (conversationId && currentUserId) {
            clearTypingStatus(conversationId, currentUserId);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }

        // Send message directly with base64 data URL (Storage not enabled)
        onSendMessage(
            caption.trim() || undefined,
            stagedMedia.dataUrl,
            undefined,
            undefined,
            stagedMedia.fileInfo,
            mentions
        );
        
        setStagedMedia(null);
        setCaption('');
        setMentions([]);
        setShowActions(false);
    };

    const handleActionClick = (action: () => void) => {
        action();
        setShowActions(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // If there's existing text, move it to caption
            const existingText = text.trim();
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                if (file.type.startsWith('image/')) {
                    setStagedMedia({
                        type: 'image',
                        dataUrl: base64,
                        file: file // Store original file for upload
                    });
                } else {
                    setStagedMedia({
                        type: 'file',
                        file: file, // Store original file for upload
                        fileInfo: {
                            name: file.name,
                            size: (file.size / 1024).toFixed(1) + ' KB',
                            type: file.type.split('/')[1]?.toUpperCase() || 'FILE'
                        }
                    });
                }
                
                // Move existing text to caption and clear input
                if (existingText) {
                    setCaption(existingText);
                    setText('');
                    setMentions([]);
                    setShowMentionList(false);
                }
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleAIGenerate = async () => {
        const prompt = window.prompt("What should Gemini draw?");
        if (prompt && onGenerateImage) {
            setIsGenerating(true);
            try {
                const result = await onGenerateImage(prompt);
                if (result) {
                    // If there's existing text, use it as caption, otherwise use AI prompt
                    const existingText = text.trim();
                    setStagedMedia({
                        type: 'image',
                        dataUrl: result,
                        isAI: true
                    });
                    setCaption(existingText || `AI generated: ${prompt}`);
                    if (existingText) {
                        setText('');
                        setMentions([]);
                        setShowMentionList(false);
                    }
                }
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleSelectGif = (url: string) => {
        // If there's existing text, stage it as an image with caption
        const existingText = text.trim();
        if (existingText) {
            setStagedMedia({
                type: 'image',
                dataUrl: url
            });
            setCaption(existingText);
            setText('');
            setMentions([]);
            setShowMentionList(false);
        } else {
            // Send GIF as image-only message using remote URL
            onSendMessage(undefined, url);
        }
    };

    const handleSelectSticker = (url: string) => {
        // If there's existing text, stage it as an image with caption
        const existingText = text.trim();
        if (existingText) {
            setStagedMedia({
                type: 'image',
                dataUrl: url
            });
            setCaption(existingText);
            setText('');
            setMentions([]);
            setShowMentionList(false);
        } else {
            // Send sticker as image-only message using remote URL
            onSendMessage(undefined, url);
        }
    };

    const handleSendLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                onSendMessage(undefined, undefined, {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            }, (err) => alert("Could not get location"));
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup typing status on unmount
    useEffect(() => {
        return () => {
            if (conversationId && currentUserId) {
                clearTypingStatus(conversationId, currentUserId);
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [conversationId, currentUserId]);

    const renderHighlightedText = (value: string) => {
        if (!value) {
            return (
                <span className="text-slate-400">
                    {isLoading ? 'Thinking...' : 'Message'}
                </span>
            );
        }

        const parts = value.split(/(@[a-zA-Z0-9_]+)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('@')) {
                return (
                    <span key={idx} className="text-green-600 font-semibold">
                        {part}
                    </span>
                );
            }
            return <span key={idx}>{part}</span>;
        });
    };

    return (
        <div className="min-h-[60px] sm:min-h-[72px] flex items-center p-2 sm:p-3 bg-white relative">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            
            {/* Media Editor Preview - Rendered via Portal to escape parent constraints */}
            {stagedMedia && createPortal(
                <div 
                    className="fixed inset-0 bg-[#0b141a] z-[9999] flex flex-col"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh'
                    }}
                >
                    <div className="flex items-center justify-between p-4 z-10">
                        <button onClick={() => { setStagedMedia(null); setCaption(''); }} className="p-3 rounded-full text-white/90 hover:bg-white/10 transition-all">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
                        {stagedMedia.type === 'image' ? (
                            <img src={stagedMedia.dataUrl} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" alt="Preview" />
                        ) : (
                            <div className="bg-slate-800/50 backdrop-blur-md rounded-[40px] p-8 sm:p-16 flex flex-col items-center border border-white/5 shadow-2xl">
                                <div className="h-20 w-20 sm:h-32 sm:w-32 bg-sky-500 rounded-[24px] sm:rounded-[32px] flex items-center justify-center mb-6 sm:mb-8 shadow-xl">
                                    <FolderIcon className="h-10 w-10 sm:h-16 sm:w-16 text-white" />
                                </div>
                                <h4 className="text-xl sm:text-2xl font-black text-white text-center mb-2">{stagedMedia.fileInfo?.name}</h4>
                            </div>
                        )}
                    </div>
                    <div className="w-full bg-[#0b141a]/90 backdrop-blur-md pb-8 pt-4 px-4 flex flex-col space-y-4">
                        <div className="max-w-4xl mx-auto w-full flex items-end space-x-3">
                            <div className="flex-1 bg-[#202c33] rounded-2xl p-2 flex items-end border border-white/5 shadow-lg">
                                <textarea
                                    ref={captionRef}
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Add a caption..."
                                    className="flex-1 bg-transparent border-none py-2 px-1 text-white text-[15px] focus:outline-none resize-none max-h-32 placeholder:text-white/30"
                                    rows={1}
                                />
                            </div>
                            <button 
                                onClick={handleSendStaged}
                                className="h-12 w-12 sm:h-14 sm:w-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95"
                            >
                                <SendIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-1.5 sm:space-x-2 w-full">
                <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setShowActions(!showActions)}
                        className={`p-2 sm:p-2.5 rounded-full transition-all ${showActions ? 'bg-slate-200 rotate-45' : 'hover:bg-slate-100'} text-slate-500`}
                        disabled={isLoading || isGenerating}
                    >
                        {isGenerating ? (
                            <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                    </button>

                    {showActions && (
                        <div className="absolute bottom-12 sm:bottom-14 left-0 bg-white border border-slate-200 shadow-xl rounded-2xl sm:rounded-3xl py-1.5 sm:py-2 w-48 sm:w-56 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                            <div className="flex flex-col">
                                <ActionButton 
                                    icon={<MessengerIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />} 
                                    label="AI Image Gen" 
                                    onClick={() => handleActionClick(handleAIGenerate)} 
                                    delay="0ms"
                                />
                                <ActionButton 
                                    icon={<ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />} 
                                    label="Photo" 
                                    onClick={() => handleActionClick(() => fileInputRef.current?.click())} 
                                    delay="50ms"
                                />
                                <ActionButton 
                                    icon={<GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />} 
                                    label="GIF" 
                                    onClick={() => handleActionClick(() => setShowGifPicker(true))} 
                                    delay="75ms"
                                />
                                <ActionButton 
                                    icon={<StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />} 
                                    label="Sticker" 
                                    onClick={() => handleActionClick(() => setShowStickerPicker(true))} 
                                    delay="100ms"
                                />
                                <ActionButton 
                                    icon={<FolderIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />} 
                                    label="Document" 
                                    onClick={() => handleActionClick(() => fileInputRef.current?.click())} 
                                    delay="125ms"
                                />
                                <ActionButton 
                                    icon={<PinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />} 
                                    label="Location" 
                                    onClick={() => handleActionClick(handleSendLocation)} 
                                    delay="150ms"
                                />
                                <ActionButton 
                                    icon={<FlagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />} 
                                    label="Poll" 
                                    onClick={() => handleActionClick(() => onOpenPoll?.())} 
                                    delay="200ms"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 relative bg-slate-100 rounded-2xl px-3 sm:px-4 py-1 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all overflow-visible">
                    {/* Highlighted text overlay */}
                    <div className="absolute inset-x-3 sm:inset-x-4 top-2 bottom-2 pointer-events-none whitespace-pre-wrap break-words text-[14px] sm:text-[15px] text-slate-800 leading-relaxed" style={{ wordBreak: 'break-word', maxWidth: 'calc(100% - 1.5rem)' }}>
                        {renderHighlightedText(text)}
                    </div>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        className="relative w-full bg-transparent border-none py-2 text-[14px] sm:text-[15px] focus:outline-none resize-none max-h-32 text-transparent caret-slate-800 disabled:opacity-50 min-w-0"
                        onChange={(e) => {
                            const value = e.target.value;
                            setText(value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                            handleTyping();

                            // Mention detection based on caret position
                            const cursor = e.target.selectionStart ?? value.length;
                            const upToCursor = value.slice(0, cursor);
                            const match = upToCursor.match(/(^|\s)@([a-zA-Z0-9_]{1,30})$/);

                            if (match && participants && participants.length > 0) {
                                const query = match[2].toLowerCase();
                                setMentionQuery(query);
                                const filtered = participants.filter((u) => {
                                    const name = (u.name || '').toLowerCase();
                                    const username = (u.username || '').toLowerCase();
                                    return name.includes(query) || username.includes(query);
                                });
                                setMentionSuggestions(filtered.slice(0, 6));
                                setShowMentionList(filtered.length > 0);
                            } else {
                                setShowMentionList(false);
                                setMentionQuery('');
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder=""
                        className="relative w-full bg-transparent border-none py-2 text-[14px] sm:text-[15px] focus:outline-none resize-none max-h-32 text-transparent caret-slate-800 disabled:opacity-50 min-w-0"
                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        disabled={isLoading || isGenerating}
                    />

                    {/* Mentions suggestions */}
                    {showMentionList && mentionSuggestions.length > 0 && (
                        <div className="absolute -top-1 right-0 left-0 mb-1 translate-y-[-100%] w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50">
                            {mentionSuggestions.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => {
                                        const displayHandle =
                                            user.username?.replace(/^@/, '') ||
                                            (user.name ? user.name.split(' ')[0] : 'user');
                                        if (!textareaRef.current) return;
                                        const el = textareaRef.current;
                                        const cursor = el.selectionStart ?? text.length;
                                        const before = text.slice(0, cursor);
                                        const after = text.slice(cursor);
                                        const replaced = before.replace(
                                            /@[a-zA-Z0-9_]{0,30}$/,
                                            `@${displayHandle} `
                                        );
                                        const nextText = replaced + after;
                                        setText(nextText);
                                        setMentions((prev) =>
                                            prev.includes(user.id) ? prev : [...prev, user.id]
                                        );
                                        setShowMentionList(false);
                                        setMentionQuery('');

                                        requestAnimationFrame(() => {
                                            const pos = replaced.length;
                                            el.selectionStart = el.selectionEnd = pos;
                                            el.focus();
                                        });
                                    }}
                                    className="w-full flex items-center px-3 py-2 hover:bg-slate-50 text-left"
                                >
                                    <div className="h-7 w-7 rounded-full bg-slate-100 mr-2 overflow-hidden flex-shrink-0">
                                        {user.avatar && (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-slate-800 truncate">
                                            {user.name || user.username}
                                        </span>
                                        {user.username && (
                                            <span className="text-[10px] font-semibold text-slate-400 truncate">
                                                {user.username}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className={`flex-shrink-0 rounded-full p-2 sm:p-2.5 transition-all ${
                        text.trim() && !isLoading && !isGenerating
                        ? 'bg-green-600 text-white shadow-lg shadow-green-100 active:scale-90' 
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    disabled={isLoading || isGenerating || !text.trim()}
                >
                    <SendIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
            </form>

            {/* Klipy GIF & Sticker pickers */}
            <GifPicker
                isOpen={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                onSelect={handleSelectGif}
            />
            <StickerPicker
                isOpen={showStickerPicker}
                onClose={() => setShowStickerPicker(false)}
                onSelect={handleSelectSticker}
            />
        </div>
    );
};

const ActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, delay: string }> = ({ icon, label, onClick, delay }) => (
    <button 
        type="button"
        onClick={onClick}
        style={{ animationDelay: delay }}
        className="flex items-center w-full px-3 py-1.5 sm:px-3.5 sm:py-2 hover:bg-slate-50 transition-colors group animate-in slide-in-from-bottom-2 fade-in"
    >
        <div className="mr-2.5 sm:mr-3 transition-transform group-hover:scale-110 duration-200 text-slate-500 group-hover:text-slate-800">
            {icon}
        </div>
        <span className="text-[11px] sm:text-[12px] font-semibold text-slate-600 tracking-[0.14em] uppercase">
            {label}
        </span>
    </button>
);
