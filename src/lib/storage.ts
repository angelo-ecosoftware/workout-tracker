import { supabase } from './supabase.ts';

/**
 * Uploads a file to Supabase Storage 'media' bucket.
 * Bucket endpoint: https://khvnlmzhymocnvdnptci.storage.supabase.co/storage/v1/s3
 * Public URL format: https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/media/...
 */
export async function uploadWorkoutPhoto(
  userId: string,
  file: File
): Promise<string> {
  const bucketName = 'media';
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const filePath = `${userId}/${timestamp}_${randomStr}.${cleanExt}`;

  // Upload using Supabase JS client with standard multipart / raw binary upload
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
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
 * Uploads multiple workout progress photos (up to 5)
 */
export async function uploadWorkoutPhotos(
  userId: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.slice(0, 5).map((file) => uploadWorkoutPhoto(userId, file));
  return Promise.all(uploadPromises);
}
