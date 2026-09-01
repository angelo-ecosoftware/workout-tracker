import { supabase } from './supabase.ts';
import { compressWorkoutImage } from '../utils/imageCompressor.ts';

/**
 * Uploads a file to Supabase Storage 'media' bucket with client-side muscle definition compression.
 * Bucket endpoint: https://khvnlmzhymocnvdnptci.storage.supabase.co/storage/v1/s3
 * Public URL format: https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/media/...
 */
export async function uploadWorkoutPhoto(
  userId: string,
  file: File
): Promise<string> {
  const bucketName = 'media';
  
  // Compress image to preserve maximum muscular definition and vascularity while minimizing storage overhead
  const processedFile = await compressWorkoutImage(file);

  const fileExt = processedFile.name.split('.').pop() || 'webp';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const filePath = `${userId}/${timestamp}_${randomStr}.${cleanExt}`;

  // Upload using Supabase JS client with standard multipart / raw binary upload
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, processedFile, {
      cacheControl: '31536000', // 1 year cache header
      contentType: processedFile.type || 'image/webp',
      upsert: false,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  // Retrieve public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Extracts storage relative file path from a Supabase public URL.
 * Example URL: https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/media/userId/12345_abc.webp
 * Returns: "userId/12345_abc.webp"
 */
export function extractStoragePathFromUrl(url: string, bucketName: string = 'media'): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + marker.length).split('?')[0]);
  }
  
  // Fallback for direct path or other formats
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split(`/${bucketName}/`);
    if (pathParts.length > 1) {
      return decodeURIComponent(pathParts.slice(1).join(`/${bucketName}/`).split('?')[0]);
    }
  } catch {
    // If not a full URL, check if it's already a relative path
    if (url.includes('/')) return url;
  }
  return null;
}

/**
 * Deletes a single workout photo from Supabase Storage by its public URL.
 */
export async function deleteWorkoutPhoto(url: string): Promise<void> {
  const bucketName = 'media';
  const filePath = extractStoragePathFromUrl(url, bucketName);
  if (!filePath) {
    console.warn('Could not extract file path from photo URL for deletion:', url);
    return;
  }

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);
  if (error) {
    console.warn('Supabase storage photo removal warning:', error.message);
  }
}

/**
 * Deletes multiple workout photos from Supabase Storage by their public URLs.
 */
export async function deleteWorkoutPhotos(urls: string[]): Promise<void> {
  if (!urls || !urls.length) return;
  const bucketName = 'media';
  const filePaths = urls
    .map((url) => extractStoragePathFromUrl(url, bucketName))
    .filter((path): path is string => !!path);

  if (!filePaths.length) return;

  const { error } = await supabase.storage.from(bucketName).remove(filePaths);
  if (error) {
    console.warn('Supabase storage photos bulk removal warning:', error.message);
  }
}

/**
 * Uploads multiple workout progress photos (up to 5)
 */
export async function uploadWorkoutPhotos(
  userId: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.slice(0, 5).map((file) => uploadWorkoutPhoto(userId, file));
  return Promise.all(uploadPromises);
}
