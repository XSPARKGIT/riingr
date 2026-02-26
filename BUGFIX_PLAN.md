## Riingr Bug & Feature Fix Plan

### Overview
This document tracks issues discovered while executing `TESTING_CHECKLIST.md`.  
We’ll use it as the single source of truth for debugging and implementation work.

---

## 1. Message Delivery & Read Receipts

**Problem:**  
- Only a single tick is shown even after messages are delivered/read.  
- Ticks don’t update in real time based on message state.

**Expected behavior:**  
- **1 gray tick**: message successfully sent to backend (saved).  
- **2 gray ticks**: message delivered to recipient (written and visible to recipient’s device).  
- **2 blue ticks**: recipient has opened the conversation and the message is marked as read.

**Checklist:**  
- [ ] Define clear `status` / `deliveredTo` / `readBy` semantics in types (`Message`).  
- [ ] Ensure backend updates `status` and/or `deliveredTo` when recipient syncs messages.  
- [ ] Ensure `readBy` is updated when a user opens a conversation.  
- [ ] Wire UI ticks to `status` / `deliveredTo` / `readBy` in `MessageBubble`.  
- [ ] Verify ticks update in real time (listener + optimistic updates).  

---

## 2. Messages Not Marking as Read Reliably

**Problem:**  
- When opening a conversation, messages are not always marked as read immediately.  
- After logging out and in again, some messages still appear as unread even though they were opened.

**Expected behavior:**  
- Opening a conversation should immediately mark all visible incoming messages as read for that user.  
- Read state should persist across reloads and sessions.

**Checklist:**  
- [ ] Confirm `onMarkMessagesAsRead` is called when a conversation is opened (and only once per open).  
- [ ] Ensure we update `readBy` locally (optimistic) and in Firestore.  
- [ ] Ensure sync service correctly merges `readBy` updates for each message.  
- [ ] Ensure unread counts and badges derive from `readBy` consistently.  
- [ ] Test re-login scenarios to ensure read state is preserved.

---

## 3. Poll Votes Not Persisting / Not Visible

**Problem:**  
- Poll creation works, but votes do not appear to be saving.  
- Vote counts and who voted are not visible or are stale.

**Expected behavior:**  
- When a user votes:  
  - The vote is saved (locally and in Firestore).  
  - UI updates immediately (optimistic).  
  - Poll results reflect current vote counts and the user’s own selection.

**Checklist:**  
- [ ] Review poll message schema (fields for options, vote counts, voter IDs).  
- [ ] Verify vote action writes to Firestore (correct doc/field + security rules).  
- [ ] Ensure sync service handles poll updates correctly (no overwriting votes).  
- [ ] Update UI to compute and display vote counts from message data.  
- [ ] Prevent double-voting or handle multiple votes per user as designed.  
- [ ] Test voting from two different accounts and devices.

---

## 4. Edit Message Option Missing

**Problem:**  
- Edit option does not appear in the message context menu.

**Expected behavior:**  
- For messages sent by the current user:  
  - Context menu should show **Edit**.  
  - Selecting Edit should open an edit UI (inline input or message input pre-filled).  
  - Editing should update the message content (optimistic + Firestore).

**Checklist:**  
- [ ] Ensure context menu (`MessageContextMenu`) receives `canEdit` / `isOwnMessage` correctly.  
- [ ] Add **Edit** entry to the menu when appropriate.  
- [ ] Implement edit flow: open editor, handle save/cancel.  
- [ ] Implement `editMessage` in sync/firestore services with permission check (only sender).  
- [ ] Update UI to show edited indicator if desired (e.g., “(edited)”).  
- [ ] Test editing in both DMs and groups.

---

## 5. Reactions Not Appearing on Sent Messages

**Problem:**  
- Reaction UI does not show reactions on messages that have been reacted to.  
- Possibly the reaction writes or reads are failing or not wired to the UI.

**Expected behavior:**  
- When a reaction is added:  
  - UI updates immediately to show the emoji + count.  
  - Firestore stores reaction data.  
  - Other participants see reactions update in real time.

**Checklist:**  
- [ ] Confirm reaction data shape on messages (e.g., `reactions: { [emoji]: string[] }`).  
- [ ] Verify add/remove reaction functions write to Firestore correctly.  
- [ ] Ensure listeners / sync service merge reaction updates.  
- [ ] Update `MessageBubble` to render reactions from message data.  
- [ ] Handle toggling a user’s reaction (add/remove).  
- [ ] Test reactions from multiple accounts and check for real-time updates.

---

## 6. Unable to Leave Group

**Problem:**  
- User cannot leave a group; leave action may be missing or failing.

**Expected behavior:**  
- Any non-owner member can leave a group:  
  - Conversation disappears from their list.  
  - They are removed from `participants` in Firestore.  
  - Group remains intact for other members.

**Checklist:**  
- [ ] Ensure “Leave group” UI is visible to non-owner members in `GroupSettingsView`.  
- [ ] Implement leave handler that removes current user from `participants`.  
- [ ] Verify Firestore security rules allow a user to remove themselves from `participants`.  
- [ ] Ensure local state and local storage are updated to remove the conversation.  
- [ ] Test leaving group from different roles (admin, regular member).  

---

## 7. Mute Behavior – Review & Verify

**Problem:**  
- Need to verify how muting works and if it behaves as expected for notifications.

**Expected behavior:**  
- Muted conversations should:  
  - Not trigger notifications (or follow defined mute rules).  
  - Show a clear mute indicator in the UI.  
  - Persist mute state across sessions/devices.

**Checklist:**  
- [ ] Review how mute state is stored (per user, per conversation).  
- [ ] Verify mute toggle UI in group/DM settings.  
- [ ] Ensure `notificationService` respects mute state and notification level.  
- [ ] Confirm mute status appears in conversation list (e.g., icon).  
- [ ] Test toggling mute on/off and verifying notification behavior.

---

## 8. Prioritization (Suggested Order)

1. **Message read & ticks** (Sections 1 & 2) – core UX and correctness.  
2. **Reactions & edit message** (Sections 4 & 5) – important interaction polish.  
3. **Poll votes persistence** (Section 3) – completes poll feature.  
4. **Leave group** (Section 6) – essential control for users.  
5. **Mute behavior audit** (Section 7) – notification correctness.

Use this file alongside `TESTING_CHECKLIST.md` to track progress and mark each item as we fix and verify behavior.

