import { supabase } from './supabase.ts';
import { compressWorkoutImage } from '../utils/imageCompressor.ts';

export const PRIMARY_STORAGE_BUCKET = 'workout-media';
export const LEGACY_STORAGE_BUCKET = 'media';

/**
 * Uploads a file to Supabase Storage 'workout-media' bucket with client-side muscle definition compression
 * and organized year/month date partitioning.
 * Bucket endpoint: https://khvnlmzhymocnvdnptci.storage.supabase.co/storage/v1/s3
 * Public URL format: https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/workout-media/...
 */
export async function uploadWorkoutPhoto(
  userId: string,
  file: File,
  options?: { customBucket?: string; subFolder?: string }
): Promise<string> {
  const targetBucket = options?.customBucket || PRIMARY_STORAGE_BUCKET;
  
  // 1. Client-side muscle-definition preserving WebP compression (< 350KB target)
  const processedFile = await compressWorkoutImage(file);

  const fileExt = processedFile.name.split('.').pop() || 'webp';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  
  // 2. Structured, partitioned path: {userId}/workouts/{YYYY-MM}/{timestamp}_{random}.webp
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const subPath = options?.subFolder || `workouts/${yearMonth}`;
  const filePath = `${userId}/${subPath}/${timestamp}_${randomStr}.${cleanExt}`;

  // 3. Upload using Supabase JS client with standard multipart / raw binary upload
  let { data, error } = await supabase.storage
    .from(targetBucket)
    .upload(filePath, processedFile, {
      cacheControl: '31536000', // 1 year cache header
      contentType: processedFile.type || 'image/webp',
      upsert: false,
    });

  // Graceful fallback to legacy bucket if new bucket is not provisioned on remote server yet
  let activeBucket = targetBucket;
  if (error && targetBucket !== LEGACY_STORAGE_BUCKET) {
    console.warn(`Upload to '${targetBucket}' returned error (${error.message}). Retrying in legacy '${LEGACY_STORAGE_BUCKET}' bucket...`);
    const legacyPath = `${userId}/${timestamp}_${randomStr}.${cleanExt}`;
    const retryResult = await supabase.storage
      .from(LEGACY_STORAGE_BUCKET)
      .upload(legacyPath, processedFile, {
        cacheControl: '31536000',
        contentType: processedFile.type || 'image/webp',
        upsert: false,
      });

    if (retryResult.error) {
      console.error('Supabase storage fallback upload error:', retryResult.error);
      throw new Error(`Photo upload failed: ${retryResult.error.message}`);
    }
    data = retryResult.data;
    activeBucket = LEGACY_STORAGE_BUCKET;
    error = null;
  } else if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Photo upload failed: no upload data returned');
  }

  // Retrieve public URL
  const { data: urlData } = supabase.storage
    .from(activeBucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Extracts storage relative file path and bucket name from a Supabase public URL.
 * Example URLs:
 * - https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/workout-media/userId/workouts/2026-09/12345_abc.webp
 * - https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/media/userId/12345_abc.webp
 */
export function extractStorageInfoFromUrl(url: string): { bucket: string; path: string } | null {
  if (!url) return null;

  const supportedBuckets = [PRIMARY_STORAGE_BUCKET, 'workout-logs', LEGACY_STORAGE_BUCKET];

  for (const b of supportedBuckets) {
    const marker = `/storage/v1/object/public/${b}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(url.substring(idx + marker.length).split('?')[0]);
      return { bucket: b, path };
    }
  }

  // Fallback URL parser
  try {
    const parsed = new URL(url);
    for (const b of supportedBuckets) {
      const marker = `/${b}/`;
      const idx = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        const path = decodeURIComponent(parsed.pathname.substring(idx + marker.length).split('?')[0]);
        return { bucket: b, path };
      }
    }
  } catch {
    // If not a full URL, check if it's already a relative path
    if (url.includes('/')) return { bucket: PRIMARY_STORAGE_BUCKET, path: url };
  }

  return null;
}

/**
 * Extracts storage relative file path from a Supabase public URL.
 * Backward compatible alias for existing consumers.
 */
export function extractStoragePathFromUrl(url: string, bucketName?: string): string | null {
  const info = extractStorageInfoFromUrl(url);
  if (info) return info.path;
  if (url && url.includes('/')) return url;
  return null;
}

/**
 * Deletes a single workout photo from Supabase Storage by its public URL.
 */
export async function deleteWorkoutPhoto(url: string): Promise<void> {
  const info = extractStorageInfoFromUrl(url);
  if (!info) {
    console.warn('Could not extract file path from photo URL for deletion:', url);
    return;
  }

  const { error } = await supabase.storage.from(info.bucket).remove([info.path]);
  if (error) {
    console.warn('Supabase storage photo removal warning:', error.message);
  }
}

/**
 * Deletes multiple workout photos from Supabase Storage by their public URLs across buckets.
 */
export async function deleteWorkoutPhotos(urls: string[]): Promise<void> {
  if (!urls || !urls.length) return;

  const bucketGroupMap = new Map<string, string[]>();

  for (const url of urls) {
    const info = extractStorageInfoFromUrl(url);
    if (info) {
      const list = bucketGroupMap.get(info.bucket) || [];
      list.push(info.path);
      bucketGroupMap.set(info.bucket, list);
    }
  }

  for (const [bucket, paths] of bucketGroupMap.entries()) {
    if (paths.length > 0) {
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) {
        console.warn(`Supabase storage photos bulk removal warning on '${bucket}':`, error.message);
      }
    }
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

