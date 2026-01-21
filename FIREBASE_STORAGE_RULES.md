# Firebase Storage Security Rules

## Setup Instructions

1. Go to Firebase Console → Storage → Rules
2. Replace the default rules with the rules below
3. Click "Publish" to save

## Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Messages files
    match /messages/{messageId}/{allPaths=**} {
      // Allow read if user is authenticated
      allow read: if request.auth != null;
      
      // Allow write if user is authenticated
      allow write: if request.auth != null;
      
      // Allow delete if user is authenticated
      allow delete: if request.auth != null;
    }
  }
}
```

## Explanation

- **Read access**: Any authenticated user can read files (messages are shared between participants)
- **Write access**: Any authenticated user can upload files (users upload their own messages)
- **Delete access**: Any authenticated user can delete files (users can delete their own messages)

## More Restrictive Rules (Optional)

If you want to restrict access to only conversation participants, you would need to:
1. Store conversation participants in Firestore
2. Use Firestore rules to check membership
3. However, Storage rules cannot directly read Firestore, so this would require a Cloud Function or a different approach

For now, the simpler approach above is recommended for MVP.

## Testing

After publishing the rules:
1. Try uploading an image in the app
2. Verify it appears in Firebase Console → Storage
3. Try downloading the image URL
4. Verify it works for other users in the conversation
