import { supabase } from '../lib/supabase.ts';
import { Exercise } from '../models.ts';
import { logSessionCompletion } from '../lib/supabaseData.ts';
import { uploadWorkoutPhotos } from '../lib/storage.ts';

const DB_NAME = 'workout_tracker_offline_queue';
const DB_VERSION = 1;
const QUEUE_STORE = 'sync_queue';

export interface QueuedSession {
  id: string; // generated UUID or timestamp key
  userId: string;
  workoutId: string;
  setsData: any[];
  exercisesList: Exercise[];
  sessionCompletedAt?: string; // ISO string
  notes?: string;
  sessionStartedAt?: string; // ISO string
  photos?: Array<{
    name: string;
    type: string;
    lastModified: number;
    blob: Blob;
  }>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enqueue a completed workout session to IndexedDB for offline resilience.
 */
export async function enqueueOfflineSession(
  userId: string,
  workoutId: string,
  setsData: any[],
  exercisesList: Exercise[],
  sessionCompletedAt?: Date,
  notes?: string,
  photoFiles?: File[],
  sessionStartedAt?: Date
): Promise<string> {
  const db = await openQueueDB();
  const queueId = `queue_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const serializedPhotos = photoFiles && photoFiles.length > 0
    ? photoFiles.map((f) => ({
        name: f.name,
        type: f.type,
        lastModified: f.lastModified,
        blob: f,
      }))
    : undefined;

  const item: QueuedSession = {
    id: queueId,
    userId,
    workoutId,
    setsData,
    exercisesList,
    sessionCompletedAt: sessionCompletedAt ? sessionCompletedAt.toISOString() : new Date().toISOString(),
    notes: notes || undefined,
    sessionStartedAt: sessionStartedAt ? sessionStartedAt.toISOString() : undefined,
    photos: serializedPhotos,
    createdAt: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    store.put(item);
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent('offline_queue_updated'));
      resolve(queueId);
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Fetch all queued offline sessions.
 */
export async function getQueuedOfflineSessions(userId?: string): Promise<QueuedSession[]> {
  try {
    const db = await openQueueDB();
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);

    const records: QueuedSession[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (userId) {
      return records.filter((r) => r.userId === userId).sort((a, b) => a.createdAt - b.createdAt);
    }
    return records.sort((a, b) => a.createdAt - b.createdAt);
  } catch (err) {
    console.warn('Failed to retrieve queued offline sessions:', err);
    return [];
  }
}

/**
 * Remove a session from the queue once successfully synced.
 */
export async function removeQueuedOfflineSession(queueId: string): Promise<void> {
  try {
    const db = await openQueueDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    store.delete(queueId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('offline_queue_updated'));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete queued session:', err);
  }
}

let isSyncing = false;

/**
 * Process and flush the offline sync queue.
 * Returns number of successfully synced sessions.
 */
export async function processOfflineQueue(userId?: string): Promise<{ syncedCount: number; remainingCount: number }> {
  if (isSyncing) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const remaining = await getQueuedOfflineSessions(userId);
    return { syncedCount: 0, remainingCount: remaining.length };
  }

  isSyncing = true;
  let syncedCount = 0;

  try {
    const queuedItems = await getQueuedOfflineSessions(userId);
    if (!queuedItems.length) {
      return { syncedCount: 0, remainingCount: 0 };
    }

    for (const item of queuedItems) {
      try {
        let uploadedPhotoUrls: string[] = [];

        // Upload photos if any exist in the queued item
        if (item.photos && item.photos.length > 0) {
          const filesToUpload = item.photos.map(
            (p) => new File([p.blob], p.name, { type: p.type, lastModified: p.lastModified })
          );
          try {
            uploadedPhotoUrls = await uploadWorkoutPhotos(item.userId, filesToUpload);
          } catch (photoErr) {
            console.warn('Queued session photo upload warning (saving session without photos):', photoErr);
          }
        }

        // Send workout session to Supabase
        await logSessionCompletion(
          item.userId,
          item.workoutId,
          item.setsData,
          item.exercisesList,
          item.sessionCompletedAt ? new Date(item.sessionCompletedAt) : undefined,
          item.notes,
          uploadedPhotoUrls,
          item.sessionStartedAt ? new Date(item.sessionStartedAt) : undefined
        );

        // Session synced successfully -> remove from IndexedDB
        await removeQueuedOfflineSession(item.id);
        syncedCount++;
      } catch (sessionErr: any) {
        console.error(`Failed syncing queued session ${item.id}:`, sessionErr);
        // If offline or network failure, stop batch and try again on next online event
        if (!navigator.onLine || sessionErr?.message?.includes('Failed to fetch') || sessionErr?.message?.includes('NetworkError')) {
          break;
        }
      }
    }

    const remaining = await getQueuedOfflineSessions(userId);
    return { syncedCount, remainingCount: remaining.length };
  } finally {
    isSyncing = false;
  }
}
