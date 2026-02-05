# Firestore Security Rules

## Setup Instructions

1. Go to Firebase Console → Firestore Database → Rules
2. Replace the default rules with the rules below
3. Click "Publish" to save

## Complete Production-Ready Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is participant in conversation
    function isParticipant(conversationId) {
      return isAuthenticated() && 
        request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    }
    
    // Users Collection
    match /users/{userId} {
      // Allow unauthenticated reads for username availability checks during sign-up
      // Authenticated users can read user profiles (for search, contacts)
      allow read: if true; // Allow both authenticated and unauthenticated reads
      
      // Users can only create/update/delete their own profile
      allow create: if isAuthenticated() && request.auth.uid == userId;
      
      // Update rules:
      // - Users can update their own profile fields (name, status, avatar, etc.)
      // - Users can update their own mutedConversations array (for muting/unmuting conversations)
      // - Users can update their own conversationPreferences and blockedUsers arrays
      allow update: if isAuthenticated() && request.auth.uid == userId;
      
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Conversations Collection
    match /conversations/{conversationId} {
      // Participants can read conversations (check participants array directly for queries)
      allow read: if isAuthenticated() && 
        request.auth.uid in resource.data.participants;
      
      // Update rules:
      // - Owners/admins can update group metadata (name, avatar, description, theme, updatedAt)
      // - Owners/admins can update participants array (add/remove members, pendingMemberIds)
      // - Owners/admins can update role arrays (owners, admins, moderators)
      // - Any authenticated user can add *themselves* to pendingMemberIds (join request)
      allow update: if
        (
          // Regular participant/admin updates
          isParticipant(conversationId) &&
          (
            // Owners/Admins can update group metadata + theme
            (resource.data.type == 'group' && 
             (request.auth.uid in resource.data.owners || request.auth.uid in resource.data.admins) &&
             request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'avatar', 'description', 'theme', 'updatedAt'])) ||
            // Owners/Admins can update participants and pendingMemberIds
            (resource.data.type == 'group' && 
             (request.auth.uid in resource.data.owners || request.auth.uid in resource.data.admins) &&
             request.resource.data.diff(resource.data).affectedKeys().hasOnly(['participants', 'pendingMemberIds', 'updatedAt'])) ||
            // Owners/Admins can update role arrays and inviteLinkEnabled
            (resource.data.type == 'group' && 
             (request.auth.uid in resource.data.owners || request.auth.uid in resource.data.admins) &&
             request.resource.data.diff(resource.data).affectedKeys().hasOnly(['owners', 'admins', 'moderators', 'inviteLinkEnabled', 'updatedAt'])) ||
            // Participants can update other fields (like isPinned)
            (!request.resource.data.diff(resource.data).affectedKeys().hasAny([
              'name',
              'avatar',
              'description',
              'theme',
              'participants',
              'pendingMemberIds',
              'owners',
              'admins',
              'moderators',
              'inviteLinkEnabled'
            ]))
          )
        )
        ||
        (
          // Join-by-invite: allow any authenticated user to add themselves to pendingMemberIds
          isAuthenticated() &&
          resource.data.type == 'group' &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['pendingMemberIds', 'updatedAt']) &&
          // The new pendingMemberIds must contain the caller, and they must not already be pending
          !(request.auth.uid in resource.data.pendingMemberIds) &&
          request.auth.uid in request.resource.data.pendingMemberIds
        );
      
      // Participants can delete conversations (for leaving groups)
      allow delete: if isParticipant(conversationId);
      
      // Anyone authenticated can create conversations, but must include themselves in participants
      allow create: if isAuthenticated() && 
        request.auth.uid in request.resource.data.participants;
      
      // Messages Subcollection
      match /messages/{messageId} {
        // Participants can read all messages (check parent conversation participants)
        allow read: if isAuthenticated() && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        
          // Participants can create messages
          // senderId must match auth.uid OR be 'system' for system messages
          allow create: if isParticipant(conversationId) && 
            (request.resource.data.senderId == request.auth.uid || 
             request.resource.data.senderId == 'system');
        
        // Update rules:
        // - Message sender can update their own messages
        // - Any participant can update read/delivered status fields only
        allow update: if isParticipant(conversationId) && (
          // Sender can update their own message
          resource.data.senderId == request.auth.uid ||
          // Participants can update read/delivered status only
          (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy', 'deliveredTo', 'status', 'readAt', 'deliveredAt']))
        );
        
        // Only message sender can delete their own messages
        allow delete: if isParticipant(conversationId) && 
          resource.data.senderId == request.auth.uid;
      }
      
      // Typing Status Subcollection
      match /typing/{userId} {
        // Participants can read typing status (check parent conversation participants)
        allow read: if isAuthenticated() && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        
        // Users can only set their own typing status
        allow create: if isParticipant(conversationId) && userId == request.auth.uid;
        allow update: if isParticipant(conversationId) && userId == request.auth.uid;
        allow delete: if isParticipant(conversationId) && userId == request.auth.uid;
      }
    }
    
    // Contacts Subcollection (under users/{userId}/contacts/{contactId})
    match /users/{userId}/contacts/{contactId} {
      // Users can read their own contacts
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // Users can add/remove their own contacts
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }

    // Invites collection (for group invite links)
    match /invites/{token} {
      // Anyone can read an invite document if they have the token (to resolve which group)
      allow read: if true;
      
      // Only authenticated users with admin/owner rights on the group can create/update invites
      allow create, update: if isAuthenticated() &&
        request.resource.data.groupId is string &&
        isParticipant(request.resource.data.groupId) &&
        (
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(request.resource.data.groupId)).data.owners ||
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(request.resource.data.groupId)).data.admins
        );
    }

    // Reports collection (for abuse reports)
    match /reports/{reportId} {
      // Any authenticated user can create a report
      allow create: if isAuthenticated();
      // Reads should be restricted to backend/admin tools; deny client reads by default
      allow read, update, delete: if false;
    }
  }
}
```

## Rule Explanations

### Users Collection
- **Read**: Both authenticated and unauthenticated users can read user profiles
  - Unauthenticated reads are allowed for username availability checks during sign-up
  - Authenticated users can read profiles for search and displaying contact info
- **Create/Delete**: Users can only create/delete their own profile (authentication required)
- **Update**: Users can update their own profile
  - Users can update their `mutedConversations` array to mute/unmute conversations
  - Users can update other profile fields (name, avatar, status, etc.)

### Conversations Collection
- **Read**: Participants can read conversations (checks `participants` array directly for efficient queries)
- **Update**: 
  - **Group Admins** can update group metadata (name, avatar, description, updatedAt)
  - **Group Admins** can update participants array (add/remove members)
  - **Group Admins** can update admins array (transfer/remove admin rights)
  - **Participants** can update other fields (like isPinned)
- **Delete**: Participants can delete conversations (for leaving groups)
- **Create**: Anyone authenticated can create conversations, but must include themselves in the `participants` array

### Messages Subcollection
- **Read**: All participants can read messages in the conversation
- **Create**: Participants can create messages
  - Regular messages: `senderId` must match the authenticated user's ID
  - System messages: `senderId` can be 'system' (for group creation, user joined, etc.)
- **Update**: 
  - Message senders can update their own messages
  - Any participant can update read/delivered status fields (for read receipts)
- **Delete**: Only the message sender can delete their own messages

### Typing Status Subcollection
- **Read**: All participants can see typing status
- **Create/Update/Delete**: Users can only set their own typing status

### Contacts Subcollection
- **Read**: Users can only read their own contacts
- **Create/Delete**: Users can only add/remove their own contacts

## Important Notes

1. **Participants Array**: Every conversation document must have a `participants` field that is an array of user IDs (strings). Example:
   ```javascript
   {
     participants: ["user1_uid", "user2_uid"],
     type: "dm",
     // ... other fields
   }
   ```

2. **Authentication**: 
   - Read operations on users collection do NOT require authentication (needed for username availability checks during sign-up)
   - All other operations (create, update, delete) require authentication

3. **Data Structure**: The rules assume the following Firestore structure:
   - `users/{userId}` - User profiles
   - `conversations/{conversationId}` - Conversation documents
   - `conversations/{conversationId}/messages/{messageId}` - Messages
   - `conversations/{conversationId}/typing/{userId}` - Typing status
   - `users/{userId}/contacts/{contactId}` - User contacts

## Testing

After publishing the rules:
1. Test creating a conversation with yourself as a participant
2. Test sending messages in the conversation
3. Test reading messages as a participant
4. Test updating read receipts
5. Test typing indicators
6. Test adding/removing contacts
7. Verify that non-participants cannot access conversations

## Troubleshooting

If you get "Missing or insufficient permissions" errors:
1. For username availability checks: The rules now allow unauthenticated reads, so this should work during sign-up
2. For conversations: 
   - Verify the user is authenticated (`request.auth != null`)
   - Verify the conversation has a `participants` array
   - Verify the authenticated user's ID is in the `participants` array
   - For queries: The read rule checks `resource.data.participants` directly (no `get()` call needed)
3. Check that the conversation document exists before trying to access messages
4. Verify the message `senderId` matches `request.auth.uid` when creating messages
5. **Important**: After updating security rules, make sure to publish them in Firebase Console
