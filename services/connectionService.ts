/**
 * Connection detection and monitoring service
 * Detects online/offline status and notifies listeners
 */

type ConnectionCallback = (isOnline: boolean) => void;

let connectionCallbacks: ConnectionCallback[] = [];
let currentStatus: boolean = navigator.onLine;

/**
 * Check if device is currently online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
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
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return true;
  } catch {
    return false;
  }
};
