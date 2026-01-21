import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Message, Conversation, SyncQueueItem } from '../types';

// IndexedDB Schema
interface RingrDB extends DBSchema {
  messages: {
    key: string; // `${conversationId}_${messageId}`
    value: Message & { conversationId: string; originalId: string };
    indexes: {
      'by-conversation': string;
      'by-timestamp': number;
      'by-sync-status': string;
    };
  };
  conversations: {
    key: string; // conversationId
    value: Conversation & { lastSync?: number };
  };
  syncQueue: {
    key: string; // queue item id
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': number;
      'by-type': string;
    };
  };
  metadata: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'ringr-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RingrDB> | null = null;

/**
 * Initialize IndexedDB database
 */
export const initLocalDB = async (): Promise<IDBPDatabase<RingrDB>> => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<RingrDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', {
          keyPath: 'id',
        });
        messageStore.createIndex('by-conversation', 'conversationId');
        messageStore.createIndex('by-timestamp', 'timestamp');
        messageStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Conversations store
      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', {
          keyPath: 'id',
        });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', {
          keyPath: 'id',
        });
        queueStore.createIndex('by-timestamp', 'timestamp');
        queueStore.createIndex('by-type', 'type');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    },
  });

  return dbInstance;
};

/**
 * Message operations
 */
export const saveMessageLocally = async (
  conversationId: string,
  message: Message
): Promise<void> => {
  const db = await initLocalDB();
  const storageKey = `${conversationId}_${message.id}`;
  await db.put('messages', {
    ...message,
    conversationId,
    id: storageKey, // Use composite key for storage
    originalId: message.id, // Keep original ID
  });
};

export const getMessagesLocally = async (
  conversationId: string,
  limit: number = 100
): Promise<Message[]> => {
  const db = await initLocalDB();
  const tx = db.transaction('messages', 'readonly');
  const index = tx.store.index('by-conversation');
  
  const messages = await index.getAll(conversationId);
  
  // Sort by timestamp ascending (oldest first) and limit
  return messages
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, limit)
    .map(({ conversationId, originalId, ...message }) => ({
      ...message,
      id: originalId || message.id, // Restore original ID
    }));
};

export const updateMessageLocally = async (
  conversationId: string,
  messageId: string,
  updates: Partial<Message>
): Promise<void> => {
  const db = await initLocalDB();
  const key = `${conversationId}_${messageId}`;
  const existing = await db.get('messages', key);
  
  if (existing) {
    await db.put('messages', {
      ...existing,
      ...updates,
    });
  }
};

export const deleteMessageLocally = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  const db = await initLocalDB();
  const key = `${conversationId}_${messageId}`;
  await db.delete('messages', key);
};

/**
 * Conversation operations
 */
export const saveConversationLocally = async (
  conversation: Conversation
): Promise<void> => {
  const db = await initLocalDB();
  await db.put('conversations', {
    ...conversation,
    lastSync: Date.now(),
  });
};

export const getConversationsLocally = async (): Promise<Conversation[]> => {
  const db = await initLocalDB();
  const conversations = await db.getAll('conversations');
  return conversations.map(({ lastSync, ...conversation }) => conversation);
};

export const updateConversationLocally = async (
  conversationId: string,
  updates: Partial<Conversation>
): Promise<void> => {
  const db = await initLocalDB();
  const existing = await db.get('conversations', conversationId);
  
  if (existing) {
    await db.put('conversations', {
      ...existing,
      ...updates,
      lastSync: Date.now(),
    });
  }
};

/**
 * Sync queue operations
 */
export const addToSyncQueue = async (item: SyncQueueItem): Promise<void> => {
  const db = await initLocalDB();
  await db.put('syncQueue', item);
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const db = await initLocalDB();
  return db.getAll('syncQueue');
};

export const getSyncQueueCount = async (): Promise<number> => {
  const db = await initLocalDB();
  const queue = await db.getAll('syncQueue');
  return queue.length;
};

export const removeFromSyncQueue = async (itemId: string): Promise<void> => {
  const db = await initLocalDB();
  await db.delete('syncQueue', itemId);
};

export const updateSyncQueueItem = async (
  itemId: string,
  updates: Partial<SyncQueueItem>
): Promise<void> => {
  const db = await initLocalDB();
  const existing = await db.get('syncQueue', itemId);
  
  if (existing) {
    await db.put('syncQueue', {
      ...existing,
      ...updates,
    });
  }
};

export const clearSyncQueue = async (): Promise<void> => {
  const db = await initLocalDB();
  await db.clear('syncQueue');
};

/**
 * Metadata operations
 */
export const getLastSyncTimestamp = async (): Promise<number> => {
  const db = await initLocalDB();
  const metadata = await db.get('metadata', 'lastSyncTimestamp');
  return metadata || 0;
};

export const setLastSyncTimestamp = async (timestamp: number): Promise<void> => {
  const db = await initLocalDB();
  await db.put('metadata', timestamp, 'lastSyncTimestamp');
};

export const getConnectionStatus = async (): Promise<'online' | 'offline'> => {
  const db = await initLocalDB();
  const status = await db.get('metadata', 'connectionStatus');
  return status || 'offline';
};

export const setConnectionStatus = async (
  status: 'online' | 'offline'
): Promise<void> => {
  const db = await initLocalDB();
  await db.put('metadata', status, 'connectionStatus');
};
