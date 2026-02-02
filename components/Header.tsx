
import React, { useState, useRef, useEffect } from 'react';
import { Logo, MenuIcon, TrashIcon } from '../constants';

interface HeaderProps {
    onReset?: () => void;
    isOnline?: boolean;
    syncQueueCount?: number;
    isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, isOnline = true, syncQueueCount = 0, isSyncing = false }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm z-50 pt-safe relative">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16 relative">
                    <div className="flex items-center space-x-3">
                        <Logo className="h-10 w-auto" />
                        {/* Connection and Sync Status Indicators */}
                        {!isOnline ? (
                            <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                                Offline
                            </div>
                        ) : isSyncing ? (
                            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Syncing...
                            </div>
                        ) : syncQueueCount > 0 ? (
                            <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                                {syncQueueCount} pending
                            </div>
                        ) : null}
                    </div>
                    <div className="flex items-center relative z-[10000]" ref={menuRef}>
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 rounded-full transition-colors ${
                                showMenu ? 'bg-slate-100' : 'hover:bg-gray-100'
                            }`}
                            aria-label="Menu"
                        >
                            <MenuIcon className="h-6 w-6 text-slate-600" />
                        </button>

                        {showMenu && (
                            <div 
                                className="absolute right-0 top-full mt-2 bg-white border-2 border-slate-300 shadow-2xl rounded-xl py-2 w-48 z-[9999]"
                                style={{ minWidth: '192px' }}
                            >
                                <button 
                                    onClick={() => {
                                        onReset?.();
                                        setShowMenu(false);
                                    }}
                                    className="flex items-center w-full px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors text-left"
                                >
                                    <TrashIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="text-sm font-medium">Reset All Data</span>
                                </button>
                                <div className="border-t border-slate-200 my-1"></div>
                                <div className="px-4 py-2.5">
                                    <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                                        VERSION 1.0.0
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
