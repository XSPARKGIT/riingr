# Testing Checklist

## Overview
This checklist covers core sync scenarios and group features end-to-end testing. Use this to systematically verify functionality and catch bugs.

**Date Started:** _______________  
**Tester:** _______________

---

## Part 1: Core Sync Scenarios (Single User)

### 1.1 Online Message Operations

#### Send Messages
- [ ] Send text message in DM conversation
- [ ] Send text message in group conversation
- [ ] Send message with image attachment
- [ ] Send message with file attachment
- [ ] Send message with location
- [ ] Send poll message
- [ ] Send message with reply (quote another message)
- [ ] Send message with mentions (@username) in group
- [ ] Verify all messages appear immediately in UI (optimistic update)
- [ ] Verify all messages sync to Firestore (check Firebase Console)
- [ ] Verify all messages persist after page refresh

#### Edit Messages
- [ ] Edit a text message you sent
- [ ] Verify edit appears immediately in UI
- [ ] Verify edit syncs to Firestore
- [ ] Verify edit persists after page refresh

#### Delete Messages
- [ ] Delete a message you sent in DM
- [ ] Delete a message you sent in group
- [ ] Verify message disappears immediately from UI
- [ ] Verify message is deleted from Firestore
- [ ] Verify message stays deleted after page refresh
- [ ] Verify you cannot delete messages sent by others (delete option should not appear)

#### Reactions & Stars
- [ ] Add reaction emoji to a message
- [ ] Remove reaction emoji from a message
- [ ] Star a message
- [ ] Unstar a message
- [ ] Verify all reactions/stars sync to Firestore
- [ ] Verify reactions/stars persist after page refresh

#### Pin Messages (Groups Only)
- [ ] Pin a message in a group
- [ ] Verify pin indicator appears on message
- [ ] Verify pinned message appears in Group Settings → Pinned tab
- [ ] Pin a different message (should unpin the previous one)
- [ ] Unpin a message
- [ ] Verify pin status syncs to Firestore
- [ ] Verify pin status persists after page refresh

### 1.2 Offline/Online Sync

#### Go Offline
- [ ] Open browser DevTools → Network tab → Set to "Offline"
- [ ] Verify connection indicator shows offline status in app header

#### Send Messages While Offline
- [ ] Send 3-5 text messages while offline
- [ ] Delete one of the messages while offline
- [ ] Add reaction to a message while offline
- [ ] Verify messages show "pending" or "syncing" status indicator
- [ ] Verify messages appear in UI immediately (optimistic update)

#### Come Back Online
- [ ] Set Network tab back to "Online"
- [ ] Wait 5-10 seconds for sync to complete
- [ ] Verify all messages sent offline now show "synced" status
- [ ] Verify deleted message stays deleted
- [ ] Verify reaction was applied
- [ ] Check browser console for any sync errors
- [ ] Verify no duplicate messages appeared
- [ ] Verify Firestore contains all messages correctly

#### Offline Edge Cases
- [ ] Send message while offline, then close browser before coming online
- [ ] Reopen browser and verify message syncs when connection restored
- [ ] Send message while offline, then go offline again before sync completes
- [ ] Verify message eventually syncs when connection is stable

### 1.3 Conversation Management

#### Create Conversations
- [ ] Create new DM conversation with a contact
- [ ] Create new group conversation with multiple members
- [ ] Verify conversations appear in conversation list
- [ ] Verify conversations sync to Firestore
- [ ] Verify conversations persist after page refresh

#### Delete/Leave Conversations
- [ ] Leave a group conversation
- [ ] Verify group disappears from your conversation list
- [ ] Verify you are removed from group participants in Firestore
- [ ] Verify other members still see the group

#### Mute/Unmute
- [ ] Mute a conversation
- [ ] Verify mute indicator appears in conversation list
- [ ] Unmute the conversation
- [ ] Verify mute indicator disappears

---

## Part 2: Group Features End-to-End (Two Accounts)

### 2.1 Group Creation & Setup

#### As Admin (Account A)
- [ ] Create a new group with name "Test Group"
- [ ] Add 2-3 members to the group
- [ ] Set group description
- [ ] Upload/change group avatar
- [ ] Verify group appears in conversation list
- [ ] Verify all members are listed in Group Settings → Participants
- [ ] Verify you are marked as ADMIN

#### As Member (Account B)
- [ ] Log in as Account B
- [ ] Verify group appears in conversation list
- [ ] Verify you are NOT marked as admin
- [ ] Verify you can see group name, avatar, description
- [ ] Verify you can send messages in group

### 2.2 Invite Links & Join Flow

#### Generate Invite Link (Account A - Admin)
- [ ] Open Group Settings → Invite Links tab
- [ ] Click "CREATE LINK"
- [ ] Verify link is generated and displayed
- [ ] Verify link is copied to clipboard (or shown in prompt)
- [ ] Copy the full invite link URL

#### Join via Invite Link (Account C - New User)
- [ ] Open invite link in incognito/private window (or different browser)
- [ ] Verify JoinGroupView page appears
- [ ] Verify group name, avatar, description are displayed
- [ ] Verify member count is shown
- [ ] If not logged in: Click "Log In to Join"
- [ ] Log in with Account C credentials
- [ ] Verify JoinGroupView appears again after login
- [ ] Click "Join Group" button
- [ ] Verify toast shows "Join request sent! Waiting for admin approval."
- [ ] Verify you are redirected to main app

#### Approve Join Request (Account A - Admin)
- [ ] Log back in as Account A (admin)
- [ ] Open the group conversation
- [ ] Open Group Settings
- [ ] Verify "Pending members (1)" section appears
- [ ] Verify Account C's name/username is listed
- [ ] Click "Approve" button
- [ ] Verify toast shows "Member approved"
- [ ] Verify Account C disappears from pending list
- [ ] Verify Account C appears in Participants list

#### Verify Join Success (Account C)
- [ ] Log back in as Account C
- [ ] Verify group now appears in conversation list
- [ ] Open the group
- [ ] Verify you can see all previous messages
- [ ] Verify you can send messages
- [ ] Verify no permission errors in console

### 2.3 Invite Link Management

#### View Active Links (Account A - Admin)
- [ ] Open Group Settings → Invite Links
- [ ] Verify all active links are listed
- [ ] Verify creation date is shown for each link
- [ ] Verify expiration date is shown (if set)

#### Copy Invite Link
- [ ] Click "COPY" button on an invite link
- [ ] Verify link is copied to clipboard
- [ ] Verify toast confirms copy action
- [ ] Paste link and verify it's the correct URL

#### Regenerate Invite Link
- [ ] Click "REGENERATE" on an active link
- [ ] Verify old link is revoked
- [ ] Verify new link is generated
- [ ] Verify new link is different from old link
- [ ] Try opening old link (should show "Invalid invite link" or "no longer active")

#### Revoke Invite Link
- [ ] Click "REVOKE" on an active link
- [ ] Verify link disappears from active links list
- [ ] Try opening revoked link (should show "no longer active" error)

#### Expired Invite Links
- [ ] Create invite link with expiration date (1 minute in future for testing)
- [ ] Wait for expiration
- [ ] Try opening expired link
- [ ] Verify "This invite link has expired" error message appears

### 2.4 Group Settings & Permissions

#### Admin-Only Features (Account A)
- [ ] Verify you can see "ADD MEMBER" button
- [ ] Verify you can see theme color picker
- [ ] Verify you can see invite link management
- [ ] Verify you can edit group name
- [ ] Verify you can edit group description
- [ ] Verify you can change group avatar
- [ ] Verify you can see "Pending members" section (when applicable)
- [ ] Verify you can approve/reject pending members

#### Non-Admin Features (Account B)
- [ ] Verify you CANNOT see "ADD MEMBER" button
- [ ] Verify you CANNOT see theme color picker
- [ ] Verify you CANNOT see invite link management
- [ ] Verify you CANNOT edit group name/description/avatar
- [ ] Verify you CANNOT see pending members section
- [ ] Verify you CAN see and change notification settings
- [ ] Verify you CAN mute/unmute the group
- [ ] Verify you CAN leave the group

### 2.5 Theme & Customization

#### Change Theme Color (Account A - Admin)
- [ ] Open Group Settings → Theme
- [ ] Select a different accent color (e.g., blue)
- [ ] Verify toast confirms theme change
- [ ] Verify your own message bubbles use new color
- [ ] Verify mention highlights use new color
- [ ] Verify pinned message indicators use new color
- [ ] Send a new message and verify it uses new color

#### Verify Theme Syncs (Account B)
- [ ] Log in as Account B
- [ ] Open the same group
- [ ] Verify group theme color matches what Admin set
- [ ] Verify Account B's own messages use the group theme color
- [ ] Verify mentions use the group theme color

### 2.6 Mentions & Notifications

#### Send Mentions (Account A)
- [ ] Type "@" in message input
- [ ] Verify mention autocomplete popup appears
- [ ] Select a member from the list
- [ ] Send message with mention
- [ ] Verify mention is highlighted in message bubble
- [ ] Verify mentioned user's name is clickable

#### Notification Levels (Account B)
- [ ] Open Group Settings → Notifications
- [ ] Change to "MENTIONS ONLY"
- [ ] Verify setting saves
- [ ] Have Account A send regular message (no mention)
- [ ] Verify Account B does NOT receive notification
- [ ] Have Account A send message with @AccountB mention
- [ ] Verify Account B DOES receive notification
- [ ] Change to "NONE"
- [ ] Verify no notifications are received even for mentions

### 2.7 Member Management

#### Add Member (Account A - Admin)
- [ ] Open Group Settings → Participants
- [ ] Click "ADD MEMBER"
- [ ] Search for and select a user
- [ ] Verify user is added to participants list
- [ ] Verify toast confirms addition
- [ ] Verify new member can see group and messages

#### Remove Member (Account A - Admin)
- [ ] Click on a member in Participants list
- [ ] Click remove/delete option
- [ ] Confirm removal
- [ ] Verify member is removed from list
- [ ] Verify removed member no longer sees the group

#### Transfer Admin Rights (Account A - Owner)
- [ ] Click on a member in Participants list
- [ ] Click "Make Admin" or similar option
- [ ] Verify member now shows "ADMIN" badge
- [ ] Verify member can now access admin features
- [ ] Verify you can remove admin rights

### 2.8 Pinned Messages

#### Pin Message (Any Member)
- [ ] Right-click on a message in group
- [ ] Click "Pin" from context menu
- [ ] Verify pin indicator appears on message
- [ ] Verify toast confirms pin action
- [ ] Open Group Settings → Pinned tab
- [ ] Verify pinned message appears in list
- [ ] Click on pinned message in list
- [ ] Verify it scrolls to and highlights the message

#### Unpin Message
- [ ] Right-click on pinned message
- [ ] Click "Unpin" from context menu
- [ ] Verify pin indicator disappears
- [ ] Verify message disappears from Pinned tab

#### Pin Another Message (Should Unpin Previous)
- [ ] Pin a different message
- [ ] Verify previous pinned message is automatically unpinned
- [ ] Verify only new message shows pin indicator

---

## Part 3: Error Scenarios & Edge Cases

### 3.1 Permission Errors
- [ ] Try to delete message sent by another user (should fail gracefully)
- [ ] Try to edit message sent by another user (should not be possible)
- [ ] Try to approve pending member as non-admin (should fail)
- [ ] Try to change theme as non-admin (should not be visible/possible)

### 3.2 Network Errors
- [ ] Disconnect internet mid-sync
- [ ] Verify app doesn't crash
- [ ] Verify error messages are user-friendly
- [ ] Reconnect and verify sync resumes

### 3.3 Invalid Data
- [ ] Try to join group with invalid/inactive invite link
- [ ] Verify clear error message appears
- [ ] Try to create group with no members
- [ ] Verify validation prevents this

### 3.4 Concurrent Operations
- [ ] Have two admins approve same pending member simultaneously
- [ ] Verify no duplicate members or errors
- [ ] Have two users pin different messages simultaneously
- [ ] Verify only one message is pinned (last write wins)

---

## Part 4: Console & Performance Checks

### 4.1 Console Errors
- [ ] Open browser DevTools Console
- [ ] Go through all test scenarios above
- [ ] Note any red errors or warnings
- [ ] Verify no "Missing or insufficient permissions" errors (except expected ones)
- [ ] Verify no "Failed to sync" errors (except during actual offline periods)
- [ ] Document any errors found: _______________

### 4.2 Performance
- [ ] Test with 50+ messages in a conversation
- [ ] Verify scrolling is smooth
- [ ] Verify no lag when sending messages
- [ ] Test with 20+ conversations in list
- [ ] Verify conversation list loads quickly
- [ ] Verify search/filter works smoothly

---

## Test Results Summary

**Date Completed:** _______________

### Critical Issues Found
1. _______________
2. _______________
3. _______________

### Minor Issues Found
1. _______________
2. _______________
3. _______________

### Features Working Well
1. _______________
2. _______________
3. _______________

### Notes & Observations
_______________
_______________
_______________

---

## Next Steps After Testing

- [ ] Fix critical issues found
- [ ] Address minor issues
- [ ] Update IMPLEMENTATION_STATUS.md with test results
- [ ] Document any new edge cases discovered
- [ ] Plan next feature work based on test findings
