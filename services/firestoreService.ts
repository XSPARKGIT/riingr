import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { auth } from './firebaseConfig';
import type { User, Conversation } from '../types';

/**
 * Create or update user profile in Firestore
 */
export const createUserProfile = async (
  userId: string,
  userData: {
    name: string;
    email: string;
    avatar?: string;
    username?: string;
    status?: string;
    profileComplete?: boolean;
  }
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isOnline: true,
      lastSeen: serverTimestamp(),
    }, { merge: true });
    
    console.log('✅ User profile created in Firestore');
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar || '',
        username: data.username,
        phone: data.phone,
        isOnline: data.isOnline,
        status: data.status,
        profileComplete: data.profileComplete,
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Check if username is available
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username || username.length < 3) {
    return false;
  }
  
  // Remove @ if user included it
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', `@${cleanUsername}`));
    const snapshot = await getDocs(q);
    
    // Available if no results found
    const isAvailable = snapshot.empty;
    console.log(`Username check: @${cleanUsername} is ${isAvailable ? 'available' : 'taken'}`);
    return isAvailable;
  } catch (error) {
    console.error('Error checking username availability:', error);
    // Throw error instead of returning false, so UI can show proper error message
    throw new Error('Failed to check username availability. Please try again.');
  }
};

/**
 * Search users by email or username
 */
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const usersRef = collection(db, 'users');
    
    // Normalize search term - handle @ symbol
    const normalizedTerm = searchTerm.startsWith('@') ? searchTerm : `@${searchTerm}`;
    
    // Search by email (exact or partial match)
    const emailQuery = query(
      usersRef,
      where('email', '>=', searchTerm.toLowerCase()),
      where('email', '<=', searchTerm.toLowerCase() + '\uf8ff')
    );
    
    // Search by username (with @ prefix)
    const usernameQuery = query(
      usersRef,
      where('username', '>=', normalizedTerm.toLowerCase()),
      where('username', '<=', normalizedTerm.toLowerCase() + '\uf8ff')
    );
    
    // Also search without @ if user didn't include it
    let usernameQueryNoAt = null;
    if (!searchTerm.startsWith('@')) {
      usernameQueryNoAt = query(
        usersRef,
        where('username', '>=', `@${searchTerm.toLowerCase()}`),
        where('username', '<=', `@${searchTerm.toLowerCase()}\uf8ff`)
      );
    }
    
    const queries = [getDocs(emailQuery), getDocs(usernameQuery)];
    if (usernameQueryNoAt) {
      queries.push(getDocs(usernameQueryNoAt));
    }
    
    const results = await Promise.all(queries);
    
    const users = new Map<string, User>();
    
    // Combine all results
    results.forEach((snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.set(docSnap.id, {
          id: docSnap.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar || '',
          username: data.username,
          phone: data.phone,
          isOnline: data.isOnline,
        } as User);
      });
    });
    
    return Array.from(users.values());
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Set user online status
 */
export const setUserOnlineStatus = async (
  userId: string,
  isOnline: boolean
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating online status:', error);
    throw error;
  }
};

/**
 * Add a contact to user's contact list
 */
export const addContact = async (
  userId: string,
  contactId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userSnap.data();
    const contacts = userData.contacts || [];
    
    // Check if contact already exists
    if (contacts.includes(contactId)) {
      return; // Already a contact
    }
    
    // Add contact
    await updateDoc(userRef, {
      contacts: [...contacts, contactId],
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Contact added successfully');
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

/**
 * Get user's contacts
 */
export const getUserContacts = async (userId: string): Promise<User[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return [];
    }
    
    const userData = userSnap.data();
    const contactIds = userData.contacts || [];
    
    if (contactIds.length === 0) {
      return [];
    }
    
    // Fetch all contact profiles
    const contacts = await Promise.all(
      contactIds.map(async (contactId: string) => {
        try {
          const contactDoc = await getDoc(doc(db, 'users', contactId));
          if (contactDoc.exists()) {
            const data = contactDoc.data();
            return {
              id: contactDoc.id,
              name: data.name,
              email: data.email,
              avatar: data.avatar || '',
              username: data.username,
              phone: data.phone,
              isOnline: data.isOnline,
            } as User;
          }
        } catch (error) {
          console.error(`Error fetching contact ${contactId}:`, error);
        }
        return null;
      })
    );
    
    return contacts.filter((contact): contact is User => contact !== null);
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw error;
  }
};

/**
 * Remove a contact
 */
export const removeContact = async (
  userId: string,
  contactId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return;
    }
    
    const userData = userSnap.data();
    const contacts = (userData.contacts || []).filter((id: string) => id !== contactId);
    
    await updateDoc(userRef, {
      contacts,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing contact:', error);
    throw error;
  }
};

/**
 * Create or get existing conversation between two users
 */
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string
): Promise<string> => {
  try {
    // Validate and trim user IDs
    const trimmedId1 = userId1?.trim();
    const trimmedId2 = userId2?.trim();
    
    if (!trimmedId1 || !trimmedId2) {
      throw new Error('Invalid user IDs provided');
    }
    
    if (trimmedId1 === trimmedId2) {
      throw new Error('Cannot create conversation with yourself');
    }
    
    // Create deterministic conversation ID (sorted user IDs)
    const sortedIds = [trimmedId1, trimmedId2].sort();
    const conversationId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
    
    // Verify authentication
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) {
      throw new Error('User not authenticated. Please sign in again.');
    }
    
    // Ensure the authenticated user's UID is in the participants
    if (!sortedIds.includes(currentAuthUser.uid)) {
      console.error('❌ Auth UID not in participants:', {
        authUid: currentAuthUser.uid,
        participants: sortedIds
      });
      throw new Error('Authentication error: Your user ID is not in the participants list.');
    }
    
    // Debug logging
    console.log('🔍 Creating conversation:', {
      authUid: currentAuthUser.uid,
      userId1: trimmedId1,
      userId2: trimmedId2,
      sortedIds,
      conversationId,
      authUidInParticipants: sortedIds.includes(currentAuthUser.uid)
    });
    
    const conversationRef = doc(db, 'conversations', conversationId);
    
    // Try to read the conversation, but if it doesn't exist or we don't have permission,
    // we'll catch the error and try to create it
    let conversationExists = false;
    try {
      const conversationSnap = await getDoc(conversationRef);
      conversationExists = conversationSnap.exists();
    } catch (readError: any) {
      // If read fails (document doesn't exist or permission denied), 
      // we'll try to create it - this is expected for new conversations
      console.log('📖 Conversation read check:', readError.code === 'permission-denied' ? 'Permission denied (document may not exist)' : readError.message);
    }
    
    if (!conversationExists) {
      // Ensure participants is a proper array (defensive programming)
      const participantsArray = Array.isArray(sortedIds) ? [...sortedIds] : [sortedIds[0], sortedIds[1]];
      
      // Double-check auth UID is in participants
      if (!participantsArray.includes(currentAuthUser.uid)) {
        console.error('❌ CRITICAL: Auth UID not in participants array before creation!', {
          authUid: currentAuthUser.uid,
          participants: participantsArray
        });
        throw new Error('Security validation failed: Your user ID must be in the participants list.');
      }
      
      // Create new conversation
      const conversationData = {
        type: 'dm',
        participants: participantsArray, // Explicitly use array
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Log the exact data structure
      console.log('📝 Creating conversation with data:', {
        type: conversationData.type,
        participants: conversationData.participants,
        participantsType: typeof conversationData.participants,
        participantsIsArray: Array.isArray(conversationData.participants),
        participantsLength: conversationData.participants.length,
        authUid: currentAuthUser.uid,
        authUidInParticipants: conversationData.participants.includes(currentAuthUser.uid),
        authUidType: typeof currentAuthUser.uid,
        participantTypes: conversationData.participants.map(p => typeof p)
      });
      
      try {
        await setDoc(conversationRef, conversationData);
        console.log('✅ Conversation created:', conversationId);
      } catch (createError: any) {
        // If creation fails with "already exists" error, the conversation was created
        // by another client between our check and creation attempt
        if (createError.code === 'permission-denied') {
          console.error('❌ Permission denied creating conversation. Auth UID:', currentAuthUser.uid, 'Participants:', sortedIds);
          throw new Error('Permission denied: Unable to create conversation. Please ensure you are logged in and try again.');
        }
        throw createError;
      }
    } else {
      console.log('✅ Conversation already exists:', conversationId);
    }
    
    return conversationId;
  } catch (error) {
    console.error('❌ Error creating/getting conversation:', error);
    console.error('User IDs:', { userId1, userId2 });
    throw error;
  }
};

/**
 * Create a new group conversation
 */
export const createGroupConversation = async (
  creatorId: string,
  name: string,
  participantIds: string[],
  avatar?: string
): Promise<string> => {
  try {
    if (!name || name.trim().length < 2) {
      throw new Error('Group name must be at least 2 characters');
    }
    
    if (participantIds.length === 0) {
      throw new Error('At least one participant is required');
    }
    
    // Generate unique group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Include creator in participants (remove duplicates)
    const allParticipants = Array.from(new Set([creatorId, ...participantIds.filter(id => id !== creatorId)]));
    
    const conversationRef = doc(db, 'conversations', groupId);
    await setDoc(conversationRef, {
      type: 'group',
      name: name.trim(),
      avatar: avatar || undefined,
      participants: allParticipants,
      admins: [creatorId], // Creator is admin
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Group conversation created:', groupId);
    return groupId;
  } catch (error) {
    console.error('Error creating group conversation:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time conversation list updates
 * Returns unsubscribe function
 */
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId));

  return onSnapshot(q, async (snapshot) => {
    const conversations: Conversation[] = [];
    
    console.log('🔍 [subscribeToConversations] Received snapshot with', snapshot.docs.length, 'conversations for user:', userId);
    
    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        
        console.log('🔍 [subscribeToConversations] Processing conversation:', {
          conversationId: docSnap.id,
          participantIds: data.participants,
          currentUserId: userId,
        });
        
        // Fetch participant details
        const participants = await Promise.all(
          (data.participants || []).map(async (participantId: string) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', participantId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('✅ [subscribeToConversations] Fetched participant data:', {
                  conversationId: docSnap.id,
                  participantId,
                  name: userData.name,
                  email: userData.email,
                  username: userData.username,
                });
                return {
                  id: participantId,
                  name: userData.name || 'Unknown User',
                  email: userData.email || '',
                  avatar: userData.avatar || '',
                  username: userData.username,
                  phone: userData.phone,
                  isOnline: userData.isOnline,
                  status: userData.status,
                  profileComplete: userData.profileComplete,
                } as User;
              }
            } catch (error) {
              console.error(`❌ [subscribeToConversations] Error fetching participant ${participantId}:`, error);
            }
            console.error('❌ [subscribeToConversations] User document not found:', {
              conversationId: docSnap.id,
              participantId,
            });
            return {
              id: participantId,
              name: 'Unknown User',
              avatar: '',
              email: '',
              phone: '',
              isOnline: false,
            } as User;
          })
        );

        console.log('📋 [subscribeToConversations] All participants fetched:', {
          conversationId: docSnap.id,
          participants: participants.map(p => ({ id: p.id, name: p.name, email: p.email })),
        });

        const conversation: Conversation = {
          id: docSnap.id,
          type: data.type || 'dm',
          name: data.name,
          avatar: data.avatar,
          participants,
          messages: [], // Messages loaded separately via message listener
          admins: data.admins,
          isPinned: data.isPinned || false,
        };

        conversations.push(conversation);
      } catch (error) {
        console.error(`Error processing conversation ${docSnap.id}:`, error);
      }
    }
    
    callback(conversations);
  }, (error) => {
    console.error('Error in conversation listener:', error);
  });
};

/**
 * Set typing status for a user in a conversation
 */
export const setTypingStatus = async (
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const typingRef = doc(db, 'conversations', conversationId, 'typing', userId);
    
    if (isTyping) {
      await setDoc(typingRef, {
        userId,
        isTyping: true,
        timestamp: serverTimestamp(),
      }, { merge: true });
    } else {
      // Clear typing status by deleting the document
      await deleteDoc(typingRef);
    }
  } catch (error) {
    console.error('Error setting typing status:', error);
    // Don't throw - typing status is not critical
  }
};

/**
 * Subscribe to typing status updates for a conversation
 * Returns unsubscribe function
 */
export const subscribeToTypingStatus = (
  conversationId: string,
  currentUserId: string,
  callback: (typingUserIds: string[]) => void
): (() => void) => {
  const typingRef = collection(db, 'conversations', conversationId, 'typing');
  
  return onSnapshot(typingRef, (snapshot) => {
    const typingUserIds: string[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Only include users who are actively typing and not the current user
      if (data.isTyping && data.userId !== currentUserId) {
        typingUserIds.push(data.userId);
      }
    });
    
    callback(typingUserIds);
  }, (error) => {
    console.error('Error in typing status listener:', error);
    callback([]); // Return empty array on error
  });
};

/**
 * Clear typing status for a user in a conversation
 */
export const clearTypingStatus = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    await setTypingStatus(conversationId, userId, false);
  } catch (error) {
    console.error('Error clearing typing status:', error);
    // Don't throw - typing status is not critical
  }
};

/**
 * Mark a message as delivered to a specific user
 */
export const markMessageAsDelivered = async (
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const messageRef = doc(
      db,
      'conversations',
      conversationId,
      'messages',
      messageId
    );

    // Get current message to check status
    const messageSnap = await getDoc(messageRef);
    const currentStatus = messageSnap.data()?.status;

    // Only update status to 'delivered' if not already 'read'
    const statusUpdate = currentStatus === 'read' ? {} : { status: 'delivered' };

    await updateDoc(messageRef, {
      deliveredTo: arrayUnion(userId),
      deliveredAt: serverTimestamp(),
      ...statusUpdate,
    });
  } catch (error) {
    console.error('Error marking message as delivered:', error);
    // Don't throw - read receipts are not critical
  }
};

/**
 * Mark a message as read by a specific user
 */
export const markMessageAsRead = async (
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  try {
    const messageRef = doc(
      db,
      'conversations',
      conversationId,
      'messages',
      messageId
    );

    await updateDoc(messageRef, {
      readBy: arrayUnion(userId),
      readAt: serverTimestamp(),
      status: 'read',
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    // Don't throw - read receipts are not critical
  }
};

/**
 * Mark all unread messages in a conversation as read
 */
export const markConversationMessagesAsRead = async (
  conversationId: string,
  userId: string,
  lastReadMessageId?: string
): Promise<void> => {
  try {
    const messagesRef = collection(
      db,
      'conversations',
      conversationId,
      'messages'
    );
    
    // Get all messages
    const q = query(messagesRef);
    const snapshot = await getDocs(q);
    
    const updatePromises: Promise<void>[] = [];
    let foundLastMessage = !lastReadMessageId;
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const messageId = docSnap.id;
      
      // If lastReadMessageId is specified, only mark messages up to that one
      if (lastReadMessageId && !foundLastMessage) {
        if (messageId === lastReadMessageId) {
          foundLastMessage = true;
        }
        if (!foundLastMessage) {
          return; // Skip messages before the last read message
        }
      }
      
      // Only mark messages from other users (not own messages)
      if (data.senderId !== userId && data.senderId !== 'me') {
        // Check if already read by this user
        const readBy = data.readBy || [];
        if (!readBy.includes(userId)) {
          updatePromises.push(
            markMessageAsRead(conversationId, messageId, userId)
          );
        }
        
        // Also mark as delivered if not already
        const deliveredTo = data.deliveredTo || [];
        if (!deliveredTo.includes(userId)) {
          updatePromises.push(
            markMessageAsDelivered(conversationId, messageId, userId)
          );
        }
      }
    });
    
    // Execute all updates in parallel
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking conversation messages as read:', error);
    // Don't throw - read receipts are not critical
  }
};
