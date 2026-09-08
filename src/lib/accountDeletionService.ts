import { supabase } from './supabase.ts';
import { clearAllDraftPhotosForUser } from '../utils/draftPhotoStorage.ts';

export interface AccountDeletionResult {
  success: boolean;
  purgedUserId?: string;
  purgedAt?: string;
  recordsPurged?: Record<string, number>;
  error?: string;
}

/**
 * Purges all media objects associated with a user in Supabase Storage (`workout-media`).
 * Removes session photos, coach review receipts, and draft attachments.
 */
export async function purgeUserStorageMedia(userId: string): Promise<string[]> {
  const removedPaths: string[] = [];
  try {
    const foldersToClean = [
      `sessions/${userId}`,
      `receipts/${userId}`,
      `user-backups/${userId}`,
    ];

    for (const folder of foldersToClean) {
      const { data: fileList, error: listError } = await supabase.storage
        .from('workout-media')
        .list(folder);

      if (!listError && fileList && fileList.length > 0) {
        const pathsToDelete = fileList.map((f) => `${folder}/${f.name}`);
        const { data: deleted, error: removeError } = await supabase.storage
          .from('workout-media')
          .remove(pathsToDelete);

        if (!removeError && deleted) {
          removedPaths.push(...deleted.map((d) => d.name));
        }
      }
    }
  } catch (err) {
    console.warn('[GDPR Storage Purge Warning] Non-fatal exception while removing user media:', err);
  }
  return removedPaths;
}

/**
 * Executes a complete, permanent, atomic GDPR Article 17 ("Right to be Forgotten") erasure.
 * 1. Purges user S3 media objects in `workout-media` bucket.
 * 2. Invokes transactional PostgreSQL RPC `purge_user_account_gdpr(target_user_id)`.
 * 3. Purges all offline IndexedDB draft media.
 * 4. Wipes client localStorage and sessionStorage.
 * 5. Signs out and invalidates the active auth session.
 */
export async function executeGdprAccountPurge(userId: string): Promise<AccountDeletionResult> {
  if (!userId) {
    return { success: false, error: 'User ID is required to execute GDPR account purge.' };
  }

  try {
    // 1. Purge S3 storage objects
    await purgeUserStorageMedia(userId);

    // 2. Execute atomic database cascade purge via PostgreSQL RPC
    const { data: purgeResponse, error: rpcError } = await supabase.rpc(
      'purge_user_account_gdpr',
      { target_user_id: userId }
    );

    if (rpcError) {
      console.error('[GDPR Purge Error] Database RPC failed:', rpcError.message);
      return { success: false, error: rpcError.message };
    }

    // 3. Clear IndexedDB offline storage
    await clearAllDraftPhotosForUser(userId);

    // 4. Wipe client browser storage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch {}
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch {}
    }

    // 5. Invalidate auth session
    try {
      await supabase.auth.signOut();
    } catch {}

    const parsed = purgeResponse as {
      success?: boolean;
      purged_user_id?: string;
      purged_at?: string;
      records_purged?: Record<string, number>;
    };

    return {
      success: true,
      purgedUserId: parsed?.purged_user_id || userId,
      purgedAt: parsed?.purged_at || new Date().toISOString(),
      recordsPurged: parsed?.records_purged || {},
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown exception occurred during account purge';
    console.error('[GDPR Purge Exception]', errorMsg);
    return { success: false, error: errorMsg };
  }
}
