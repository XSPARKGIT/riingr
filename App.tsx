import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { 
    EditProfileSection, 
    SupportPopup,
    GeneralSettingsView,
    NotificationsSettingsView,
    PrivacySettingsView,
    DataStorageSettingsView,
    AppearanceSettingsView,
    LanguageSettingsView,
    StickersEmojiSettingsView,
    ChatFoldersSettingsView,
    PremiumSettingsView,
    StarsSettingsView,
    BusinessSettingsView,
    GiftSettingsView,
    SetProfileColorView
} from './components/SettingsView';
import { getGeminiResponse } from './services/geminiService';
import { logout as firebaseLogout } from './services/firebaseService';
import { getUserContacts, getOrCreateConversation, subscribeToConversations } from './services/firestoreService';
import { sendMessage as syncSendMessage, startBackgroundSync, stopBackgroundSync, syncAllFromFirestore, subscribeToMessages } from './services/syncService';
import { initConnectionListener } from './services/connectionService';
import { getConversationsLocally, getMessagesLocally, getSyncQueueCount } from './services/localStorageService';
import type { Conversation, Message, User, PollOption } from './types';
import { INITIAL_CONVERSATIONS, MessengerIcon } from './constants';
import { meAvatar } from './assets';

const AUTH_KEY = 'ringr_is_authenticated';
const USER_KEY = 'ringr_current_user';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem(AUTH_KEY) === 'true';
    });

    const [conversations, setConversations] = useState<Conversation[]>(() => {
        const authed = localStorage.getItem(AUTH_KEY) === 'true';
        return authed ? [] : INITIAL_CONVERSATIONS;
    });
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [settingsCategory, setSettingsCategory] = useState<string | null>(null);
    const [isSupportPopupOpen, setIsSupportPopupOpen] = useState(false);
    const [contacts, setContacts] = useState<User[]>([]);
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const prevSyncQueueCountRef = useRef<number>(0);
    const selectedConversationIdRef = useRef<string | null>(selectedConversationId);
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : {
            id: 'me',
            name: 'Riingr User',
            avatar: meAvatar,
            phone: '',
            username: '@user'
        };
    });

    // Keep ref in sync with selectedConversationId
    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    // Load contacts from Firestore when user is authenticated
    useEffect(() => {
        const loadContacts = async () => {
            if (isAuthenticated && currentUser?.id && currentUser.id !== 'me') {
                try {
                    const userContacts = await getUserContacts(currentUser.id);
                    setContacts(userContacts);
                } catch (error) {
                    console.error('Error loading contacts:', error);
                }
            }
        };
        loadContacts();
    }, [isAuthenticated, currentUser?.id]);

    // Initialize connection monitoring, background sync, and load local data
    useEffect(() => {
        if (!isAuthenticated || !currentUser?.id || currentUser.id === 'me') {
            return;
        }

        let unsubscribeConnection: (() => void) | null = null;
        let unsubscribeConversations: (() => void) | null = null;
        let syncQueueInterval: NodeJS.Timeout | null = null;

        try {
            // Reusable function to refresh message sync status from local storage
            const refreshMessageSyncStatus = async (conversationId: string) => {
                try {
                    const localMessages = await getMessagesLocally(conversationId);
                    setConversations(prev => prev.map(convo => {
                        if (convo.id === conversationId) {
                            const localMessageMap = new Map(localMessages.map(m => [m.id, m]));
                            const updatedMessages = convo.messages.map(msg => {
                                const localMsg = localMessageMap.get(msg.id);
                                if (localMsg && localMsg.syncStatus !== msg.syncStatus) {
                                    return { ...msg, syncStatus: localMsg.syncStatus };
                                }
                                return msg;
                            });
                            return {
                                ...convo,
                                messages: updatedMessages.sort((a, b) => a.timestamp - b.timestamp)
                            };
                        }
                        return convo;
                    }));
                } catch (error) {
                    console.error('Error refreshing message sync status:', error);
                }
            };

            // Set up connection listener
            unsubscribeConnection = initConnectionListener(async (online) => {
                setIsOnline(online);
                if (online) {
                    console.log('🌐 Online - syncing data...');
                    // Trigger sync when connection restored
                    await syncAllFromFirestore(currentUser.id).catch(console.error);
                    
                    // Immediately refresh sync status when connection restored
                    const currentConversationId = selectedConversationIdRef.current;
                    if (currentConversationId) {
                        await refreshMessageSyncStatus(currentConversationId);
                    }
                } else {
                    console.log('📴 Offline - using local data');
                }
            });

            // Start background sync
            startBackgroundSync();

            // Monitor sync queue count and update message sync status
            const updateSyncQueueCount = async () => {
                try {
                    const count = await getSyncQueueCount();
                    prevSyncQueueCountRef.current = count;
                    setSyncQueueCount(count);
                    // Set isSyncing if there are items in queue and we're online
                    setIsSyncing(count > 0 && (typeof navigator !== 'undefined' ? navigator.onLine : true));
                    
                    // Always refresh sync status for active conversation
                    if (selectedConversationId) {
                        await refreshMessageSyncStatus(selectedConversationId);
                    }
                } catch (error) {
                    console.error('Error getting sync queue count:', error);
                }
            };

            // Update immediately
            updateSyncQueueCount();

            // Update every 500ms for more responsive UI
            syncQueueInterval = setInterval(updateSyncQueueCount, 500);

            // Set up real-time conversation list listener (only when online)
            if (typeof navigator !== 'undefined' && navigator.onLine) {
                unsubscribeConversations = subscribeToConversations(currentUser.id, (firestoreConversations) => {
                    setConversations(prev => {
                        // Merge conversations, avoiding duplicates
                        const existingMap = new Map<string, Conversation>(prev.map(c => [c.id, c]));
                        
                        firestoreConversations.forEach(firestoreConvo => {
                            const existing = existingMap.get(firestoreConvo.id);
                            if (existing) {
                                // Update existing conversation but preserve local messages
                                existingMap.set(firestoreConvo.id, {
                                    ...firestoreConvo,
                                    messages: existing.messages, // Keep local messages, they're updated via message listener
                                });
                            } else {
                                // New conversation
                                existingMap.set(firestoreConvo.id, firestoreConvo);
                            }
                        });
                        
                        return Array.from(existingMap.values());
                    });
                });
            }
        } catch (error) {
            console.error('Error initializing connection/sync:', error);
        }

        // Load local data on startup
        const loadLocalData = async () => {
            try {
                // Load conversations from local storage
                const localConversations = await getConversationsLocally();
                
                if (localConversations.length > 0) {
                    // Load messages for each conversation
                    const conversationsWithMessages = await Promise.all(
                        localConversations.map(async (convo) => {
                            const messages = await getMessagesLocally(convo.id);
                            // Sort messages by timestamp ascending (oldest first)
                            const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
                            return { ...convo, messages: sortedMessages };
                        })
                    );
                    setConversations(conversationsWithMessages);
                }

                // Sync from Firestore if online
                if (typeof navigator !== 'undefined' && navigator.onLine) {
                    try {
                        await syncAllFromFirestore(currentUser.id);
                        // Reload after sync
                        const syncedConversations = await getConversationsLocally();
                        const conversationsWithMessages = await Promise.all(
                            syncedConversations.map(async (convo) => {
                                const messages = await getMessagesLocally(convo.id);
                                // Sort messages by timestamp ascending (oldest first)
                                const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
                                return { ...convo, messages: sortedMessages };
                            })
                        );
                        setConversations(conversationsWithMessages);
                    } catch (error) {
                        console.error('Error syncing from Firestore:', error);
                        // Continue with local data if sync fails
                    }
                }
            } catch (error) {
                console.error('Error loading local data:', error);
            }
        };

        loadLocalData();

        // Cleanup
        return () => {
            if (unsubscribeConnection) {
                unsubscribeConnection();
            }
            if (unsubscribeConversations) {
                unsubscribeConversations();
            }
            if (syncQueueInterval) {
                clearInterval(syncQueueInterval);
            }
            stopBackgroundSync();
        };
    }, [isAuthenticated, currentUser?.id]);

    const allUniqueUsers = useMemo(() => {
        const userMap = new Map<string, User>();
        // Add contacts
        contacts.forEach(user => {
            userMap.set(user.id, user);
        });
        // Add users from conversations
        conversations.forEach(convo => {
            convo.participants.forEach(user => {
                if (user.id !== 'me' && user.id !== currentUser?.id) {
                    userMap.set(user.id, user);
                }
            });
        });
        return Array.from(userMap.values());
    }, [conversations, contacts, currentUser?.id]);

    const handleLogin = (email: string, userId: string) => {
        // Extract name from email (or you can fetch from Firebase later)
        const emailName = email.split('@')[0];
        const user = {
            id: userId, // Use Firebase UID
            name: emailName.charAt(0).toUpperCase() + emailName.slice(1), // Capitalize first letter
            avatar: meAvatar,
            phone: '', // Not used for email auth
            username: `@${emailName}`
        };
        setCurrentUser(user);
        setConversations([]); // Clear placeholders on login to avoid stale data
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    };

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            try {
                stopBackgroundSync(); // Stop background sync
                await firebaseLogout();
                setIsAuthenticated(false);
                localStorage.removeItem(AUTH_KEY);
                localStorage.removeItem(USER_KEY);
            } catch (error) {
                console.error('Logout error:', error);
                stopBackgroundSync(); // Stop even if logout fails
                // Still clear local state even if Firebase logout fails
            setIsAuthenticated(false);
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(USER_KEY);
            }
        }
    };

    const handleUpdateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                return {
                    ...convo,
                    messages: convo.messages.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg)
                };
            }
            return convo;
        }));
    }, [selectedConversationId]);

    const handleSendMessage = useCallback(async (
        text?: string, 
        imageUrl?: string, 
        location?: Message['location'], 
        poll?: Message['poll'],
        file?: Message['file']
    ) => {
        if (!selectedConversationId || !currentUser?.id) return;

        const messageId = Date.now().toString();
        const newMessage: Message = {
            id: messageId,
            text,
            imageUrl,
            location,
            poll,
            file,
            timestamp: Date.now(),
            senderId: currentUser.id,
            replyToId: replyingTo?.id,
            status: 'sent',
            reactions: [],
            syncStatus: 'pending'
        };

        // Update UI optimistically - sort messages to maintain chronological order
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                const updatedMessages = [...convo.messages, newMessage].sort((a, b) => a.timestamp - b.timestamp);
                return { ...convo, messages: updatedMessages };
            }
            return convo;
        }));
        setReplyingTo(null);

        // Save locally and sync using sync service (skip for gemini-chat)
        if (selectedConversationId !== 'gemini-chat') {
            try {
                await syncSendMessage(selectedConversationId, newMessage);
                
                // Update sync status after successful local save
                setConversations(prev => prev.map(convo => {
                    if (convo.id === selectedConversationId) {
                        return {
                            ...convo,
                            messages: convo.messages.map(msg => 
                                msg.id === messageId 
                                    ? { ...msg, syncStatus: 'syncing' as const }
                                    : msg
                            )
                        };
                    }
                    return convo;
                }));
            } catch (error) {
                console.error('Failed to send message:', error);
                // Update sync status to failed
                setConversations(prev => prev.map(convo => {
                    if (convo.id === selectedConversationId) {
                        return {
                            ...convo,
                            messages: convo.messages.map(msg => 
                                msg.id === messageId 
                                    ? { ...msg, syncStatus: 'failed' as const }
                                    : msg
                            )
                        };
                    }
                    return convo;
                }));
            }
        }

        // Handle Gemini AI chat
        if (selectedConversationId === 'gemini-chat' && !imageUrl && !location && !poll) {
            setIsLoading(true);
            try {
                const currentConvo = conversations.find(c => c.id === selectedConversationId);
                const { text: aiText, sources } = await getGeminiResponse(currentConvo!.messages);
                let finalAiText = aiText;
                
                if (sources && Array.isArray(sources)) {
                    const uniqueLinks = new Array<string>();
                    sources.forEach((chunk: any) => {
                        const uri = chunk.web?.uri || chunk.maps?.uri;
                        if (uri && !uniqueLinks.includes(uri)) uniqueLinks.push(uri);
                    });
                    if (uniqueLinks.length > 0) {
                        const linksMarkdown = uniqueLinks.map((uri, idx) => `[Source ${idx + 1}](${uri})`).join(' ');
                        finalAiText += `\n\n**Sources:** ${linksMarkdown}`;
                    }
                }
                
                const geminiMessage: Message = {
                    id: Date.now().toString() + 'g',
                    text: finalAiText,
                    timestamp: Date.now(),
                    senderId: 'gemini-chat',
                    reactions: []
                };
                setConversations(prev => prev.map(convo => 
                    convo.id === selectedConversationId ? { ...convo, messages: [...convo.messages, geminiMessage] } : convo
                ));
            } finally {
                setIsLoading(false);
            }
        }
    }, [selectedConversationId, conversations, replyingTo, currentUser]);

    const handleVotePoll = useCallback((messageId: string, optionIndex: number) => {
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                return {
                    ...convo,
                    messages: convo.messages.map(msg => {
                        if (msg.id === messageId && msg.poll) {
                            const newOptions = [...msg.poll.options];
                            const option = newOptions[optionIndex];
                            const userId = currentUser?.id || 'me';
                            const alreadyVoted = option.votedBy.includes(userId);
                            if (alreadyVoted) {
                                option.votes -= 1;
                                option.votedBy = option.votedBy.filter(id => id !== userId);
                            } else {
                                option.votes += 1;
                                option.votedBy.push(userId);
                            }
                            return { ...msg, poll: { ...msg.poll, options: newOptions } };
                        }
                        return msg;
                    })
                };
            }
            return convo;
        }));
    }, [selectedConversationId, currentUser]);

    const handleAddReaction = useCallback((messageId: string, emoji: string) => {
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                return {
                    ...convo,
                    messages: convo.messages.map(msg => {
                        if (msg.id === messageId) {
                            const currentReactions = msg.reactions || [];
                            const hasEmoji = currentReactions.includes(emoji);
                            return {
                                ...msg,
                                reactions: hasEmoji ? currentReactions.filter(e => e !== emoji) : [...currentReactions, emoji]
                            };
                        }
                        return msg;
                    })
                };
            }
            return convo;
        }));
    }, [selectedConversationId]);

    const handleDeleteMessage = useCallback((messageId: string) => {
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                return {
                    ...convo,
                    messages: convo.messages.filter(msg => msg.id !== messageId)
                };
            }
            return convo;
        }));
    }, [selectedConversationId]);

    const handleTogglePin = useCallback((messageId: string) => {
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                const targetMsg = convo.messages.find(m => m.id === messageId);
                if (!targetMsg) return convo;
                
                const isPinning = !targetMsg.isPinned;
                
                return {
                    ...convo,
                    messages: convo.messages.map(msg => {
                        if (msg.id === messageId) {
                            return { ...msg, isPinned: isPinning };
                        }
                        // If we are pinning a new message, unpin all others
                        if (isPinning) {
                            return { ...msg, isPinned: false };
                        }
                        return msg;
                    })
                };
            }
            return convo;
        }));
    }, [selectedConversationId]);

    const handleTogglePinConversation = useCallback((convoId: string) => {
        setConversations(prev => prev.map(convo => 
            convo.id === convoId ? { ...convo, isPinned: !convo.isPinned } : convo
        ));
    }, []);

    const handleDeleteConversation = useCallback((convoId: string) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            setConversations(prev => prev.filter(c => c.id !== convoId));
            if (selectedConversationId === convoId) setSelectedConversationId(null);
        }
    }, [selectedConversationId]);

    const handleToggleStar = useCallback((messageId: string) => {
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                return {
                    ...convo,
                    messages: convo.messages.map(msg => msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg)
                };
            }
            return convo;
        }));
    }, [selectedConversationId]);

    const handleSelectConversation = (id: string) => {
        setSelectedConversationId(id);
        setSettingsCategory(null);
        setReplyingTo(null);
    };

    // Real-time message listener for active conversation
    useEffect(() => {
        if (!selectedConversationId || !currentUser?.id || currentUser.id === 'me') {
            return;
        }

        // Only subscribe when online
        if (!isOnline) {
            return;
        }

        // Skip for gemini-chat (local only)
        if (selectedConversationId === 'gemini-chat') {
            return;
        }

        const unsubscribe = subscribeToMessages(selectedConversationId, (newMessages) => {
            setConversations(prev => prev.map(convo => {
                if (convo.id === selectedConversationId) {
                    // Merge messages, avoiding duplicates
                    const existingIds = new Set(convo.messages.map(m => m.id));
                    const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
                    
                    if (uniqueNewMessages.length === 0) {
                        return convo; // No new messages, don't update
                    }
                    
                    // Merge and sort messages
                    const merged = [...convo.messages, ...uniqueNewMessages]
                        .sort((a, b) => a.timestamp - b.timestamp);
                    
                    return { ...convo, messages: merged };
                }
                return convo;
            }));
        });

        return () => unsubscribe();
    }, [selectedConversationId, currentUser?.id, isOnline]);

    const handleSelectContact = async (user: User) => {
        if (!currentUser?.id || currentUser.id === 'me') {
            console.error('Cannot create conversation: user not authenticated');
            return;
        }

        try {
            // Get or create conversation in Firestore
            const conversationId = await getOrCreateConversation(currentUser.id, user.id);
            
            // Check if conversation already exists in local state
            const existingConvo = conversations.find(c => c.id === conversationId);
            
            if (existingConvo) {
                // Conversation exists, just select it
                setSelectedConversationId(conversationId);
            } else {
                // Create new conversation in local state
                const newConversation: Conversation = {
                    id: conversationId,
                    type: 'dm',
                    participants: [currentUser, user],
                    messages: [],
                };
                
                // Save to local storage
                const { saveConversationLocally } = await import('./services/localStorageService');
                await saveConversationLocally(newConversation);
                
                // Sync to Firestore (already done by getOrCreateConversation, but ensure it's synced)
                const { syncConversationToFirestore } = await import('./services/syncService');
                await syncConversationToFirestore(newConversation);
                
                setConversations(prev => [...prev, newConversation]);
                setSelectedConversationId(conversationId);
            }
            
            setSettingsCategory(null);
            setReplyingTo(null);
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Failed to start conversation. Please try again.');
        }
    };

    const handleContactAdded = async () => {
        // Reload contacts after adding
        if (currentUser?.id && currentUser.id !== 'me') {
            try {
                const userContacts = await getUserContacts(currentUser.id);
                setContacts(userContacts);
            } catch (error) {
                console.error('Error reloading contacts:', error);
            }
        }
    };

    const handleSelectSettings = (category: string | null) => {
        if (category === 'support-popup') {
            setIsSupportPopupOpen(true);
            return;
        }
        setSettingsCategory(category);
        if (category) setSelectedConversationId(null);
    };

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);
    const showChat = selectedConversationId !== null;
    const showSettingsDetail = settingsCategory !== null;

    const renderSettingsDetail = () => {
        const onBack = () => handleSelectSettings(null);
        switch (settingsCategory) {
            case 'profile': return <EditProfileSection user={currentUser as User} onBack={onBack} onLogout={handleLogout} />;
            case 'general': return <GeneralSettingsView onBack={onBack} />;
            case 'notifications': return <NotificationsSettingsView onBack={onBack} />;
            case 'privacy': return <PrivacySettingsView onBack={onBack} />;
            case 'data-storage': return <DataStorageSettingsView onBack={onBack} />;
            case 'appearance': return <AppearanceSettingsView onBack={onBack} />;
            case 'language': return <LanguageSettingsView onBack={onBack} />;
            case 'stickers-emoji': return <StickersEmojiSettingsView onBack={onBack} />;
            case 'chat-folders': return <ChatFoldersSettingsView onBack={onBack} />;
            case 'premium': return <PremiumSettingsView onBack={onBack} />;
            case 'stars': return <StarsSettingsView onBack={onBack} />;
            case 'business': return <BusinessSettingsView onBack={onBack} />;
            case 'gift': return <GiftSettingsView users={allUniqueUsers} onBack={onBack} />;
            case 'profile-color': return <SetProfileColorView user={currentUser as User} onBack={onBack} />;
            default: return <div className="flex-1 flex items-center justify-center text-slate-400">Section {settingsCategory} coming soon</div>;
        }
    };

    if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;

    return (
        <div className="h-[100dvh] w-screen flex flex-col font-sans antialiased overflow-hidden bg-white">
            <div className={`${showChat || showSettingsDetail ? 'hidden md:block' : 'block'} flex-shrink-0`}>
                <Header 
                    onReset={() => setConversations(INITIAL_CONVERSATIONS)} 
                    isOnline={isOnline}
                    syncQueueCount={syncQueueCount}
                    isSyncing={isSyncing}
                />
            </div>
            <div className="flex-1 flex overflow-hidden min-h-0">
                <div className={`md:flex md:w-80 lg:w-96 bg-white border-r border-slate-200 flex-col min-h-0 ${(showChat || showSettingsDetail) ? 'hidden' : 'flex w-full'}`}>
                   <ConversationList 
                     conversations={conversations}
                     selectedConversationId={selectedConversationId}
                     onSelectConversation={handleSelectConversation}
                     onSelectSettings={handleSelectSettings}
                     activeSettingsCategory={settingsCategory}
                     onTogglePin={handleTogglePinConversation}
                     onDeleteConversation={handleDeleteConversation}
                     onSelectContact={handleSelectContact}
                     currentUserId={currentUser?.id}
                     currentUser={currentUser || undefined}
                     contacts={contacts}
                     onContactAdded={handleContactAdded}
                   />
                </div>
                
                <div className={`flex-1 flex-col min-h-0 ${(showChat || showSettingsDetail) ? 'flex' : 'hidden md:flex'}`}>
                    {selectedConversation ? (
                        <ChatWindow 
                            key={selectedConversation.id}
                            conversation={selectedConversation} 
                            onSendMessage={handleSendMessage}
                            onVotePoll={handleVotePoll}
                            isLoading={isLoading}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            onBack={() => setSelectedConversationId(null)}
                            onDeleteMessage={handleDeleteMessage}
                            onTogglePin={handleTogglePin}
                            onToggleStar={handleToggleStar}
                            onAddReaction={handleAddReaction}
                            onUpdateMessage={handleUpdateMessage}
                            currentUserId={currentUser?.id}
                        />
                    ) : showSettingsDetail ? (
                        <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
                            {renderSettingsDetail()}
                        </div>
                    ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-8 text-center">
                           <div className="bg-slate-200 p-6 rounded-full mb-4">
                               <MessengerIcon className="h-16 w-16 text-slate-400 opacity-50" />
                           </div>
                           <h2 className="text-xl font-bold text-slate-600 mb-2">Local Messenger Active</h2>
                           <p className="max-w-xs text-sm">Your messages are stored locally in your browser session.</p>
                           <button onClick={handleLogout} className="mt-6 text-sm font-bold text-red-500 hover:underline">Log Out</button>
                       </div>
                    )}
                </div>
            </div>
            {isSupportPopupOpen && <SupportPopup onClose={() => setIsSupportPopupOpen(false)} />}
        </div>
    );
};

export default App;