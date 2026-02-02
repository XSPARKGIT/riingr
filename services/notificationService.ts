import type { MutedConversation } from '../types';
import { getMutedConversations } from './firestoreService';
import { getMutedConversationsLocally } from './localStorageService';

/**
 * Check if a conversation is currently muted for a user
 * @param userId - The user ID
 * @param conversationId - The conversation ID
 * @param mutedConversations - Optional map of muted conversations (conversationId -> mutedUntil)
 * @returns true if conversation is muted, false otherwise
 */
export const isConversationMuted = (
  userId: string,
  conversationId: string,
  mutedConversations?: Map<string, number | null>
): boolean => {
  // If mutedConversations map is provided, use it
  if (mutedConversations) {
    const mutedUntil = mutedConversations.get(conversationId);
    if (mutedUntil === undefined || mutedUntil === null) {
      return false; // Not muted
    }
    if (mutedUntil === -1) {
      return true; // Muted forever
    }
    return mutedUntil > Date.now(); // Check if still muted
  }
  
  // Otherwise, return false (not muted)
  // In a real implementation, you might want to fetch from Firestore/localStorage here
  return false;
};

/**
 * Get muted conversations for a user (from Firestore or local storage)
 * @param userId - The user ID
 * @param useLocalFirst - If true, try local storage first, then Firestore
 * @returns Map of conversationId -> mutedUntil (null = forever, number = timestamp)
 */
export const getMutedConversationsMap = async (
  userId: string,
  useLocalFirst: boolean = true
): Promise<Map<string, number | null>> => {
  const mutedMap = new Map<string, number | null>();
  
  try {
    let muted: MutedConversation[] = [];
    
    if (useLocalFirst) {
      // Try local storage first
      try {
        muted = await getMutedConversationsLocally(userId);
      } catch (error) {
        console.warn('Failed to load muted conversations from local storage:', error);
      }
      
      // If local storage is empty or failed, try Firestore
      if (muted.length === 0) {
        muted = await getMutedConversations(userId);
      }
    } else {
      // Try Firestore first
      muted = await getMutedConversations(userId);
    }
    
    // Convert to Map
    muted.forEach(m => {
      mutedMap.set(m.conversationId, m.mutedUntil);
    });
  } catch (error) {
    console.error('Error loading muted conversations:', error);
  }
  
  return mutedMap;
};

/**
 * Filter out muted conversations from a list of conversation IDs
 * @param userId - The user ID
 * @param conversationIds - Array of conversation IDs to filter
 * @param mutedConversations - Optional map of muted conversations
 * @returns Array of conversation IDs that are not muted
 */
export const filterMutedConversations = (
  userId: string,
  conversationIds: string[],
  mutedConversations?: Map<string, number | null>
): string[] => {
  return conversationIds.filter(id => !isConversationMuted(userId, id, mutedConversations));
};

/**
 * Check if a notification should be shown for a conversation
 * @param userId - The user ID
 * @param conversationId - The conversation ID
 * @param mutedConversations - Optional map of muted conversations
 * @returns true if notification should be shown, false if muted
 */
export const shouldShowNotification = (
  userId: string,
  conversationId: string,
  mutedConversations?: Map<string, number | null>
): boolean => {
  return !isConversationMuted(userId, conversationId, mutedConversations);
};

/**
 * Check if a notification should be shown based on notification level
 * @param notificationLevel - The notification level ('all', 'mentions', 'none')
 * @param message - The message to check
 * @param currentUserId - The current user ID
 * @returns true if notification should be shown, false otherwise
 */
export const shouldShowNotificationForLevel = (
  notificationLevel: 'all' | 'mentions' | 'none',
  message: { mentions?: string[]; text?: string },
  currentUserId?: string
): boolean => {
  if (notificationLevel === 'none') {
    return false;
  }
  
  if (notificationLevel === 'mentions') {
    // Only show notification if user is mentioned
    if (!currentUserId || !message.mentions) {
      return false;
    }
    return message.mentions.includes(currentUserId);
  }
  
  // notificationLevel === 'all'
  return true;
};
