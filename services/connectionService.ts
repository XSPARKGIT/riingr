/**
 * Connection detection and monitoring service
 * Detects online/offline status and notifies listeners
 */

// Firebase imports will be done dynamically to avoid circular dependencies

type ConnectionCallback = (isOnline: boolean) => void;

let connectionCallbacks: ConnectionCallback[] = [];
let currentStatus: boolean = navigator.onLine;

/**
 * Check if device is currently online
 * Uses navigator.onLine for quick check
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Check if device is online with Firebase connectivity test
 * More reliable than navigator.onLine alone
 */
export const isOnlineWithFirebase = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }
  return await isFirebaseConnected();
};

/**
 * Initialize connection listener
 * Returns unsubscribe function
 */
export const initConnectionListener = (
  callback: ConnectionCallback
): (() => void) => {
  connectionCallbacks.push(callback);
  
  // Call immediately with current status
  callback(currentStatus);

  // If this is the first listener, set up event handlers
  if (connectionCallbacks.length === 1) {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Return unsubscribe function
  return () => {
    connectionCallbacks = connectionCallbacks.filter(cb => cb !== callback);
    
    // Remove event listeners if no more callbacks
    if (connectionCallbacks.length === 0) {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  };
};

const handleOnline = () => {
  currentStatus = true;
  connectionCallbacks.forEach(callback => callback(true));
  console.log('🌐 Connection restored');
};

const handleOffline = () => {
  currentStatus = false;
  connectionCallbacks.forEach(callback => callback(false));
  console.log('📴 Connection lost');
};

/**
 * Wait for connection to be restored
 * Returns a promise that resolves when online
 */
export const waitForConnection = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const unsubscribe = initConnectionListener((isOnline) => {
      if (isOnline) {
        unsubscribe();
        resolve();
      }
    });
  });
};

/**
 * Test connection by pinging Firebase
 * More reliable than navigator.onLine alone
 */
export const testConnection = async (): Promise<boolean> => {
  // First check navigator.onLine
  if (!navigator.onLine) {
    return false;
  }

  // Then test actual connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if Firebase is actually connected (not just navigator.onLine)
 */
export const isFirebaseConnected = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebaseConfig');
    
    // Check if db is initialized
    if (!db) {
      return false;
    }
    
    // Use a lightweight check - try to read a non-existent doc
    // This will succeed if connected, fail if offline
    const testRef = doc(db, '_connection_test', 'ping');
    await getDoc(testRef);
    return true;
  } catch (error: any) {
    // Check if it's a network error vs permission error
    if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
      return false;
    }
    // Permission errors mean we're connected, just don't have access
    // Also handle case where db is null
    if (error?.message?.includes('null') || error?.message?.includes('undefined')) {
      return false;
    }
    return true;
  }
};
