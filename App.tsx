import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingProfile } from './components/OnboardingProfile';
import { GroupSettingsView } from './components/GroupSettingsView';
import { GroupCreationModal } from './components/GroupCreationModal';
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
import { logout as firebaseLogout, getCurrentUser } from './services/firebaseService';
import { 
    getUserContacts, 
    getOrCreateConversation, 
    subscribeToConversations, 
    getUserProfile, 
    createGroupConversation,
    updateGroupConversation,
    addMemberToGroup,
    removeMemberFromGroup,
    leaveGroup,
    transferAdminRights,
    removeAdminRights,
    muteConversation,
    unmuteConversation,
    getMutedConversations,
    getMediaMessages,
    getFileMessages,
    getPinnedMessages,
    getConversationNotificationPreferences,
    setConversationNotificationLevel,
    requestJoinGroupByInvite
} from './services/firestoreService';
import { sendMessage as syncSendMessage, startBackgroundSync, stopBackgroundSync, syncAllFromFirestore, subscribeToMessages } from './services/syncService';
import { initConnectionListener } from './services/connectionService';
import { getConversationsLocally, getMessagesLocally, getSyncQueueCount, clearAllLocalData } from './services/localStorageService';
import { shouldShowNotificationForLevel } from './services/notificationService';
import type { Conversation, Message, User, PollOption, MutedConversation, ConversationPreference, ConversationNotificationLevel } from './types';
import { INITIAL_CONVERSATIONS, MessengerIcon } from './constants';
import { meAvatar } from './assets';

const AUTH_KEY = 'ringr_is_authenticated';
const USER_KEY = 'ringr_current_user';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [settingsCategory, setSettingsCategory] = useState<string | null>(null);
    const [isSupportPopupOpen, setIsSupportPopupOpen] = useState(false);
    const [contacts, setContacts] = useState<User[]>([]);
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
    const [mutedConversations, setMutedConversations] = useState<Map<string, number | null>>(new Map());
    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupMediaMessages, setGroupMediaMessages] = useState<Message[]>([]);
    const [groupFileMessages, setGroupFileMessages] = useState<Message[]>([]);
    const [groupPinnedMessages, setGroupPinnedMessages] = useState<Message[]>([]);
    const [conversationPreferences, setConversationPreferences] = useState<ConversationPreference[]>([]);
    const prevSyncQueueCountRef = useRef<number>(0);
    const selectedConversationIdRef = useRef<string | null>(selectedConversationId);
    
    // Resizable conversation list state
    const [conversationListWidth, setConversationListWidth] = useState<number>(() => {
        const saved = localStorage.getItem('riingr_conversation_list_width');
        return saved ? parseInt(saved, 10) : 384; // Default: 384px (w-96)
    });
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartXRef = useRef<number>(0);
    const resizeStartWidthRef = useRef<number>(0);
    
    // Sidebar is visible when conversation list is minimized (width < 200px)
    const isConversationListMinimized = conversationListWidth < 200;
    
    const [currentUser, setCurrentUser] = useState<User | null>({
            id: 'me',
        name: 'Riingr User',
            avatar: meAvatar,
            phone: '',
        username: '@user',
    });

    // Keep ref in sync with selectedConversationId
    useEffect(() => {
        selectedConversationIdRef.current = selectedConversationId;
    }, [selectedConversationId]);

    // Save conversation list width to localStorage
    useEffect(() => {
        localStorage.setItem('riingr_conversation_list_width', conversationListWidth.toString());
    }, [conversationListWidth]);

    // Handle resizing
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        resizeStartXRef.current = e.clientX;
        resizeStartWidthRef.current = conversationListWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [conversationListWidth]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartXRef.current;
            const newWidth = Math.max(0, Math.min(600, resizeStartWidthRef.current + deltaX));
            setConversationListWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

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

    // Load per-conversation notification preferences for current user
    useEffect(() => {
        const loadPreferences = async () => {
            if (!currentUser?.id || currentUser.id === 'me') return;
            try {
                const prefs = await getConversationNotificationPreferences(currentUser.id);
                setConversationPreferences(prefs);
            } catch (error) {
                console.error('Error loading conversation notification preferences:', error);
            }
        };
        loadPreferences();
    }, [currentUser?.id]);

    // Load user profile after authentication to check onboarding status
    useEffect(() => {
        if (!isAuthenticated || !currentUser?.id || currentUser.id === 'me') {
            return;
        }

        let isActive = true;

        const loadProfile = async () => {
            setIsProfileLoading(true);
            try {
                console.log('🔍 [App.tsx] Loading profile for user ID:', currentUser.id);
                const profile = await getUserProfile(currentUser.id);
                console.log('✅ [App.tsx] Profile loaded from Firestore:', {
                    id: profile?.id,
                    name: profile?.name,
                    email: profile?.email,
                    username: profile?.username,
                });
                if (profile && isActive) {
                    setCurrentUser(prev => (prev ? { ...prev, ...profile } : profile));
                    console.log('✅ [App.tsx] currentUser updated with profile data');
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            } finally {
                if (isActive) {
                    setIsProfileLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isActive = false;
        };
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
                // Load conversations from local storage - filtered by current user
                const localConversations = await getConversationsLocally(currentUser.id);
                
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
                        setIsSyncing(true);
                        await syncAllFromFirestore(currentUser.id);
                        // Reload after sync - filtered by current user
                        const syncedConversations = await getConversationsLocally(currentUser.id);
                        const conversationsWithMessages = await Promise.all(
                            syncedConversations.map(async (convo) => {
                                // Load messages immediately for all conversations
                                const messages = await getMessagesLocally(convo.id, 1000); // Load up to 1000 messages
                                // Sort messages by timestamp ascending (oldest first)
                                const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
                                return { ...convo, messages: sortedMessages };
                            })
                        );
                        setConversations(conversationsWithMessages);
                    } catch (error) {
                        console.error('Error syncing from Firestore:', error);
                        // Continue with local data if sync fails
                    } finally {
                        setIsSyncing(false);
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

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

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
        setConversations([]); // Clear conversations on login to prevent showing other users' data
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    };

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            try {
                stopBackgroundSync(); // Stop background sync
                await firebaseLogout();
                
                // Clear all local data to prevent data leakage between users
                await clearAllLocalData();
                
            setIsAuthenticated(false);
                setConversations([]); // Clear conversations from state
                localStorage.removeItem(AUTH_KEY);
                localStorage.removeItem(USER_KEY);
            } catch (error) {
                console.error('Logout error:', error);
                stopBackgroundSync(); // Stop even if logout fails
                // Still clear local state even if Firebase logout fails
                await clearAllLocalData();
            setIsAuthenticated(false);
                setConversations([]); // Clear conversations from state
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(USER_KEY);
            }
        }
    };

    const handleOnboardingComplete = useCallback((updates: Partial<User>) => {
        setCurrentUser(prev => (prev ? { ...prev, ...updates, profileComplete: true } : prev));
    }, []);

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
        file?: Message['file'],
        mentions?: string[]
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
            syncStatus: 'pending',
            mentions: mentions && mentions.length > 0 ? mentions : []
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

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!selectedConversationId) return;
        
        // Optimistically update UI
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
                return {
                    ...convo,
                    messages: convo.messages.filter(msg => msg.id !== messageId)
                };
            }
            return convo;
        }));
        
        // Delete from Firestore and local storage
        try {
            const { deleteMessage } = await import('./services/syncService');
            await deleteMessage(selectedConversationId, messageId);
        } catch (error) {
            console.error('Error deleting message:', error);
            // Revert optimistic update on error
            // Note: In a production app, you might want to show an error toast
            // For now, we'll let the sync service handle retries
        }
    }, [selectedConversationId]);

    const handleTogglePin = useCallback(async (messageId: string) => {
        if (!selectedConversationId) return;
        
        // Find the target message
        const targetConvo = conversations.find(c => c.id === selectedConversationId);
        if (!targetConvo) return;
        
        const targetMsg = targetConvo.messages.find(m => m.id === messageId);
        if (!targetMsg) return;
                
                const isPinning = !targetMsg.isPinned;
                
        // Optimistically update UI
        setConversations(prev => prev.map(convo => {
            if (convo.id === selectedConversationId) {
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
        
        // Sync to Firestore
        try {
            const { updateMessage } = await import('./services/syncService');
            
            // Update the target message
            await updateMessage(selectedConversationId, messageId, { isPinned: isPinning });
            
            // If pinning, unpin all other messages in the conversation
            if (isPinning) {
                const otherPinnedMessages = targetConvo.messages.filter(
                    m => m.id !== messageId && m.isPinned
                );
                
                // Unpin all other messages
                await Promise.all(
                    otherPinnedMessages.map(msg => 
                        updateMessage(selectedConversationId, msg.id, { isPinned: false })
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
            // Revert optimistic update on error
            setConversations(prev => prev.map(convo => {
                if (convo.id === selectedConversationId) {
                    return {
                        ...convo,
                        messages: convo.messages.map(msg => {
                            if (msg.id === messageId) {
                                return { ...msg, isPinned: !isPinning };
                            }
                            return msg;
                        })
                    };
                }
                return convo;
            }));
        }
    }, [selectedConversationId, conversations]);

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
    // Track conversation IDs for subscription management
    const conversationIds = useMemo(() => 
        conversations.map(c => c.id).filter(id => id !== 'gemini-chat').sort().join(','),
        [conversations]
    );

    // Subscribe to messages for ALL conversations (not just selected one) for real-time updates
    useEffect(() => {
        if (!currentUser?.id || currentUser.id === 'me' || !isOnline) {
            return;
        }

        const unsubscribes: (() => void)[] = [];
        const ids = conversations.map(c => c.id).filter(id => id !== 'gemini-chat');

        // Subscribe to messages for all conversations
        ids.forEach(conversationId => {
            const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
                setConversations(prev => prev.map(prevConvo => {
                    if (prevConvo.id === conversationId) {
                        // Use all messages from Firestore (they're already sorted)
                        // Only update if messages actually changed
                        const prevMessageIds = prevConvo.messages.map(m => m.id).join(',');
                        const newMessageIds = newMessages.map(m => m.id).join(',');
                        
                        if (prevMessageIds === newMessageIds && prevConvo.messages.length === newMessages.length) {
                            return prevConvo; // No changes, don't update
                        }
                        
                        // Check if we should show notification for new messages
                        const prevMessageCount = prevConvo.messages.length;
                        if (newMessages.length > prevMessageCount && currentUser?.id) {
                            // New messages arrived - check notification level
                            const pref = conversationPreferences.find(p => p.conversationId === conversationId);
                            const notificationLevel = pref?.notificationLevel || 'all';
                            
                            // Get the newest message (last in array since sorted ascending)
                            const newestMessage = newMessages[newMessages.length - 1];
                            
                            // Only show notification if:
                            // 1. Message is not from current user
                            // 2. Notification level allows it
                            if (newestMessage.senderId !== currentUser.id && 
                                newestMessage.senderId !== 'me' &&
                                shouldShowNotificationForLevel(notificationLevel, newestMessage, currentUser.id)) {
                                
                                // Show browser notification (if permission granted)
                                if ('Notification' in window && Notification.permission === 'granted') {
                                    const conversationName = prevConvo.name || prevConvo.participants
                                        .find(p => p.id !== currentUser.id)?.name || 'Chat';
                                    
                                    new Notification(`${conversationName}`, {
                                        body: newestMessage.text || (newestMessage.imageUrl ? '📷 Photo' : newestMessage.file ? '📎 File' : 'New message'),
                                        icon: prevConvo.avatar || '/icon-192.png',
                                        tag: conversationId, // Prevent duplicate notifications
                                    });
                                }
                            }
                        }
                        
                        return { ...prevConvo, messages: newMessages };
                    }
                    return prevConvo;
                }));
            });

            unsubscribes.push(unsubscribe);
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [conversationIds, currentUser?.id, isOnline]);

    const handleSelectContact = async (user: User) => {
        // Get Firebase auth user to ensure we use the correct UID
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) {
            console.error('Cannot create conversation: user not authenticated with Firebase');
            alert('You must be logged in to start a conversation. Please sign in again.');
            return;
        }

        const authUserId = firebaseUser.uid;

        // Prevent attempting to start a DM with yourself
        if (user.id === authUserId) {
            console.warn('Ignoring attempt to start conversation with self from mention popup.', {
                authUserId,
                contactId: user.id,
            });
            return;
        }

        // Verify currentUser.id matches auth UID (for debugging)
        if (currentUser?.id && currentUser.id !== 'me' && currentUser.id !== authUserId) {
            console.warn('⚠️ User ID mismatch:', { 
                currentUserId: currentUser.id, 
                authUserId 
            });
        }

        // Validate user IDs
        if (!authUserId || !user.id) {
            console.error('❌ Invalid user IDs:', { authUserId, contactId: user.id });
            alert('Invalid user information. Please try again.');
            return;
        }

        // Debug logging
        console.log('🔍 Starting conversation with contact:', {
            authUserId,
            contactId: user.id,
            contactName: user.name,
            isAuthenticated: !!firebaseUser
        });

        try {
            // Get or create conversation in Firestore using Firebase auth UID
            const conversationId = await getOrCreateConversation(authUserId, user.id);
            
            // Check if conversation already exists in local state
            let existingConvo = conversations.find(c => c.id === conversationId);
            
            if (existingConvo) {
                // Conversation exists in state, just select it
                setSelectedConversationId(conversationId);
            } else {
                // Check if conversation exists in local storage
                const { getConversationsLocally } = await import('./services/localStorageService');
                const localConversations = await getConversationsLocally(authUserId);
                existingConvo = localConversations.find(c => c.id === conversationId);
                
                if (existingConvo) {
                    // Load messages for the conversation
                    const { getMessagesLocally } = await import('./services/localStorageService');
                    const messages = await getMessagesLocally(existingConvo.id);
                    const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
                    
                    const conversationWithMessages = {
                        ...existingConvo,
                        messages: sortedMessages
                    };
                    
                    // Add to state and select it
                    setConversations(prev => {
                        // Check if it's already in state (race condition protection)
                        if (prev.find(c => c.id === conversationId)) {
                            return prev;
                        }
                        return [...prev, conversationWithMessages];
                    });
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
                    
                    setConversations(prev => {
                        // Check if it's already in state (race condition protection)
                        if (prev.find(c => c.id === conversationId)) {
                            return prev;
                        }
                        return [...prev, newConversation];
                    });
                    setSelectedConversationId(conversationId);
                }
            }
            
            setSettingsCategory(null);
            setReplyingTo(null);
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Failed to start conversation. Please try again.');
        }
    };

    const handleCreateGroup = async (name: string, participantIds: string[], avatar?: string) => {
        // Get Firebase auth user to ensure we use the correct UID
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) {
            throw new Error('Cannot create group: user not authenticated with Firebase');
        }

        const authUserId = firebaseUser.uid;

        // Verify currentUser.id matches auth UID (for debugging)
        if (currentUser?.id && currentUser.id !== 'me' && currentUser.id !== authUserId) {
            console.warn('User ID mismatch:', { 
                currentUserId: currentUser.id, 
                authUserId 
            });
        }

        try {
            // Create group in Firestore using Firebase auth UID
            const groupId = await createGroupConversation(
                authUserId,
                name,
                participantIds,
                avatar
            );

            // Fetch participant user profiles
            const { getUserProfile } = await import('./services/firestoreService');
            const participantProfiles = await Promise.all(
                participantIds.map(id => getUserProfile(id))
            );
            const validParticipants = participantProfiles.filter((p): p is User => p !== null);

            // Create new group conversation object
            const newGroup: Conversation = {
                id: groupId,
                type: 'group',
                name: name.trim(),
                avatar: avatar,
                participants: [currentUser, ...validParticipants],
                messages: [],
                admins: [currentUser.id],
            };

            // Group is created in Firestore, real-time listener will add it to state
            // Just select it after a brief delay to let the listener update
            setTimeout(() => {
                setSelectedConversationId(groupId);
            }, 500);
            
            // Close settings if open
            setSettingsCategory(null);
            setReplyingTo(null);
            
            console.log('✅ Group created successfully:', groupId);
        } catch (error) {
            console.error('Error creating group:', error);
            throw error; // Re-throw to let modal handle the error
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

    const handleJoinGroupByInvite = async (token: string) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) {
            alert('You must be logged in to join a group.');
            return;
        }
        try {
            await requestJoinGroupByInvite(token, firebaseUser.uid);
            alert('Join request sent. A group admin will need to approve you.');
        } catch (error: any) {
            console.error('Error joining group by invite:', error);
            const message = error?.message || 'Could not join group. Please check the link and try again.';
            alert(message);
        }
    };

    // Load muted conversations
    useEffect(() => {
        const loadMutedConversations = async () => {
            if (!currentUser?.id || currentUser.id === 'me') return;
            try {
                const muted = await getMutedConversations(currentUser.id);
                const mutedMap = new Map<string, number | null>();
                muted.forEach(m => {
                    mutedMap.set(m.conversationId, m.mutedUntil);
                });
                setMutedConversations(mutedMap);
            } catch (error) {
                console.error('Error loading muted conversations:', error);
            }
        };
        loadMutedConversations();
    }, [currentUser?.id]);

    // Load group media/files/pinned when group settings opened
    useEffect(() => {
        const loadGroupContent = async () => {
            if (!isGroupSettingsOpen || !selectedConversation) return;
            if (selectedConversation.type !== 'group') return;
            try {
                const [media, files, pinned] = await Promise.all([
                    getMediaMessages(selectedConversation.id),
                    getFileMessages(selectedConversation.id),
                    getPinnedMessages(selectedConversation.id)
                ]);
                setGroupMediaMessages(media);
                setGroupFileMessages(files);
                setGroupPinnedMessages(pinned);
            } catch (error) {
                console.error('Error loading group media/files/pinned messages:', error);
            }
        };
        loadGroupContent();
    }, [isGroupSettingsOpen, selectedConversation]);

    // Group management handlers
    const handleUpdateGroup = async (groupId: string, updates: Partial<Conversation>) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await updateGroupConversation(groupId, updates, firebaseUser.uid);
        // Real-time listener will update state
    };

    const handleAddMember = async (groupId: string, userId: string) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await addMemberToGroup(groupId, userId, firebaseUser.uid);
    };

    const handleRemoveMember = async (groupId: string, userId: string) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await removeMemberFromGroup(groupId, userId, firebaseUser.uid);
    };

    const handleLeaveGroup = async (groupId: string) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await leaveGroup(groupId, firebaseUser.uid);
        setSelectedConversationId(null);
    };

    const handleTransferAdmin = async (groupId: string, newAdminId: string) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await transferAdminRights(groupId, newAdminId, firebaseUser.uid);
    };

    const handleRemoveAdmin = async (groupId: string, adminId: string) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await removeAdminRights(groupId, adminId, firebaseUser.uid);
    };

    const handleMuteGroup = async (conversationId: string, mutedUntil: number | null) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await muteConversation(firebaseUser.uid, conversationId, mutedUntil);
        setMutedConversations(prev => {
            const next = new Map(prev);
            next.set(conversationId, mutedUntil);
            return next;
        });
    };

    const handleUnmuteGroup = async (conversationId: string) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await unmuteConversation(firebaseUser.uid, conversationId);
        setMutedConversations(prev => {
            const next = new Map(prev);
            next.delete(conversationId);
            return next;
        });
    };

    const handleSetNotificationLevel = async (
        conversationId: string,
        level: ConversationNotificationLevel
    ) => {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('User not authenticated');
        await setConversationNotificationLevel(firebaseUser.uid, conversationId, level);
        setConversationPreferences(prev => {
            const filtered = prev.filter(p => p.conversationId !== conversationId);
            filtered.push({ conversationId, notificationLevel: level });
            return filtered;
        });
    };

    const handleSelectSettings = (category: string | null) => {
        if (category === 'support-popup') {
            setIsSupportPopupOpen(true);
            return;
        }
        setSettingsCategory(category);
        if (category) setSelectedConversationId(null);
    };

    const showChat = selectedConversationId !== null;
    const showSettingsDetail = settingsCategory !== null;

    // Refresh user profile from Firestore
    const refreshUserProfile = useCallback(async () => {
        if (!currentUser?.id || currentUser.id === 'me') return;
        
        try {
            console.log('🔄 [App.tsx] Refreshing user profile...');
            const profile = await getUserProfile(currentUser.id);
            if (profile) {
                setCurrentUser(prev => (prev ? { ...prev, ...profile } : profile));
                // Also update localStorage
                localStorage.setItem(USER_KEY, JSON.stringify(profile));
                console.log('✅ [App.tsx] User profile refreshed:', profile);
            }
        } catch (error) {
            console.error('❌ [App.tsx] Error refreshing user profile:', error);
        }
    }, [currentUser?.id]);

    const renderSettingsDetail = () => {
        const onBack = () => handleSelectSettings(null);
        console.log('🔍 [App.tsx] Rendering settings detail, currentUser:', {
            id: currentUser?.id,
            name: currentUser?.name,
            email: currentUser?.email,
            category: settingsCategory,
        });
        switch (settingsCategory) {
            case 'profile': return <EditProfileSection user={currentUser as User} onBack={onBack} onLogout={handleLogout} onProfileUpdate={refreshUserProfile} />;
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

    const needsOnboarding = !!(
        isAuthenticated &&
        !isProfileLoading &&
        currentUser?.id &&
        currentUser.id !== 'me' &&
        currentUser.profileComplete !== true
    );

    if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;
    if (isProfileLoading) {
        return (
            <div className="h-[100dvh] w-screen flex items-center justify-center bg-slate-50">
                <div className="text-sm font-semibold text-slate-500">Loading your profile...</div>
            </div>
        );
    }
    if (needsOnboarding) {
        return <OnboardingProfile user={currentUser as User} onComplete={handleOnboardingComplete} />;
    }

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
                {/* Sidebar with circular avatars - only visible when conversation list is minimized */}
                {isConversationListMinimized && (
                    <Sidebar
                        conversations={conversations}
                        contacts={contacts}
                        currentUserId={currentUser?.id}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={handleSelectConversation}
                        onSelectContact={handleSelectContact}
                        onSelectSettings={handleSelectSettings}
                        activeSection={settingsCategory ? 'settings' : 'chats'}
                        onCreateGroup={() => setIsGroupModalOpen(true)}
                        mutedConversations={mutedConversations}
                    />
                )}
                
                {/* Conversation List with Resizable Separator */}
                <div className="flex items-stretch relative">
                    <div 
                        className={`bg-white border-r border-slate-200 flex-col min-h-0 transition-all duration-200 ${
                            (showChat || showSettingsDetail) ? 'hidden md:flex' : 'flex w-full md:w-auto'
                        }`}
                        style={{ 
                            width: (showChat || showSettingsDetail) 
                                ? `${conversationListWidth}px` 
                                : (typeof window !== 'undefined' && window.innerWidth >= 768) 
                                    ? `${conversationListWidth}px` 
                                    : '100%',
                            minWidth: '0px', 
                            maxWidth: '600px',
                            overflow: conversationListWidth < 50 ? 'hidden' : 'visible',
                            flexShrink: 0
                        }}
                    >
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
                     onCreateGroup={handleCreateGroup}
                     allUsers={allUniqueUsers}
                     isSyncing={isSyncing}
                     mutedConversations={mutedConversations}
                     onMute={handleMuteGroup}
                     onUnmute={handleUnmuteGroup}
                     onOpenGroupSettings={(conversationId) => {
                         setSelectedConversationId(conversationId);
                         setIsGroupSettingsOpen(true);
                     }}
                     onJoinByInvite={handleJoinGroupByInvite}
                   />
                </div>
                
                    {/* Resizable Separator - Always visible on desktop */}
                    <div
                        onMouseDown={handleResizeStart}
                        className={`hidden md:flex w-1 bg-slate-200 hover:bg-green-500 cursor-col-resize transition-all relative group ${
                            isResizing ? 'bg-green-500' : ''
                        }`}
                        style={{ flexShrink: 0 }}
                        title="Drag to resize conversation list"
                    >
                        {/* Visual indicator on hover */}
                        <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                
                <div className={`flex-1 flex-col min-h-0 min-w-0 ${(showChat || showSettingsDetail || isGroupSettingsOpen) ? 'flex' : 'hidden md:flex'}`}>
                    {isGroupSettingsOpen && selectedConversation && selectedConversation.type === 'group' ? (
                        <GroupSettingsView
                            conversation={selectedConversation}
                            currentUserId={currentUser?.id || ''}
                            onClose={() => setIsGroupSettingsOpen(false)}
                            onUpdate={async (updates) => {
                                await handleUpdateGroup(selectedConversation.id, updates);
                            }}
                            onAddMember={async (userId) => {
                                await handleAddMember(selectedConversation.id, userId);
                            }}
                            onRemoveMember={async (userId) => {
                                await handleRemoveMember(selectedConversation.id, userId);
                            }}
                            onLeaveGroup={async () => {
                                await handleLeaveGroup(selectedConversation.id);
                                setIsGroupSettingsOpen(false);
                            }}
                            onTransferAdmin={async (userId) => {
                                await handleTransferAdmin(selectedConversation.id, userId);
                            }}
                            onRemoveAdmin={async (userId) => {
                                await handleRemoveAdmin(selectedConversation.id, userId);
                            }}
                            onMuteGroup={async (mutedUntil) => {
                                await handleMuteGroup(selectedConversation.id, mutedUntil);
                            }}
                            onUnmuteGroup={async () => {
                                await handleUnmuteGroup(selectedConversation.id);
                            }}
                            availableUsers={allUniqueUsers}
                            mutedUntil={mutedConversations.get(selectedConversation.id)}
                            mediaMessages={groupMediaMessages}
                            fileMessages={groupFileMessages}
                            pinnedMessages={groupPinnedMessages}
                            notificationLevel={
                                conversationPreferences.find(p => p.conversationId === selectedConversation.id)
                                    ?.notificationLevel || 'all'
                            }
                            onChangeNotificationLevel={async (level) => {
                                await handleSetNotificationLevel(selectedConversation.id, level);
                            }}
                            onScrollToMessage={(messageId) => {
                                // Close group settings and scroll to message
                                setIsGroupSettingsOpen(false);
                                // Use a small delay to ensure settings is closed, then scroll
                                setTimeout(() => {
                                    const element = document.getElementById(`msg-${messageId}`);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        element.classList.add('bg-green-50/50');
                                        setTimeout(() => element.classList.remove('bg-green-50/50'), 2000);
                                    }
                                }, 200);
                            }}
                        />
                    ) : selectedConversation ? (
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
                            onOpenGroupSettings={selectedConversation.type === 'group' ? () => setIsGroupSettingsOpen(true) : undefined}
                            isMuted={(() => {
                                const mutedUntil = mutedConversations.get(selectedConversation.id);
                                if (mutedUntil === undefined || mutedUntil === null) return false;
                                if (mutedUntil === -1) return true;
                                return mutedUntil > Date.now();
                            })()}
                            onStartPrivateConversation={handleSelectContact}
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
            {isGroupModalOpen && currentUser?.id && (
                <GroupCreationModal
                    isOpen={isGroupModalOpen}
                    onClose={() => setIsGroupModalOpen(false)}
                    onCreateGroup={handleCreateGroup}
                    contacts={contacts}
                    currentUserId={currentUser.id}
                    allUsers={allUniqueUsers}
                />
            )}
        </div>
    );
};

export default App;