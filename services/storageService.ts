import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './firebaseConfig';
import { isOnline } from './connectionService';

/**
 * Upload image file to Firebase Storage
 * @param conversationId - Conversation ID
 * @param messageId - Message ID
 * @param imageFile - Image file (File object)
 * @param onProgress - Optional progress callback (0-100)
 * @returns Download URL
 */
export const uploadImage = async (
  conversationId: string,
  messageId: string,
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!isOnline()) {
    throw new Error('Cannot upload: offline');
  }

  // Get file extension
  const fileExtension = imageFile.name.split('.').pop() || 'jpg';
  const fileName = `image.${fileExtension}`;
  
  // Create storage reference: messages/{messageId}/image.{ext}
  const storageRef = ref(storage, `messages/${messageId}/${fileName}`);

  // Upload file with progress tracking
  const uploadTask = uploadBytesResumable(storageRef, imageFile);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        // Track upload progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error('Error uploading image:', error);
        reject(error);
      },
      async () => {
        // Upload completed, get download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Upload file to Firebase Storage
 * @param conversationId - Conversation ID
 * @param messageId - Message ID
 * @param file - File object
 * @param onProgress - Optional progress callback (0-100)
 * @returns Download URL
 */
export const uploadFile = async (
  conversationId: string,
  messageId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!isOnline()) {
    throw new Error('Cannot upload: offline');
  }

  // Sanitize file name (remove special characters)
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Create storage reference: messages/{messageId}/file/{fileName}
  const storageRef = ref(storage, `messages/${messageId}/file/${sanitizedFileName}`);

  // Upload file with progress tracking
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        // Track upload progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error('Error uploading file:', error);
        reject(error);
      },
      async () => {
        // Upload completed, get download URL
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Delete file from Firebase Storage
 * @param fileUrl - Download URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid file URL format');
    }

    // Decode the path (URL encoded)
    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);
    
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw - file deletion is not critical
  }
};

/**
 * Check if a URL is a base64 data URL
 */
export const isBase64DataUrl = (url: string | undefined): boolean => {
  return url !== undefined && url.startsWith('data:');
};

/**
 * Convert base64 data URL to File object
 */
export const dataUrlToFile = (dataUrl: string, fileName: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], fileName, { type: mime });
};
