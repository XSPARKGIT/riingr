import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User 
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import type { Message } from "../types";

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing up:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please sign in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password authentication is not enabled. Please check Firebase settings.');
    }
    
    throw new Error(error.message || 'Failed to create account.');
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up first.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to sign in.');
        }
    };

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Send message to Firebase (for future cloud storage integration)
 */
export const sendMessageToCloud = async (
  convoId: string, 
  message: Partial<Message>
): Promise<void> => {
  // TODO: Implement Firebase Firestore integration for message storage
  console.info("Message saved to Firebase (to be implemented)");
};

// Export auth for direct use if needed
export { auth };
