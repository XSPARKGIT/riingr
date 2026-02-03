/**
 * Simple toast notification utility
 * Creates and displays toast messages to the user
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

const createToast = (
  message: string,
  options: ToastOptions = {}
): void => {
  const { type = 'info', duration = 3000 } = options;

  const toast = document.createElement('div');
  toast.className = `fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[9999] animate-in slide-in-from-top-2 duration-300`;

  // Set background color based on type
  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
  };

  toast.className += ` ${bgColors[type]} text-white`;

  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove toast after duration
  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

export const toast = {
  success: (message: string, duration?: number) =>
    createToast(message, { type: 'success', duration }),
  error: (message: string, duration?: number) =>
    createToast(message, { type: 'error', duration }),
  info: (message: string, duration?: number) =>
    createToast(message, { type: 'info', duration }),
  warning: (message: string, duration?: number) =>
    createToast(message, { type: 'warning', duration }),
};
