
import React from 'react';
import type { Conversation, User, Call } from './types';
import { meAvatar, aliceAvatar, bobAvatar, charlieAvatar } from './assets';

// Define app icon path directly to avoid import issues
const appIcon = '/assets/icon.png';

export const Logo: React.FC<{className?: string}> = ({ className = '' }) => {
    const [imageError, setImageError] = React.useState(false);
    
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {!imageError && (
                <img 
                    src={appIcon} 
                    alt="Riingr" 
                    className="h-10 w-10 object-contain"
                    onError={() => {
                        console.warn('Logo image failed to load, using text only');
                        setImageError(true);
                    }}
                />
            )}
            <span className="text-lg font-bold text-slate-700">Riingr</span>
        </div>
);
};

export const MessengerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="icon-gradient" x1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <path
        d="M51.1,12.1C44,6.2,34.8,5.4,26.4,9.1c-5.7,2.5-10.2,7.3-12.7,13.1c-2.4,5.8-2.4,12.5,0,18.3c2.5,5.7,7.3,10.2,13.1,12.7c5.8,2.4,12.5,2.4,18.3,0c5.7-2.5,10.2-7.3,12.7-13.1C60.6,44.4,60.6,35.2,56,26.4C54.1,21.8,51.1,12.1,51.1,12.1z M43.7,28.9l-8.9,8.9c-1.3,1.3-3.3,1.3-4.6,0l-8.9-8.9c-1.3-1.3-1.3-3.3,0-4.6l8.9-8.9c1.3-1.3,3.3-1.3,4.6,0l8.9,8.9C44.9,25.6,44.9,27.6,43.7,28.9z M30,41.2c-6.1,0-11.2-5-11.2-11.2S23.9,18.8,30,18.8s11.2,5,11.2,11.2S36.1,41.2,30,41.2z"
        fill="url(#icon-gradient)"
      />
    </svg>
);

export const UsersIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);

export const UserPlusIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);

export const EditIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
);

export const SendIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/>
    </svg>
);

export const ArrowLeftIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
);

export const MenuIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
    </svg>
);

export const ReplyIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
    </svg>
);

export const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
);

export const PlusIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
);

export const ImageIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>
);

export const PhoneIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
);

export const MessageIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
);

export const CallIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01c-.36-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.72 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
    </svg>
);

export const SettingsIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
);

export const CheckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
);

export const DoubleCheckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
    </svg>
);

export const CopyIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
);

export const PinIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 9V4l1 1V2H7v3l1-1v5L6 12v2h5v7l1 1 1-1v-7h5v-2l-2-3z"/>
    </svg>
);

export const StarIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
);

export const FlagIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/>
    </svg>
);

export const MoreIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
);

// Added GiftIcon and HelpIcon as they are used in SettingsView
export const GiftIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.5 2.5 0 0 0-5-0c0 .35.07.69.18 1H11c.11-.31.18-.65.18-1a2.5 2.5 0 0 0-5 0c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-1c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm-6 0c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zM4 8h7v2H4V8zm0 11v-7h7v7H4zm16 0h-7v-7h7v7zm0-9h-7V8h7v2z"/>
    </svg>
);

export const HelpIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
    </svg>
);

// Added StickerIcon, FolderIcon, and StoreIcon as they are used in SettingsView
export const StickerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.5 2h-13C4.12 2 3 3.12 3 4.5v15C3 20.88 4.12 22 5.5 22h13c1.38 0 2.5-1.12 2.5-2.5v-15C21 3.12 19.88 2 18.5 2zM12 12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
    </svg>
);

export const FolderIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
);

export const StoreIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
    </svg>
);

export const BellOffIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zM6.69 4.02L5.27 5.44 18.56 18.73l1.41-1.41L6.69 4.02z" />
    </svg>
);

export const EyeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
);

export const ArchiveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.01 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.49-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12.14l.82 1H5.12z" />
    </svg>
);

export const XCircleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
    </svg>
);

export const ChevronRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

export const INITIAL_CONVERSATIONS: Conversation[] = [
    {
        id: 'group-1',
        type: 'group',
        name: 'Project Team 🚀',
        avatar: 'https://images.unsplash.com/photo-1522071823991-b9671f9d6f8c?w=100&h=100&fit=crop',
        admins: ['me'],
        participants: [
            { id: 'me', name: 'Me', avatar: meAvatar, username: '@me_king', phone: '+27 11 222 3333', birthday: 'July 15' },
            { id: 'user2', name: 'Alice', avatar: aliceAvatar, isOnline: true, username: '@AliceW', phone: '+27 74 111 2222', birthday: 'March 10' },
            { id: 'user3', name: 'Bob', avatar: bobAvatar, isOnline: false, username: '@BobTheBuilder', phone: '+27 74 333 4444', birthday: 'Oct 22' },
            { id: 'user4', name: 'Charlie', avatar: charlieAvatar, isOnline: true, username: '@Char_Lie', phone: '+27 74 457 7576', birthday: 'Jan 5' },
        ],
        messages: [
            { id: 'gsys1', text: 'You created this group', senderId: 'system', timestamp: Date.now() - 10 * 60 * 1000, isSystem: true },
            { id: 'gm1', text: 'Hi everyone, let\'s start the project!', senderId: 'me', timestamp: Date.now() - 9 * 60 * 1000, status: 'read' },
            { id: 'gm2', text: 'I\'m in! 🙋‍♀️', senderId: 'user2', timestamp: Date.now() - 8 * 60 * 1000 },
            { id: 'gm3', text: 'Ready when you are.', senderId: 'user4', timestamp: Date.now() - 7 * 60 * 1000 },
        ],
    },
    {
        id: 'gemini-chat',
        type: 'dm',
        participants: [
            { id: 'me', name: 'Me', avatar: meAvatar, username: '@me_king', phone: '+27 11 222 3333', birthday: 'July 15' },
            { id: 'gemini-chat', name: 'Gemini AI', avatar: 'gemini', isOnline: true, username: '@GeminiAI', phone: 'AI Service', birthday: 'Dec 06' },
        ],
        messages: [
            { id: 'gem-init', text: 'Secure end-to-end encryption used by billions.', senderId: 'system', timestamp: Date.now() - 20000, isSystem: true },
            { id: 'gem1', text: 'Hello! I am Gemini, your intelligent assistant. I can search the web for real-time answers or generate images for you. Just ask!', senderId: 'gemini-chat', timestamp: Date.now() - 10000 },
        ],
    },
    {
        id: '1',
        type: 'dm',
        participants: [
            { id: 'me', name: 'Me', avatar: meAvatar, username: '@me_king', phone: '+27 11 222 3333', birthday: 'July 15' },
            { id: 'user2', name: 'Alice', avatar: aliceAvatar, isOnline: true, username: '@AliceW', phone: '+27 74 111 2222', birthday: 'March 10' },
        ],
        messages: [
            { id: 'sys1', text: 'Messages are end-to-end encrypted', senderId: 'system', timestamp: Date.now() - 3 * 60 * 1000, isSystem: true },
            { id: 'msg1', text: 'Hey, how are you?', senderId: 'me', timestamp: Date.now() - 2 * 60 * 1000, status: 'read' },
            { id: 'msg2', text: "I'm good, thanks! How about you?", senderId: 'user2', timestamp: Date.now() - 1 * 60 * 1000 },
        ],
    },
    {
        id: 'user4-chat',
        type: 'dm',
        participants: [
            { id: 'me', name: 'Me', avatar: meAvatar, username: '@me_king', phone: '+27 11 222 3333', birthday: 'July 15' },
            { id: 'user4', name: 'Big Boss', avatar: charlieAvatar, isOnline: true, username: '@KhayaC', phone: '+27 74 457 7576', birthday: 'Jan 5' },
        ],
        messages: [
            { id: 'msg-bb-1', text: 'Welcome to the team.', senderId: 'user4', timestamp: Date.now() - 1000000 },
        ]
    }
];

export const INITIAL_CALLS: Call[] = [
    { id: 'c1', userId: 'user4', type: 'outgoing', timestamp: Date.now() - 1000000 },
    { id: 'c2', userId: 'user2', type: 'incoming', timestamp: Date.now() - 2000000, duration: '19 sec' },
    { id: 'c3', userId: 'user2', type: 'outgoing', timestamp: Date.now() - 5000000 },
    { id: 'c4', userId: 'user2', type: 'missed', timestamp: Date.now() - 8000000 },
    { id: 'c5', userId: 'user4', type: 'outgoing', timestamp: Date.now() - 12000000, count: 2 },
    { id: 'c6', userId: 'user2', type: 'missed', timestamp: Date.now() - 15000000 },
];
