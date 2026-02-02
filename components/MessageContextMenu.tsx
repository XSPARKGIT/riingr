
import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { 
    ReplyIcon, 
    CopyIcon, 
    TrashIcon, 
    PinIcon, 
    StarIcon, 
    FlagIcon, 
    MoreIcon, 
    ArrowLeftIcon,
    PlusIcon,
    MessengerIcon
} from '../constants';

interface ContextMenuProps {
    x: number;
    y: number;
    message: Message;
    onClose: () => void;
    onReply: (msg: Message) => void;
    onDelete: (id: string) => void;
    onCopy: (text: string) => void;
    onPin: (id: string) => void;
    onStar: (id: string) => void;
    onReport: (id: string) => void;
    onReact: (id: string, emoji: string) => void;
    onTranslate?: () => void; // New action
    currentUserId?: string; // Current user ID to check if message can be deleted
}

const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const allEmojis = [
    '👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🥰', '🎉', '🤔', '👀', '✨', '✅', '❌', '💯', '🚀',
    '🤩', '🤯', '🥳', '💀', '👻', '👽', '👾', '🤖', '💩', '🤡', '🦾', '🧠', '🦷', '💅', '🤳', '✍️', 
    '🤟', '🤘', '🤙', '🤌', '🖖', '👋', '🤝', '🫂', '🫦', '👅', '👄', '👂', '👃', '👣', '👁', '💋',
    '🌞', '🌙', '⭐', '🌈', '☁️', '❄️', '🌊', '🍔', '🍕', '🌮', '🍦', '🍩', '🍺', '🍷', '☕', '⚽',
    '🎮', '🎸', '🎨', '✈️', '🚗', '🏠', '💻', '📱', '💰', '🎁', '🎈', '💎', '🔑', '❤️‍🔥', '💔', '❣️',
    '🦄', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵',
    '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🐝', '🐛', '🦋', '🐌', '🐞',
    '🐜', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡',
    '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏',
    '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩',
    '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦫',
    '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿',
    '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼',
    '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎',
    '🪐', '💫', '☄️', '💥', '⚡', '🔥', '💨', '🌪', '⛈️', '🌦️', '🌥️', '🌦️', '🌧️', '🌨️', '🌨️', '🌬️',
    '💦', '⛲', '⛱️', '🏙️', '🌇', '🌆', '🌃', '🌉', '🌁', '♨️', '🎠', '🎡', '🎢', '⛺', '🏝️', '🌋',
    '🏜️', '🏔️', '🗻', '🏕️', '🏟️', '🏛️', '🏗️', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦',
    '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏰', '🏯', '💒', '🗼', '🗽', '⛪', '🕌', '🕍', '⛩️', '🕋'
];

export const MessageContextMenu: React.FC<ContextMenuProps> = ({
    x, y, message, onClose, onReply, onDelete, onCopy, onPin, onStar, onReport, currentUserId, onReact, onTranslate
}) => {
    const [view, setView] = useState<'main' | 'more' | 'emoji-picker'>('main');
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x, y });

    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let newX = x;
            let newY = y;
            if (x + rect.width > window.innerWidth) newX = window.innerWidth - rect.width - 10;
            if (y + rect.height > window.innerHeight) newY = window.innerHeight - rect.height - 10;
            setPosition({ x: newX, y: newY });
        }
    }, [x, y, view]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleAction = (action: () => void) => {
        // Close menu first to prevent UI blocking
        onClose();
        // Defer action to next tick to prevent blocking
        setTimeout(() => {
            action();
        }, 0);
    };

    return (
        <div 
            ref={menuRef}
            className={`fixed z-[100] bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-[24px] overflow-hidden animate-in fade-in zoom-in-95 ${view === 'emoji-picker' ? 'w-[280px]' : 'w-64'}`}
            style={{ top: position.y, left: position.x }}
        >
            {view === 'main' ? (
                <div className="flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                        {quickEmojis.map(emoji => (
                            <button key={emoji} onClick={() => handleAction(() => onReact(message.id, emoji))} className="text-2xl hover:scale-125 transition-transform p-1">
                                {emoji}
                            </button>
                        ))}
                        <button onClick={() => setView('emoji-picker')} className="p-1.5 rounded-full bg-slate-200 text-slate-500"><PlusIcon className="h-5 w-5" /></button>
                    </div>

                    <div className="flex flex-col py-1.5">
                        <MenuButton icon={<ReplyIcon className="h-4 w-4" />} label="Reply" onClick={() => handleAction(() => onReply(message))} />
                        <MenuButton icon={<StarIcon className={`h-4 w-4 ${message.isStarred ? 'text-yellow-500' : ''}`} />} label={message.isStarred ? "Unstar" : "Star"} onClick={() => handleAction(() => onStar(message.id))} />
                        {message.text && (
                            <MenuButton 
                                icon={<MessengerIcon className="h-4 w-4 text-green-500" />} 
                                label="Translate with AI" 
                                onClick={() => handleAction(() => onTranslate?.())} 
                            />
                        )}
                        <MenuButton icon={<CopyIcon className="h-4 w-4" />} label="Copy text" onClick={() => handleAction(() => onCopy(message.text || ''))} />
                        {/* Only show delete option for own messages */}
                        {(message.senderId === 'me' || message.senderId === currentUserId) && (
                            <MenuButton icon={<TrashIcon className="h-4 w-4" />} label="Delete" variant="danger" onClick={() => handleAction(() => onDelete(message.id))} />
                        )}
                        <MenuButton icon={<MoreIcon className="h-4 w-4" />} label="More options..." onClick={() => setView('more')} />
                    </div>
                </div>
            ) : view === 'more' ? (
                <div className="flex flex-col py-1.5">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center mb-1">
                        <button onClick={() => setView('main')} className="p-1 hover:bg-slate-100 rounded-full mr-2"><ArrowLeftIcon className="h-4 w-4" /></button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">More Options</span>
                    </div>
                    <MenuButton icon={<PinIcon className="h-4 w-4" />} label={message.isPinned ? "Unpin" : "Pin"} onClick={() => handleAction(() => onPin(message.id))} />
                    <MenuButton icon={<FlagIcon className="h-4 w-4" />} label="Report" variant="danger" onClick={() => handleAction(() => onReport(message.id))} />
                </div>
            ) : (
                <div className="flex flex-col h-[300px]">
                    <div className="p-3 border-b border-slate-100 flex items-center bg-white sticky top-0">
                        <button onClick={() => setView('main')} className="p-1 hover:bg-slate-100 rounded-full mr-2"><ArrowLeftIcon className="h-4 w-4" /></button>
                        <span className="text-[12px] font-black text-slate-800">React...</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 grid grid-cols-6 gap-2 no-scrollbar">
                        {allEmojis.map((emoji, idx) => (
                            <button key={idx} onClick={() => handleAction(() => onReact(message.id, emoji))} className="text-2xl hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MenuButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, variant?: 'default' | 'danger' }> = ({ icon, label, onClick, variant = 'default' }) => (
    <button onClick={onClick} className={`flex items-center px-4 py-2.5 hover:bg-slate-50 transition-all w-full text-left ${variant === 'danger' ? 'text-red-500' : 'text-slate-700'}`}>
        <span className="mr-4 opacity-60">{icon}</span>
        <span className="text-[14px] font-bold tracking-tight">{label}</span>
    </button>
);
