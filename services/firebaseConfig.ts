import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
// Storage import commented out - Storage not enabled yet
// import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace these values with your Firebase project credentials from Firebase Console
// You can find them in: Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Debug: Check if environment variables are loaded (only in development)
if (import.meta.env.DEV) {
  const hasValidConfig = firebaseConfig.apiKey && 
                         firebaseConfig.apiKey !== "YOUR_API_KEY" &&
                         firebaseConfig.projectId && 
                         firebaseConfig.projectId !== "YOUR_PROJECT_ID";
  
  if (hasValidConfig) {
    console.log('✅ Firebase config loaded from environment variables');
    console.log(`📦 Project: ${firebaseConfig.projectId}`);
  } else {
    console.warn('⚠️  Firebase config appears to be using placeholder values.');
    console.warn('   Make sure your .env file has all VITE_FIREBASE_* variables set.');
    console.warn('   Restart the dev server after adding/updating .env file.');
  }
}

// Initialize Firebase
let app: any = undefined;
let initError: any = null;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error: any) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.warn('⚠️  App will run in offline-only mode without Firebase');
  initError = error;
  // Don't throw - allow app to run in offline mode
}

// Initialize Firebase Authentication (null if Firebase failed)
export const auth = app ? getAuth(app) : null;

// Initialize Firestore (null if Firebase failed)
export const db = app ? getFirestore(app) : null;

// Firebase Storage initialization disabled - using base64 only
// Uncomment when Storage is enabled:
// export const storage = getStorage(app);

// Enable offline persistence (caches data locally for offline access)
if (db && import.meta.env.DEV) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️  Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️  Firestore persistence not available in this browser');
    } else {
      console.error('❌ Firestore persistence error:', err);
    }
  });
}

export default app;
