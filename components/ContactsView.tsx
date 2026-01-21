import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { UserPlusIcon, MessengerIcon, CheckIcon, PhoneIcon, UsersIcon, CloseIcon } from '../constants';
import { searchUsers, addContact } from '../services/firestoreService';

interface ContactsViewProps {
    users: User[];
    onSelectContact: (user: User) => void;
    currentUserId?: string;
    onContactAdded?: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ 
    users, 
    onSelectContact, 
    currentUserId,
    onContactAdded 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewContactMenuOpen, setIsNewContactMenuOpen] = useState(false);
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'lastSeen'>('name');
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [addingContactId, setAddingContactId] = useState<string | null>(null);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsNewContactMenuOpen(false);
            }
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setIsSortMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchTerm.trim() || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const results = await searchUsers(searchTerm.trim());
                // Filter out current user and already added contacts
                const contactIds = new Set(users.map(u => u.id));
                const filtered = results.filter(
                    user => user.id !== currentUserId && !contactIds.has(user.id)
                );
                setSearchResults(filtered);
            } catch (error: any) {
                console.error('Search error:', error);
                setSearchError(error.message || 'Failed to search users');
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, users, currentUserId]);

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else {
            if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
            return a.isOnline ? -1 : 1;
        }
    });

    const handleAddContact = async (user: User) => {
        if (!currentUserId) {
            setSearchError('You must be logged in to add contacts');
            return;
        }

        setAddingContactId(user.id);
        setSearchError(null);

        try {
            await addContact(currentUserId, user.id);
            setSearchTerm('');
            setSearchResults([]);
        setIsAddContactModalOpen(false);
            onContactAdded?.();
        } catch (error: any) {
            console.error('Error adding contact:', error);
            setSearchError(error.message || 'Failed to add contact');
        } finally {
            setAddingContactId(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Contacts Header */}
            <div className="p-4 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative" ref={sortMenuRef}>
                        <button 
                            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                            className="text-[13px] font-bold text-green-600 hover:opacity-70 transition-opacity"
                        >
                            Sort
                        </button>
                        
                        {isSortMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[20px] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <button 
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
                                    onClick={() => {
                                        setSortBy('lastSeen');
                                        setIsSortMenuOpen(false);
                                    }}
                                >
                                    <span className="text-[15px] font-bold tracking-tight text-slate-700">by Last Seen</span>
                                    {sortBy === 'lastSeen' && <CheckIcon className="h-4 w-4 text-green-600" />}
                                </button>
                                <button 
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
                                    onClick={() => {
                                        setSortBy('name');
                                        setIsSortMenuOpen(false);
                                    }}
                                >
                                    <span className="text-[15px] font-bold tracking-tight text-slate-700">by Name</span>
                                    {sortBy === 'name' && <CheckIcon className="h-4 w-4 text-green-600" />}
                                </button>
                            </div>
                        )}
                    </div>
                    <h2 className="text-[17px] font-black text-slate-800 tracking-tight">Contacts</h2>
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsNewContactMenuOpen(!isNewContactMenuOpen)}
                            className={`p-1 rounded-lg transition-colors ${isNewContactMenuOpen ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'}`}
                        >
                            <UserPlusIcon className="h-6 w-6" />
                        </button>

                        {isNewContactMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[20px] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button 
                                    className="w-full flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                                    onClick={() => {
                                        setIsAddContactModalOpen(true);
                                        setIsNewContactMenuOpen(false);
                                    }}
                                >
                                    <span className="mr-3 opacity-60 text-slate-700">
                                        <UserPlusIcon className="h-5 w-5" />
                                    </span>
                                    <span className="text-[15px] font-bold tracking-tight text-slate-700">Add Contact</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search (⌘K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-xl py-2 px-10 text-sm focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                    />
                    <div className="absolute left-3 top-2.5 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div 
                            key={user.id}
                            onClick={() => onSelectContact(user)}
                            className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                            <div className="relative h-12 w-12 flex-shrink-0 mr-4">
                                {user.avatar === 'gemini' ? (
                                    <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <MessengerIcon className="h-8 w-8 text-green-500" />
                                    </div>
                                ) : (
                                    <img 
                                        className="h-full w-full rounded-full object-cover border border-slate-100" 
                                        src={user.avatar} 
                                        alt={user.name} 
                                    />
                                )}
                                {user.isOnline && (
                                    <span className="absolute bottom-0.5 right-0.5 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 border-b border-slate-50 pb-3 group-last:border-0">
                                <p className="text-[15px] font-bold text-slate-800 truncate">{user.name}</p>
                                <p className="text-[13px] text-slate-400 font-medium">
                                    {user.isOnline ? 'online' : 'last seen recently'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-10 text-center flex flex-col items-center">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <UsersIcon className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">No contacts found</p>
                    </div>
                )}
            </div>

            {/* Add Contact Modal - Search Based */}
            {isAddContactModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-[400px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <button 
                                onClick={() => {
                                    setIsAddContactModalOpen(false);
                                    setSearchTerm('');
                                    setSearchResults([]);
                                    setSearchError(null);
                                }} 
                                className="p-1 -ml-1 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            >
                                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M15 9l-6 6M9 9l6 6" />
                                </svg>
                            </button>
                            <h3 className="text-[18px] font-black text-slate-800 flex-1 text-center mr-9">Add Contact</h3>
                        </div>
                        
                        <div className="mb-6">
                            <div className="relative">
                            <input 
                                type="text" 
                                    placeholder="Search by email or username" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-[16px] font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                                    autoFocus
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            {searchError && (
                                <p className="mt-2 text-xs text-red-500 font-bold px-2">{searchError}</p>
                            )}
                            {searchTerm.length > 0 && searchTerm.length < 2 && (
                                <p className="mt-2 text-xs text-slate-400 font-bold px-2">Type at least 2 characters to search</p>
                            )}
                        </div>

                        {/* Search Results */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {searchResults.length > 0 ? (
                                <div className="space-y-2">
                                    {searchResults.map(user => (
                                        <div 
                                            key={user.id}
                                            className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="relative h-12 w-12 flex-shrink-0 mr-4">
                                                {user.avatar === 'gemini' ? (
                                                    <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                        <MessengerIcon className="h-8 w-8 text-green-500" />
                                                    </div>
                                                ) : (
                                                    <img 
                                                        className="h-full w-full rounded-full object-cover border border-slate-100" 
                                                        src={user.avatar} 
                                                        alt={user.name} 
                                                    />
                                                )}
                                                {user.isOnline && (
                                                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-bold text-slate-800 truncate">{user.name}</p>
                                                <p className="text-[13px] text-slate-400 font-medium truncate">
                                                    {user.email} {user.username && `• ${user.username}`}
                                                </p>
                                            </div>
                        <button 
                                                onClick={() => handleAddContact(user)}
                                                disabled={addingContactId === user.id}
                                                className="ml-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm transition-all active:scale-95 shrink-0"
                        >
                                                {addingContactId === user.id ? 'Adding...' : 'Add'}
                        </button>
                                        </div>
                                    ))}
                                </div>
                            ) : searchTerm.length >= 2 && !isSearching && !searchError ? (
                                <div className="p-8 text-center">
                                    <div className="bg-slate-100 p-4 rounded-full mb-4 inline-block">
                                        <UsersIcon className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">No users found</p>
                                    <p className="text-xs text-slate-300 mt-1">Try searching by email or username</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
