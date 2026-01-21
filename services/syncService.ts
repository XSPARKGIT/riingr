import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
// Storage service imports removed - using base64 only
import {
  saveMessageLocally,
  getMessagesLocally,
  updateMessageLocally,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueItem,
  saveConversationLocally,
  getConversationsLocally,
  updateConversationLocally,
  setLastSyncTimestamp,
} from './localStorageService';
import { isOnline, waitForConnection } from './connectionService';
import type { Message, Conversation, SyncQueueItem } from '../types';

let syncInterval: NodeJS.Timeout | null = null;
const MAX_RETRY_COUNT = 5;

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};

/**
 * Send message with offline support
 * Saves locally first, then syncs to Firestore
 */
export const sendMessage = async (
  conversationId: string,
  message: Message
): Promise<void> => {
  // 1. Save locally immediately
  await saveMessageLocally(conversationId, {
    ...message,
    syncStatus: 'pending',
  });

  // 2. Add to sync queue
  const queueItem: SyncQueueItem = {
    id: `msg_${message.id}_${Date.now()}`,
    type: 'message',
    operation: 'create',
    conversationId,
    messageId: message.id,
    data: message,
    timestamp: Date.now(),
    retryCount: 0,
  };
  await addToSyncQueue(queueItem);

  // 3. Try to sync if online
  if (isOnline()) {
    try {
      await syncMessageToFirestore(conversationId, message);
      await removeFromSyncQueue(queueItem.id);
      await updateMessageLocally(conversationId, message.id, {
        syncStatus: 'synced',
      });
    } catch (error) {
      console.error('Failed to sync message:', error);
      // Keep in queue for retry
    }
  }
};

/**
 * Sync message to Firestore
 * Stores base64 images directly (Storage not enabled)
 */
const syncMessageToFirestore = async (
  conversationId: string,
  message: Message
): Promise<void> => {
  const messageRef = doc(
    db,
    'conversations',
    conversationId,
    'messages',
    message.id
  );

  // Build message data and remove undefined values
  const messageData: any = {
    id: message.id,
    timestamp: Timestamp.fromMillis(message.timestamp),
    senderId: message.senderId,
    createdAt: serverTimestamp(),
  };

  // Only include fields that are defined
  if (message.text !== undefined) messageData.text = message.text;
  if (message.translation !== undefined) messageData.translation = message.translation;
  if (message.imageUrl !== undefined) messageData.imageUrl = message.imageUrl;
  if (message.replyToId !== undefined) messageData.replyToId = message.replyToId;
  if (message.isSystem !== undefined) messageData.isSystem = message.isSystem;
  if (message.status !== undefined) messageData.status = message.status;
  if (message.isPinned !== undefined) messageData.isPinned = message.isPinned;
  if (message.isStarred !== undefined) messageData.isStarred = message.isStarred;
  if (message.reactions !== undefined && message.reactions.length > 0) {
    messageData.reactions = message.reactions;
  }
  if (message.location !== undefined) messageData.location = message.location;
  if (message.poll !== undefined) messageData.poll = message.poll;
  if (message.file !== undefined) messageData.file = message.file;

  // Clean any nested undefined values
  const cleanedData = removeUndefined(messageData);

  await setDoc(messageRef, cleanedData);

  // Update conversation's last message
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    lastMessage: {
      text: message.text || '',
      timestamp: Timestamp.fromMillis(message.timestamp),
      senderId: message.senderId,
    },
    updatedAt: serverTimestamp(),
  });
};

/**
 * Process sync queue
 */
export const processSyncQueue = async (): Promise<void> => {
  if (!isOnline()) {
    return;
  }

  const queue = await getSyncQueue();

  for (const item of queue) {
    try {
      // Set sync status to 'syncing' for messages
      if (item.type === 'message' && item.operation === 'create' && item.messageId) {
        await updateMessageLocally(item.conversationId, item.messageId, {
          syncStatus: 'syncing',
        });
      }

      switch (item.type) {
        case 'message':
          if (item.operation === 'create') {
            await syncMessageToFirestore(item.conversationId, item.data);
            // Update sync status to 'synced' on success
            if (item.messageId) {
              await updateMessageLocally(item.conversationId, item.messageId, {
                syncStatus: 'synced',
              });
            }
          } else if (item.operation === 'update' && item.messageId) {
            await updateMessageInFirestore(
              item.conversationId,
              item.messageId,
              item.data
            );
            // Update sync status to 'synced' on success
            await updateMessageLocally(item.conversationId, item.messageId, {
              syncStatus: 'synced',
            });
          } else if (item.operation === 'delete' && item.messageId) {
            await deleteMessageFromFirestore(
              item.conversationId,
              item.messageId
            );
          }
          break;
        case 'conversation':
          await syncConversationToFirestore(item.data);
          break;
      }

      // Remove from queue on success
      await removeFromSyncQueue(item.id);
    } catch (error: any) {
      console.error(`Sync failed for ${item.id}:`, error);

      // Set sync status to 'failed' for messages after max retries
      if (item.type === 'message' && item.messageId) {
        const newRetryCount = item.retryCount + 1;
        if (newRetryCount > MAX_RETRY_COUNT) {
          await updateMessageLocally(item.conversationId, item.messageId, {
            syncStatus: 'failed',
          });
        }
      }

      // Increment retry count
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount > MAX_RETRY_COUNT) {
        // Mark as failed after max retries
        await updateSyncQueueItem(item.id, {
          retryCount: newRetryCount,
          lastError: error.message,
        });
      } else {
        // Update retry count for next attempt
        await updateSyncQueueItem(item.id, {
          retryCount: newRetryCount,
          lastError: error.message,
        });
      }
    }
  }
};

/**
 * Update message in Firestore
 */
const updateMessageInFirestore = async (
  conversationId: string,
  messageId: string,
  updates: Partial<Message>
): Promise<void> => {
  const messageRef = doc(
    db,
    'conversations',
    conversationId,
    'messages',
    messageId
  );

  // Build update object, only including defined values
  const firestoreUpdates: any = {
    updatedAt: serverTimestamp(),
  };

  // Only include fields that are defined
  if (updates.text !== undefined) firestoreUpdates.text = updates.text;
  if (updates.translation !== undefined) firestoreUpdates.translation = updates.translation;
  if (updates.imageUrl !== undefined) firestoreUpdates.imageUrl = updates.imageUrl;
  if (updates.replyToId !== undefined) firestoreUpdates.replyToId = updates.replyToId;
  if (updates.isSystem !== undefined) firestoreUpdates.isSystem = updates.isSystem;
  if (updates.status !== undefined) firestoreUpdates.status = updates.status;
  if (updates.isPinned !== undefined) firestoreUpdates.isPinned = updates.isPinned;
  if (updates.isStarred !== undefined) firestoreUpdates.isStarred = updates.isStarred;
  if (updates.reactions !== undefined) firestoreUpdates.reactions = updates.reactions;
  if (updates.location !== undefined) firestoreUpdates.location = updates.location;
  if (updates.poll !== undefined) firestoreUpdates.poll = updates.poll;
  if (updates.file !== undefined) firestoreUpdates.file = updates.file;
  if (updates.timestamp !== undefined) {
    firestoreUpdates.timestamp = Timestamp.fromMillis(updates.timestamp);
  }

  // Clean any nested undefined values
  const cleanedUpdates = removeUndefined(firestoreUpdates);

  await updateDoc(messageRef, cleanedUpdates);
};

/**
 * Delete message from Firestore
 */
const deleteMessageFromFirestore = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  const messageRef = doc(
    db,
    'conversations',
    conversationId,
    'messages',
    messageId
  );
  await deleteDoc(messageRef);
};

/**
 * Sync conversation to Firestore
 */
export const syncConversationToFirestore = async (
  conversation: Conversation
): Promise<void> => {
  const conversationRef = doc(db, 'conversations', conversation.id);

  const firestoreData: any = {
    type: conversation.type,
    participants: conversation.participants.map(p => p.id),
    isPinned: conversation.isPinned || false,
    updatedAt: serverTimestamp(),
  };

  if (conversation.name) firestoreData.name = conversation.name;
  if (conversation.avatar) firestoreData.avatar = conversation.avatar;
  if (conversation.admins) firestoreData.admins = conversation.admins;

  await setDoc(conversationRef, firestoreData, { merge: true });
};

/**
 * Start background sync
 * Processes queue periodically when online
 */
export const startBackgroundSync = (): void => {
  if (syncInterval) {
    return; // Already running
  }

  // Process immediately
  processSyncQueue();

  // Then process every 5 seconds
  syncInterval = setInterval(() => {
    if (isOnline()) {
      processSyncQueue();
    }
  }, 5000);

  // Also process when connection is restored
  waitForConnection().then(() => {
    processSyncQueue();
  });
};

/**
 * Stop background sync
 */
export const stopBackgroundSync = (): void => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

/**
 * Sync all data from Firestore to local
 */
export const syncAllFromFirestore = async (userId: string): Promise<void> => {
  if (!isOnline()) {
    return;
  }

  try {
    // Sync conversations
    await syncConversationsFromFirestore(userId);

    // Sync messages for each conversation
    const conversations = await getConversationsLocally();
    for (const conversation of conversations) {
      await syncMessagesFromFirestore(conversation.id);
    }

    await setLastSyncTimestamp(Date.now());
  } catch (error) {
    console.error('Failed to sync from Firestore:', error);
    throw error;
  }
};

/**
 * Sync conversations from Firestore
 */
const syncConversationsFromFirestore = async (userId: string): Promise<void> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );

  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Fetch participant details
    const participants = await Promise.all(
      (data.participants || []).map(async (participantId: string) => {
        const userDoc = await getDoc(doc(db, 'users', participantId));
        if (userDoc.exists()) {
          return { id: participantId, ...userDoc.data() };
        }
        return { id: participantId, name: 'Unknown User' };
      })
    );

    const conversation: Conversation = {
      id: docSnap.id,
      type: data.type || 'dm',
      name: data.name,
      avatar: data.avatar,
      participants,
      messages: [], // Messages loaded separately
      admins: data.admins,
      isPinned: data.isPinned || false,
    };

    await saveConversationLocally(conversation);
  }
};

/**
 * Sync messages from Firestore
 */
const syncMessagesFromFirestore = async (
  conversationId: string
): Promise<void> => {
  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(100));

  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const message: Message = {
      id: docSnap.id,
      text: data.text,
      imageUrl: data.imageUrl,
      timestamp: data.timestamp?.toMillis() || Date.now(),
      senderId: data.senderId,
      replyToId: data.replyToId,
      isSystem: data.isSystem,
      status: data.status,
      isPinned: data.isPinned,
      isStarred: data.isStarred,
      reactions: data.reactions || [],
      location: data.location,
      poll: data.poll,
      file: data.file,
      readBy: data.readBy || [],
      deliveredTo: data.deliveredTo || [],
      syncStatus: 'synced',
    };

    await saveMessageLocally(conversationId, message);
  }
};

/**
 * Subscribe to real-time message updates
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, async (snapshot) => {
    const messages: Message[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        text: data.text,
        imageUrl: data.imageUrl,
        timestamp: data.timestamp?.toMillis() || Date.now(),
        senderId: data.senderId,
        replyToId: data.replyToId,
        isSystem: data.isSystem,
        status: data.status,
        isPinned: data.isPinned,
        isStarred: data.isStarred,
        reactions: data.reactions || [],
        location: data.location,
        poll: data.poll,
        file: data.file,
        readBy: data.readBy || [],
        deliveredTo: data.deliveredTo || [],
        syncStatus: 'synced',
      });
    });

    // Save to local storage
    for (const message of messages) {
      await saveMessageLocally(conversationId, message);
    }

    callback(messages);
  });
};
