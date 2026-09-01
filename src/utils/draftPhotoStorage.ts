/**
 * IndexedDB helper for persisting in-progress workout photos (Blobs / Files)
 * across app closures, reloads, and backgrounding.
 */

const DB_NAME = 'workout_tracker_drafts';
const DB_VERSION = 1;
const PHOTO_STORE = 'draft_photos';

function openPhotoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredDraftPhoto {
  id: string; // `${userId}_${workoutId}_${index}`
  userId: string;
  workoutId: string;
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
  savedAt: number;
}

/**
 * Save draft photo files for a workout session to IndexedDB.
 */
export async function saveDraftPhotosToStorage(
  userId: string,
  workoutId: string,
  files: File[]
): Promise<void> {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);

    // Read all records in store to clear existing photos for this user & workout
    const existingRecords: StoredDraftPhoto[] = await new Promise((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });

    for (const r of existingRecords) {
      if (r.userId === userId && r.workoutId === workoutId) {
        store.delete(r.id);
      }
    }

    // Write new photos
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const record: StoredDraftPhoto = {
        id: `${userId}_${workoutId}_${i}`,
        userId,
        workoutId,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        blob: file,
        savedAt: Date.now(),
      };
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save draft photos to IndexedDB:', err);
  }
}

/**
 * Load draft photo files for a workout session from IndexedDB.
 */
export async function loadDraftPhotosFromStorage(
  userId: string,
  workoutId: string
): Promise<File[]> {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const store = tx.objectStore(PHOTO_STORE);

    const records: StoredDraftPhoto[] = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Filter by userId and workoutId, sort by id
    const matching = records
      .filter((r) => r.userId === userId && r.workoutId === workoutId)
      .sort((a, b) => a.id.localeCompare(b.id));

    // Convert back to File objects
    return matching.map(
      (r) =>
        new File([r.blob], r.name, {
          type: r.type,
          lastModified: r.lastModified,
        })
    );
  } catch (err) {
    console.warn('Failed to load draft photos from IndexedDB:', err);
    return [];
  }
}

/**
 * Clear draft photo files for a workout session from IndexedDB.
 */
export async function clearDraftPhotosFromStorage(
  userId: string,
  workoutId: string
): Promise<void> {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);

    const records: StoredDraftPhoto[] = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    const matching = records.filter(
      (r) => r.userId === userId && r.workoutId === workoutId
    );

    for (const r of matching) {
      store.delete(r.id);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear draft photos from IndexedDB:', err);
  }
}
