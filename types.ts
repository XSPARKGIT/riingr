
export type ConversationNotificationLevel = 'all' | 'mentions' | 'silent';

export type ConversationPreference = {
  conversationId: string;
  notificationLevel: ConversationNotificationLevel;
};

export type BlockedUser = {
  userId: string;
  reason?: string;
  blockedAt: number;
};

export type User = {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  isOnline?: boolean;
  username?: string;
  phone?: string;
  birthday?: string;
  status?: string;
  profileComplete?: boolean;
  mutedConversations?: MutedConversation[];
  conversationPreferences?: ConversationPreference[];
  blockedUsers?: BlockedUser[];
};

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type PollOption = {
  text: string;
  votes: number;
  votedBy: string[];
};

export type Message = {
  id: string;
  text?: string;
  translation?: string; // AI Translation
  imageUrl?: string;
  timestamp: number;
  senderId: string;
  replyToId?: string;
  isSystem?: boolean;
  status?: MessageStatus;
  isPinned?: boolean;
  isStarred?: boolean;
  reactions?: string[];
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  poll?: {
    question: string;
    options: PollOption[];
    multipleAnswers?: boolean;
  };
  file?: {
    name: string;
    size: string;
    type: string;
    url?: string; // Firebase Storage download URL
  };
  syncStatus?: 'synced' | 'pending' | 'syncing' | 'failed'; // For offline sync
  readBy?: string[]; // Array of user IDs who read the message (for group chats)
  deliveredTo?: string[]; // Array of user IDs who received the message (for group chats)
  updatedAt?: number; // Timestamp of last update for conflict resolution
  mentions?: string[]; // User IDs mentioned in this message
};

export type ConversationType = 'dm' | 'group';

export type MutedConversation = {
  conversationId: string;
  mutedUntil: number | null; // null = forever, number = timestamp
};

export type Conversation = {
  id: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  // Optional long-form description / about text
  description?: string;
  participants: User[];
  messages: Message[];
  admins?: string[];
  owners?: string[];
  moderators?: string[];
  pinnedMessageIds?: string[];
  theme?: {
    accentColor?: string;
    backgroundVariant?: 'default' | 'soft' | 'bold';
  };
  pendingMemberIds?: string[];
  inviteLinkEnabled?: boolean;
  isPinned?: boolean;
};

export type CallType = 'outgoing' | 'incoming' | 'missed';

export type Call = {
  id: string;
  userId: string;
  type: CallType;
  timestamp: number;
  duration?: string;
  count?: number;
};

// Sync-related types
export type SyncQueueItem = {
  id: string;
  type: 'message' | 'conversation' | 'messageUpdate';
  operation: 'create' | 'update' | 'delete';
  conversationId: string;
  messageId?: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  nextRetryAt?: number; // Timestamp for next retry (exponential backoff)
  priority?: number; // Higher priority = sync first
};

export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error';

export type SyncMetadata = {
  conversationId: string;
  lastSyncTimestamp: number;
  lastSyncStatus: 'success' | 'error';
  syncVersion: number;
};

export type ErrorCategory = 'network' | 'permission' | 'validation' | 'unknown';
