
import React, { useEffect, useRef, useState } from 'react';
import type { Conversation } from '../types';
import { 
    PinIcon, 
    BellOffIcon, 
    MessageIcon, 
    EyeIcon, 
    ArchiveIcon, 
    XCircleIcon, 
    TrashIcon,
    ChevronRightIcon,
    CheckIcon
} from '../constants';

interface ConversationContextMenuProps {
    x: number;
    y: number;
    conversation: Conversation;
    onClose: () => void;
    onTogglePin: (id: string) => void;
    onDelete: (id: string) => void;
    onMute?: (mutedUntil: number | null) => Promise<void>;
    onUnmute?: () => Promise<void>;
    onOpenGroupSettings?: () => void;
    mutedUntil?: number | null;
}

const sounds = [
    'Default', 'None', 'Note', 'Aurora', 'Bamboo', 'Chord', 'Circles', 
    'Complete', 'Hello', 'Input', 'Keys', 'Popcorn', 'Pulse', 'Synth', 
    'Tri-tone', 'Tremolo', 'Alert', 'Bell', 'Calypso', 'Chime', 'Glass'
];

export const ConversationContextMenu: React.FC<ConversationContextMenuProps> = ({
    x, y, conversation, onClose, onTogglePin, onDelete, onMute, onUnmute, onOpenGroupSettings, mutedUntil
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [activeSubMenu, setActiveSubMenu] = useState<'mute' | null>(null);
    const [activeSoundMenu, setActiveSoundMenu] = useState(false);
    const [selectedSound, setSelectedSound] = useState('Default');

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Calculate position
    const style: React.CSSProperties = {
        top: y,
        left: x,
    };

    const menuWidth = 256; // w-64
    const subMenuWidth = 224; // w-56
    const soundMenuWidth = 208; // w-52
    const totalPotentialWidth = menuWidth + subMenuWidth + soundMenuWidth + 8;

    if (x + totalPotentialWidth > window.innerWidth) {
        style.left = x - menuWidth;
    }
    if (y + 500 > window.innerHeight) {
        style.top = window.innerHeight - 510;
    }

    return (
        <div 
            ref={menuRef}
            className="fixed z-[1000] flex items-start"
            style={style}
        >
            {/* Main Menu */}
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-[24px] w-64 py-2 animate-in fade-in zoom-in-95 duration-150">
                <ContextMenuItem 
                    icon={<PinIcon className="h-4 w-4" />} 
                    label={conversation.isPinned ? "Unpin" : "Pin"} 
                    onClick={() => { onTogglePin(conversation.id); onClose(); }} 
                />
                {(() => {
                    const isMuted = mutedUntil !== undefined && mutedUntil !== null && (mutedUntil === -1 || mutedUntil > Date.now());
                    return (
                        <ContextMenuItem 
                            icon={<BellOffIcon className="h-4 w-4" />} 
                            label={isMuted ? "Unmute" : "Mute"} 
                            hasChevron={!isMuted}
                            active={activeSubMenu === 'mute'}
                            onClick={() => {
                                if (isMuted && onUnmute) {
                                    onUnmute();
                                    onClose();
                                } else {
                                    setActiveSubMenu(activeSubMenu === 'mute' ? null : 'mute');
                                    setActiveSoundMenu(false);
                                }
                            }} 
                        />
                    );
                })()}
                {conversation.type === 'group' && onOpenGroupSettings && (
                    <ContextMenuItem 
                        icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>} 
                        label="Group Settings" 
                        onClick={() => { onOpenGroupSettings(); onClose(); }} 
                    />
                )}
                <ContextMenuItem 
                    icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-1 9c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z"/></svg>} 
                    label="Mark As Unread" 
                    onClick={onClose} 
                />
                <ContextMenuItem 
                    icon={<EyeIcon className="h-4 w-4" />} 
                    label="Preview" 
                    onClick={onClose} 
                />
                <div className="h-px bg-slate-100 my-1.5" />
                <ContextMenuItem 
                    icon={<ArchiveIcon className="h-4 w-4" />} 
                    label="Archive" 
                    onClick={onClose} 
                />
                <div className="h-px bg-slate-100 my-1.5" />
                <ContextMenuItem 
                    icon={<XCircleIcon className="h-4 w-4" />} 
                    label="Clear History" 
                    onClick={onClose} 
                />
                <ContextMenuItem 
                    icon={<TrashIcon className="h-4 w-4" />} 
                    label="Delete Chat" 
                    variant="danger" 
                    onClick={() => { onDelete(conversation.id); onClose(); }} 
                />
            </div>

            {/* Mute Sub Menu */}
            {activeSubMenu === 'mute' && (
                <div className="ml-1 bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-[24px] w-56 py-2 animate-in fade-in slide-in-from-left-2 duration-150">
                    <ContextMenuItem 
                        icon={<BellZIcon className="h-4 w-4" />} 
                        label="For 1 Hour" 
                        onClick={() => { onMute && onMute(Date.now() + 60 * 60 * 1000); onClose(); }} 
                    />
                    <ContextMenuItem 
                        icon={<BellZIcon className="h-4 w-4" />} 
                        label="For 8 Hours" 
                        onClick={() => { onMute && onMute(Date.now() + 8 * 60 * 60 * 1000); onClose(); }} 
                    />
                    <ContextMenuItem 
                        icon={<BellZSmallIcon className="h-4 w-4" />} 
                        label="For 3 Days" 
                        onClick={() => { onMute && onMute(Date.now() + 3 * 24 * 60 * 60 * 1000); onClose(); }} 
                    />
                    <div className="h-px bg-slate-100 my-1.5" />
                    <ContextMenuItem 
                        icon={<ClockIcon className="h-4 w-4" />} 
                        label="Mute Until..." 
                        onClick={onClose} 
                    />
                    <ContextMenuItem 
                        icon={<BellOffIcon className="h-4 w-4" />} 
                        label="Forever" 
                        onClick={() => { onMute && onMute(-1); onClose(); }} 
                    />
                    <div className="h-px bg-slate-100 my-1.5" />
                    <ContextMenuItem 
                        icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>} 
                        label="Sound" 
                        hasChevron
                        active={activeSoundMenu}
                        onClick={() => setActiveSoundMenu(!activeSoundMenu)} 
                    />
                </div>
            )}

            {/* Sound Sub Menu */}
            {activeSubMenu === 'mute' && activeSoundMenu && (
                <div className="ml-1 bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-[24px] w-52 py-2 max-h-[480px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-left-2 duration-150">
                    {sounds.map((sound, idx) => (
                        <button 
                            key={sound}
                            onClick={() => { setSelectedSound(sound); onClose(); }}
                            className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors w-full text-left group"
                        >
                            <span className={`text-[14px] font-bold tracking-tight ${selectedSound === sound ? 'text-green-600' : 'text-slate-700'}`}>
                                {sound}
                            </span>
                            {selectedSound === sound && <CheckIcon className="h-4 w-4 text-green-600" />}
                            {sound === 'Synth' && idx < sounds.length - 1 && <div className="absolute left-0 right-0 h-px bg-slate-100 mt-[34px]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const ContextMenuItem: React.FC<{ 
    icon: React.ReactNode, 
    label: string, 
    onClick: () => void, 
    variant?: 'default' | 'danger',
    hasChevron?: boolean,
    active?: boolean
}> = ({ icon, label, onClick, variant = 'default', hasChevron, active }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }} 
        className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors w-full text-left group ${active ? 'bg-slate-50' : ''}`}
    >
        <div className="flex items-center">
            <span className={`mr-4 ${variant === 'danger' ? 'text-red-500' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`}>
                {icon}
            </span>
            <span className={`text-[14px] font-bold tracking-tight ${variant === 'danger' ? 'text-red-500' : 'text-slate-700'}`}>
                {label}
            </span>
        </div>
        {hasChevron && <ChevronRightIcon className={`h-4 w-4 transition-colors ${active ? 'text-slate-600' : 'text-slate-300 group-hover:text-slate-400'}`} />}
    </button>
);

const BellZIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zM9 9h4l-4 4h4" stroke="currentColor" strokeWidth="0.5" fill="none" />
        <path d="M10 10h3l-3 3h3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
);

const BellZSmallIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        <path d="M14 7h2l-2 2h2" fill="none" stroke="white" strokeWidth="0.8" />
    </svg>
);

const ClockIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
);
