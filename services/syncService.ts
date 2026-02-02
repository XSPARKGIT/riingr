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
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import {
  saveMessageLocally,
  getMessagesLocally,
  updateMessageLocally,
  deleteMessageLocally,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  updateSyncQueueItem,
  saveConversationLocally,
  getConversationsLocally,
  updateConversationLocally,
  setLastSyncTimestamp,
  getLastSyncTimestampForConversation,
  setLastSyncTimestampForConversation,
  getSyncMetadata,
  setSyncMetadata,
} from './localStorageService';
import { isOnline, waitForConnection, isOnlineWithFirebase } from './connectionService';
import type { Message, Conversation, SyncQueueItem, ErrorCategory } from '../types';

let syncInterval: NodeJS.Timeout | null = null;
const MAX_RETRY_COUNT = 5;
const BASE_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 300000; // 5 minutes
const SYNC_LOCK_TIMEOUT = 30000; // 30 seconds
const BATCH_SIZE = 500; // Firestore batch limit

// Sync lock mechanism to prevent concurrent syncs
const syncLocks = new Map<string, { timestamp: number; timeout: NodeJS.Timeout }>();

// Global sync lock to prevent multiple syncAllFromFirestore calls
let globalSyncLock: { timestamp: number; timeout: NodeJS.Timeout } | null = null;
const GLOBAL_SYNC_LOCK_TIMEOUT = 60000; // 60 seconds

/**
 * Acquire sync lock for a conversation
 */
const acquireSyncLock = (conversationId: string): boolean => {
  const existing = syncLocks.get(conversationId);
  if (existing) {
    // Check if lock has expired
    if (Date.now() - existing.timestamp > SYNC_LOCK_TIMEOUT) {
      clearTimeout(existing.timeout);
      syncLocks.delete(conversationId);
    } else {
      return false; // Lock is still active
    }
  }

  // Create new lock
  const timeout = setTimeout(() => {
    syncLocks.delete(conversationId);
  }, SYNC_LOCK_TIMEOUT);

  syncLocks.set(conversationId, {
    timestamp: Date.now(),
    timeout,
  });

  return true;
};

/**
 * Release sync lock
 */
const releaseSyncLock = (conversationId: string): void => {
  const existing = syncLocks.get(conversationId);
  if (existing) {
    clearTimeout(existing.timeout);
    syncLocks.delete(conversationId);
  }
};

/**
 * Classify error type for appropriate handling
 */
const classifyError = (error: any): ErrorCategory => {
  if (!error) return 'unknown';
  
  const code = error.code || '';
  const message = (error.message || '').toLowerCase();

  if (code === 'unavailable' || code === 'deadline-exceeded' || message.includes('network') || message.includes('fetch')) {
    return 'network';
  }
  if (code === 'permission-denied' || message.includes('permission')) {
    return 'permission';
  }
  if (code === 'invalid-argument' || message.includes('validation') || message.includes('invalid')) {
    return 'validation';
  }
  
  return 'unknown';
};

/**
 * Calculate exponential backoff delay with jitter
 */
const calculateRetryDelay = (retryCount: number): number => {
  const exponentialDelay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000; // Random 0-1000ms
  const delay = Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY);
  return delay;
};

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
 * Check if message already exists in Firestore
 */
const messageExistsInFirestore = async (
  conversationId: string,
  messageId: string
): Promise<boolean> => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const docSnap = await getDoc(messageRef);
    return docSnap.exists();
  } catch {
    return false;
  }
};

/**
 * Resolve conflicts between local and cloud message
 */
const resolveMessageConflict = (
  localMessage: Message,
  cloudMessage: any
): Message => {
  // If local message is pending, preserve it
  if (localMessage.syncStatus === 'pending' || localMessage.syncStatus === 'syncing') {
    return localMessage;
  }

  // Compare timestamps - last write wins
  const localUpdated = localMessage.updatedAt || localMessage.timestamp;
  const cloudUpdated = cloudMessage.updatedAt?.toMillis() || cloudMessage.timestamp?.toMillis() || 0;

  if (cloudUpdated > localUpdated) {
    // Cloud is newer - use cloud data but merge arrays
    return {
      ...localMessage,
      ...cloudMessage,
      id: localMessage.id,
      timestamp: cloudMessage.timestamp?.toMillis() || localMessage.timestamp,
      // Merge arrays instead of replacing
      reactions: [...new Set([...(localMessage.reactions || []), ...(cloudMessage.reactions || [])])],
      readBy: [...new Set([...(localMessage.readBy || []), ...(cloudMessage.readBy || [])])],
      deliveredTo: [...new Set([...(localMessage.deliveredTo || []), ...(cloudMessage.deliveredTo || [])])],
      syncStatus: 'synced',
      updatedAt: cloudUpdated,
    };
  }

  // Local is newer or equal - keep local
  return {
    ...localMessage,
    updatedAt: localUpdated,
  };
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
    updatedAt: Date.now(),
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
    priority: 10, // High priority for new messages
  };
  await addToSyncQueue(queueItem);

  // 3. Try to sync if online
  if (await isOnlineWithFirebase()) {
    try {
      await syncMessageToFirestore(conversationId, message);
      await removeFromSyncQueue(queueItem.id);
      await updateMessageLocally(conversationId, message.id, {
        syncStatus: 'synced',
        updatedAt: Date.now(),
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
  // Check for duplicates
  const exists = await messageExistsInFirestore(conversationId, message.id);
  if (exists) {
    console.log(`Message ${message.id} already exists in Firestore, skipping`);
    return;
  }

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
    updatedAt: serverTimestamp(),
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
  if (message.readBy !== undefined) messageData.readBy = message.readBy;
  if (message.deliveredTo !== undefined) messageData.deliveredTo = message.deliveredTo;

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
 * Process sync queue with batch operations and improved error handling
 */
export const processSyncQueue = async (): Promise<void> => {
  if (!(await isOnlineWithFirebase())) {
    return;
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return;
  }

  // Sort queue: higher priority first, then by timestamp (newer first)
  const sortedQueue = queue.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return b.timestamp - a.timestamp;
  });

  // Filter out items that aren't ready for retry
  const now = Date.now();
  const readyQueue = sortedQueue.filter(item => {
    if (item.retryCount === 0) return true;
    if (!item.nextRetryAt) return true;
    return item.nextRetryAt <= now;
  });

  // Group by conversation for batch operations
  const byConversation = new Map<string, SyncQueueItem[]>();
  for (const item of readyQueue) {
    if (!byConversation.has(item.conversationId)) {
      byConversation.set(item.conversationId, []);
    }
    byConversation.get(item.conversationId)!.push(item);
  }

  // Process each conversation
  for (const [conversationId, items] of byConversation.entries()) {
    // Acquire lock for this conversation
    if (!acquireSyncLock(conversationId)) {
      console.log(`Sync locked for conversation ${conversationId}, skipping`);
      continue;
    }

    try {
      // Process in batches
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await processBatch(conversationId, batch);
      }
    } finally {
      releaseSyncLock(conversationId);
    }
  }
};

/**
 * Process a batch of sync queue items
 */
const processBatch = async (
  conversationId: string,
  items: SyncQueueItem[]
): Promise<void> => {
  const firestoreBatch = writeBatch(db);
  let batchCount = 0;
  const successfulItems: string[] = [];

  for (const item of items) {
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
            // Check for duplicates before adding to batch
            if (item.messageId) {
              const exists = await messageExistsInFirestore(item.conversationId, item.messageId);
              if (exists) {
                // Message already exists, just mark as synced
                await updateMessageLocally(item.conversationId, item.messageId, {
                  syncStatus: 'synced',
                  updatedAt: Date.now(),
                });
                successfulItems.push(item.id);
                continue;
              }
            }

            const messageRef = doc(
              db,
              'conversations',
              item.conversationId,
              'messages',
              item.data.id
            );

            const messageData: any = {
              id: item.data.id,
              timestamp: Timestamp.fromMillis(item.data.timestamp),
              senderId: item.data.senderId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            if (item.data.text !== undefined) messageData.text = item.data.text;
            if (item.data.imageUrl !== undefined) messageData.imageUrl = item.data.imageUrl;
            if (item.data.replyToId !== undefined) messageData.replyToId = item.data.replyToId;
            if (item.data.isSystem !== undefined) messageData.isSystem = item.data.isSystem;
            if (item.data.status !== undefined) messageData.status = item.data.status;
            if (item.data.reactions !== undefined) messageData.reactions = item.data.reactions;
            if (item.data.location !== undefined) messageData.location = item.data.location;
            if (item.data.poll !== undefined) messageData.poll = item.data.poll;
            if (item.data.file !== undefined) messageData.file = item.data.file;

            const cleanedData = removeUndefined(messageData);
            firestoreBatch.set(messageRef, cleanedData);
            batchCount++;

            // Update conversation last message
            const conversationRef = doc(db, 'conversations', item.conversationId);
            firestoreBatch.update(conversationRef, {
              lastMessage: {
                text: item.data.text || '',
                timestamp: Timestamp.fromMillis(item.data.timestamp),
                senderId: item.data.senderId,
              },
              updatedAt: serverTimestamp(),
            });
            batchCount++;

            if (item.messageId) {
              await updateMessageLocally(item.conversationId, item.messageId, {
                syncStatus: 'synced',
                updatedAt: Date.now(),
              });
            }
          } else if (item.operation === 'update' && item.messageId) {
            const messageRef = doc(
              db,
              'conversations',
              item.conversationId,
              'messages',
              item.messageId
            );

            const updates: any = {
              updatedAt: serverTimestamp(),
            };

            if (item.data.text !== undefined) updates.text = item.data.text;
            if (item.data.reactions !== undefined) updates.reactions = item.data.reactions;
            if (item.data.readBy !== undefined) updates.readBy = item.data.readBy;
            if (item.data.deliveredTo !== undefined) updates.deliveredTo = item.data.deliveredTo;
            if (item.data.isPinned !== undefined) updates.isPinned = item.data.isPinned;
            if (item.data.isStarred !== undefined) updates.isStarred = item.data.isStarred;

            const cleanedUpdates = removeUndefined(updates);
            firestoreBatch.update(messageRef, cleanedUpdates);
            batchCount++;

            await updateMessageLocally(item.conversationId, item.messageId, {
              syncStatus: 'synced',
              updatedAt: Date.now(),
            });
          } else if (item.operation === 'delete' && item.messageId) {
            const messageRef = doc(
              db,
              'conversations',
              item.conversationId,
              'messages',
              item.messageId
            );
            firestoreBatch.delete(messageRef);
            batchCount++;
          }
          break;
        case 'conversation':
          const conversationRef = doc(db, 'conversations', item.data.id);
          const firestoreData: any = {
            type: item.data.type,
            participants: item.data.participants.map((p: any) => p.id),
            isPinned: item.data.isPinned || false,
            updatedAt: serverTimestamp(),
          };
          if (item.data.name) firestoreData.name = item.data.name;
          if (item.data.avatar) firestoreData.avatar = item.data.avatar;
          if (item.data.admins) firestoreData.admins = item.data.admins;
          firestoreBatch.set(conversationRef, firestoreData, { merge: true });
          batchCount++;
          break;
      }

      successfulItems.push(item.id);
    } catch (error: any) {
      console.error(`Error preparing batch item ${item.id}:`, error);
      // Handle individual item error
      await handleSyncError(item, error);
    }
  }

  // Commit batch if there are operations
  if (batchCount > 0) {
    try {
      await firestoreBatch.commit();
      
      // Remove successful items from queue
      for (const itemId of successfulItems) {
        await removeFromSyncQueue(itemId);
      }
    } catch (error: any) {
      console.error('Batch commit failed:', error);
      // Handle batch failure - retry all items
      for (const item of items) {
        await handleSyncError(item, error);
      }
    }
  } else {
    // No batch operations, just remove successful items
    for (const itemId of successfulItems) {
      await removeFromSyncQueue(itemId);
    }
  }
};

/**
 * Handle sync errors with exponential backoff
 */
const handleSyncError = async (item: SyncQueueItem, error: any): Promise<void> => {
  const errorCategory = classifyError(error);
  console.error(`Sync failed for ${item.id} (${errorCategory}):`, error);

  // Set sync status to 'failed' for messages after max retries
  if (item.type === 'message' && item.messageId) {
    const newRetryCount = item.retryCount + 1;
    if (newRetryCount > MAX_RETRY_COUNT) {
      await updateMessageLocally(item.conversationId, item.messageId, {
        syncStatus: 'failed',
      });
    } else {
      // Still retrying, keep as pending
      await updateMessageLocally(item.conversationId, item.messageId, {
        syncStatus: 'pending',
      });
    }
  }

  // Increment retry count and calculate next retry time
  const newRetryCount = item.retryCount + 1;
  const retryDelay = calculateRetryDelay(newRetryCount);
  const nextRetryAt = Date.now() + retryDelay;

  if (newRetryCount > MAX_RETRY_COUNT) {
    // Mark as failed after max retries
    await updateSyncQueueItem(item.id, {
      retryCount: newRetryCount,
      lastError: error.message || String(error),
      nextRetryAt,
    });
  } else {
    // Update retry count for next attempt
    await updateSyncQueueItem(item.id, {
      retryCount: newRetryCount,
      lastError: error.message || String(error),
      nextRetryAt,
      priority: Math.max(0, (item.priority || 0) - 1), // Lower priority after retries
    });
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
 * Update message with offline support
 * Updates locally first, then syncs to Firestore
 */
export const updateMessage = async (
  conversationId: string,
  messageId: string,
  updates: Partial<Message>
): Promise<void> => {
  // 1. Update local storage immediately
  await updateMessageLocally(conversationId, messageId, updates);

  // 2. Add to sync queue for offline support
  const queueItem: SyncQueueItem = {
    id: `update_${messageId}_${Date.now()}`,
    type: 'message',
    operation: 'update',
    conversationId,
    messageId,
    data: updates,
    timestamp: Date.now(),
    retryCount: 0,
    priority: 10, // High priority for updates
  };
  await addToSyncQueue(queueItem);

  // 3. Try to update in Firestore if online
  if (await isOnlineWithFirebase()) {
    try {
      await updateMessageInFirestore(conversationId, messageId, updates);
      await removeFromSyncQueue(queueItem.id);
    } catch (error) {
      console.error('Failed to update message in Firestore:', error);
      // Keep in queue for retry
    }
  }
};

/**
 * Delete message with offline support
 * Deletes locally first, then syncs to Firestore
 */
export const deleteMessage = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  // 1. Delete from local storage immediately
  await deleteMessageLocally(conversationId, messageId);

  // 2. Add to sync queue for offline support
  const queueItem: SyncQueueItem = {
    id: `delete_${messageId}_${Date.now()}`,
    type: 'message',
    operation: 'delete',
    conversationId,
    messageId,
    timestamp: Date.now(),
    retryCount: 0,
    priority: 10, // High priority for deletions
  };
  await addToSyncQueue(queueItem);

  // 3. Try to delete from Firestore if online
  if (await isOnlineWithFirebase()) {
    try {
      await deleteMessageFromFirestore(conversationId, messageId);
      await removeFromSyncQueue(queueItem.id);
    } catch (error) {
      console.error('Failed to delete message from Firestore:', error);
      // Keep in queue for retry
    }
  }
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
  if (conversation.description !== undefined) firestoreData.description = conversation.description || null;
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
    isOnlineWithFirebase().then(online => {
      if (online) {
        processSyncQueue();
      }
    });
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
 * Acquire global sync lock
 */
const acquireGlobalSyncLock = (): boolean => {
  if (globalSyncLock) {
    // Check if lock has expired
    if (Date.now() - globalSyncLock.timestamp > GLOBAL_SYNC_LOCK_TIMEOUT) {
      clearTimeout(globalSyncLock.timeout);
      globalSyncLock = null;
    } else {
      return false; // Lock is still active
    }
  }

  // Create new lock
  const timeout = setTimeout(() => {
    globalSyncLock = null;
  }, GLOBAL_SYNC_LOCK_TIMEOUT);

  globalSyncLock = {
    timestamp: Date.now(),
    timeout,
  };

  return true;
};

/**
 * Release global sync lock
 */
const releaseGlobalSyncLock = (): void => {
  if (globalSyncLock) {
    clearTimeout(globalSyncLock.timeout);
    globalSyncLock = null;
  }
};

/**
 * Sync all data from Firestore to local (incremental)
 */
export const syncAllFromFirestore = async (userId: string): Promise<void> => {
  if (!(await isOnlineWithFirebase())) {
    return;
  }

  // Check if global sync is already in progress
  if (!acquireGlobalSyncLock()) {
    console.log('⏸️ Sync already in progress, skipping duplicate call');
    return;
  }

  try {
    // Sync conversations
    await syncConversationsFromFirestore(userId);

    // Sync messages for each conversation (incremental)
    const conversations = await getConversationsLocally();
    for (const conversation of conversations) {
      if (!acquireSyncLock(conversation.id)) {
        continue; // Skip if locked
      }
      try {
        await syncMessagesFromFirestore(conversation.id, true);
        await setLastSyncTimestampForConversation(conversation.id, Date.now());
      } finally {
        releaseSyncLock(conversation.id);
      }
    }

    await setLastSyncTimestamp(Date.now());
  } catch (error) {
    console.error('Failed to sync from Firestore:', error);
    throw error;
  } finally {
    releaseGlobalSyncLock();
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
    
    console.log('🔍 [syncConversations] Processing conversation:', {
      conversationId: docSnap.id,
      participantIds: data.participants,
      currentUserId: userId,
    });
    
    // Fetch participant details
    const participants = await Promise.all(
      (data.participants || []).map(async (participantId: string) => {
        const userDoc = await getDoc(doc(db, 'users', participantId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('✅ [syncConversations] Fetched participant data:', {
            conversationId: docSnap.id,
            participantId,
            name: userData.name,
            email: userData.email,
            username: userData.username,
          });
          // Properly map Firestore data to User type
          return {
            id: participantId,
            name: userData.name || 'Unknown User',
            email: userData.email || '',
            avatar: userData.avatar || '',
            username: userData.username,
            phone: userData.phone || '',
            isOnline: userData.isOnline || false,
            status: userData.status,
            profileComplete: userData.profileComplete,
          } as User;
        }
        console.error('❌ [syncConversations] User document not found:', {
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

    console.log('📋 [syncConversations] All participants fetched:', {
      conversationId: docSnap.id,
      participants: participants.map(p => ({ id: p.id, name: p.name, email: p.email })),
    });

    const conversation: Conversation = {
      id: docSnap.id,
      type: data.type || 'dm',
      name: data.name,
      avatar: data.avatar,
      description: data.description,
      participants,
      messages: [], // Messages loaded separately
      admins: data.admins,
      isPinned: data.isPinned || false,
    };

    await saveConversationLocally(conversation);
  }
};

/**
 * Sync messages from Firestore (incremental)
 */
const syncMessagesFromFirestore = async (
  conversationId: string,
  incremental: boolean = true
): Promise<void> => {
  const lastSyncTimestamp = incremental
    ? await getLastSyncTimestampForConversation(conversationId)
    : 0;

  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );

  // Build query - only fetch new messages if incremental
  let q;
  if (incremental && lastSyncTimestamp > 0) {
    q = query(
      messagesRef,
      where('timestamp', '>', Timestamp.fromMillis(lastSyncTimestamp)),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
  } else {
    // Initial sync - get most recent messages
    q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
  }

  const snapshot = await getDocs(q);
  const existingMessages = await getMessagesLocally(conversationId, 1000);
  const existingIds = new Set(existingMessages.map(m => m.id));

  const messagesToSave: Message[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const messageId = docSnap.id;

    // Skip if already exists locally (unless it's a conflict)
    if (existingIds.has(messageId)) {
      const existing = existingMessages.find(m => m.id === messageId);
      if (existing) {
        // Resolve conflict
        const resolved = resolveMessageConflict(existing, data);
        messagesToSave.push(resolved);
        continue;
      }
    }

    const message: Message = {
      id: messageId,
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
      updatedAt: data.updatedAt?.toMillis() || data.timestamp?.toMillis() || Date.now(),
    };

    messagesToSave.push(message);
  }

  // Save all messages, ensuring proper ordering
  for (const message of messagesToSave.sort((a, b) => a.timestamp - b.timestamp)) {
    await saveMessageLocally(conversationId, message);
  }
};

/**
 * Subscribe to real-time message updates (optimized to prevent duplicates)
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
    const existingMessages = await getMessagesLocally(conversationId, 1000);
    const existingMap = new Map(existingMessages.map(m => [m.id, m]));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const messageId = docSnap.id;
      
      // Check if message already exists locally
      const existing = existingMap.get(messageId);
      
      if (existing) {
        // Resolve conflict - merge updates
        const resolved = resolveMessageConflict(existing, data);
        messages.push(resolved);
      } else {
        // New message
        const message: Message = {
          id: messageId,
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
          updatedAt: data.updatedAt?.toMillis() || data.timestamp?.toMillis() || Date.now(),
        };
        messages.push(message);
      }
    });

    // Save to local storage (only new/updated messages)
    for (const message of messages) {
      const existing = existingMap.get(message.id);
      if (!existing || existing.updatedAt !== message.updatedAt) {
        await saveMessageLocally(conversationId, message);
      }
    }

    // Ensure messages are sorted by timestamp
    const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
    callback(sortedMessages);
  });
};
