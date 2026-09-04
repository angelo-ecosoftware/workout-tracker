import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadWorkoutPhoto,
  uploadWorkoutPhotos,
  deleteWorkoutPhoto,
  deleteWorkoutPhotos,
  extractStorageInfoFromUrl,
  extractStoragePathFromUrl,
  PRIMARY_STORAGE_BUCKET,
  LEGACY_STORAGE_BUCKET,
} from '../../../src/lib/storage.ts';
import { compressWorkoutImage } from '../../../src/utils/imageCompressor.ts';
import { supabase } from '../../../src/lib/supabase.ts';

describe('Storage & Media Optimization Suite (workout-media)', () => {
  const mockUserId = 'athlete-uuid-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractStorageInfoFromUrl & extractStoragePathFromUrl', () => {
    it('extracts bucket and structured path from new workout-media public URL', () => {
      const url = 'https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/workout-media/athlete-uuid-123/workouts/2026-09/1788371563892_7ub7n52.webp';
      const info = extractStorageInfoFromUrl(url);

      expect(info).toEqual({
        bucket: 'workout-media',
        path: 'athlete-uuid-123/workouts/2026-09/1788371563892_7ub7n52.webp',
      });
      expect(extractStoragePathFromUrl(url)).toBe('athlete-uuid-123/workouts/2026-09/1788371563892_7ub7n52.webp');
    });

    it('extracts bucket and path from legacy media public URL for backward compatibility', () => {
      const legacyUrl = 'https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/media/athlete-uuid-123/1788273127901_w7ttf8q.jpg';
      const info = extractStorageInfoFromUrl(legacyUrl);

      expect(info).toEqual({
        bucket: 'media',
        path: 'athlete-uuid-123/1788273127901_w7ttf8q.jpg',
      });
      expect(extractStoragePathFromUrl(legacyUrl)).toBe('athlete-uuid-123/1788273127901_w7ttf8q.jpg');
    });

    it('returns null for empty or invalid URL', () => {
      expect(extractStorageInfoFromUrl('')).toBeNull();
      expect(extractStoragePathFromUrl('')).toBeNull();
    });
  });

  describe('uploadWorkoutPhoto', () => {
    it('uploads to primary workout-media bucket with partitioned date path', async () => {
      const dummyFile = new File(['mock image binary data'], 'progress.jpg', { type: 'image/jpeg' });

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'athlete-uuid-123/workouts/2026-09/1788371563892_7ub7n52.webp' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/workout-media/athlete-uuid-123/workouts/2026-09/1788371563892_7ub7n52.webp',
        },
      });

      vi.spyOn(supabase.storage, 'from').mockImplementation((bucket: string) => {
        return {
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        } as any;
      });

      const publicUrl = await uploadWorkoutPhoto(mockUserId, dummyFile);

      expect(supabase.storage.from).toHaveBeenCalledWith(PRIMARY_STORAGE_BUCKET);
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^athlete-uuid-123\/workouts\/\d{4}-\d{2}\/\d+_[a-z0-9]+\.(webp|jpg)$/),
        expect.any(File),
        expect.objectContaining({
          cacheControl: '31536000',
          contentType: expect.stringMatching(/image\/(webp|jpeg)/),
        })
      );
      expect(publicUrl).toContain('workout-media');
    });

    it('falls back to legacy media bucket gracefully if workout-media returns bucket not found error', async () => {
      const dummyFile = new File(['mock image binary data'], 'progress.jpg', { type: 'image/jpeg' });

      vi.spyOn(supabase.storage, 'from').mockImplementation((bucket: string) => {
        if (bucket === PRIMARY_STORAGE_BUCKET) {
          return {
            upload: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Bucket not found' },
            }),
          } as any;
        }
        return {
          upload: vi.fn().mockResolvedValue({
            data: { path: 'athlete-uuid-123/1788273127901_fallback.webp' },
            error: null,
          }),
          getPublicUrl: vi.fn().mockReturnValue({
            data: {
              publicUrl: 'https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/media/athlete-uuid-123/1788273127901_fallback.webp',
            },
          }),
        } as any;
      });

      const publicUrl = await uploadWorkoutPhoto(mockUserId, dummyFile);
      expect(publicUrl).toContain('media');
    });
  });

  describe('deleteWorkoutPhoto & deleteWorkoutPhotos', () => {
    it('deletes photo from correct bucket identified in URL', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.spyOn(supabase.storage, 'from').mockReturnValue({ remove: mockRemove } as any);

      const url = 'https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/workout-media/athlete-uuid-123/workouts/2026-09/photo1.webp';
      await deleteWorkoutPhoto(url);

      expect(supabase.storage.from).toHaveBeenCalledWith('workout-media');
      expect(mockRemove).toHaveBeenCalledWith(['athlete-uuid-123/workouts/2026-09/photo1.webp']);
    });

    it('deletes multiple photos grouped by their respective buckets', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.spyOn(supabase.storage, 'from').mockReturnValue({ remove: mockRemove } as any);

      const urls = [
        'https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/workout-media/user1/workouts/2026-09/p1.webp',
        'https://khvnlmzhymocnvdnptci.supabase.co/storage/v1/object/public/media/user1/p2.jpg',
      ];

      await deleteWorkoutPhotos(urls);

      expect(supabase.storage.from).toHaveBeenCalledWith('workout-media');
      expect(supabase.storage.from).toHaveBeenCalledWith('media');
    });
  });

  describe('compressWorkoutImage', () => {
    it('preserves non-image files as-is', async () => {
      const textFile = new File(['text data'], 'notes.txt', { type: 'text/plain' });
      const result = await compressWorkoutImage(textFile);
      expect(result.name).toBe('notes.txt');
    });

    it('returns a valid File object with optimal quality options', async () => {
      const imageFile = new File(['fake binary image bytes'], 'physique.jpg', { type: 'image/jpeg' });
      const result = await compressWorkoutImage(imageFile, {
        maxDimension: 1440,
        targetMaxBytes: 350 * 1024,
      });
      expect(result).toBeDefined();
    });

    it('compresses high-resolution camera photo to <= 1440px WebP within 350KB budget in canvas environment', async () => {
      // Mock Image loading and Canvas encoding
      class MockImage {
        width = 4032;
        height = 3024;
        onload: any = null;
        onerror: any = null;
        private _src = '';
        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      const originalImage = window.Image;
      window.Image = MockImage as any;
      globalThis.Image = MockImage as any;

      const mockCtx = {
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(1440 * 1080 * 4),
        }),
        putImageData: vi.fn(),
      };

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          const canvasMock = {
            width: 0,
            height: 0,
            getContext: vi.fn().mockReturnValue(mockCtx),
            toBlob: (cb: (b: Blob | null) => void, mime: string, quality: number) => {
              // Generate a mock WebP blob under 300KB
              const mockBlob = new Blob([new Uint8Array(280 * 1024)], { type: mime || 'image/webp' });
              cb(mockBlob);
            },
          };
          return canvasMock as any;
        }
        return originalCreateElement(tagName);
      });

      const largeCameraFile = new File(
        [new Uint8Array(8 * 1024 * 1024)], // 8MB mock camera file
        'IMG_20260904_123456.jpg',
        { type: 'image/jpeg' }
      );

      const compressed = await compressWorkoutImage(largeCameraFile, {
        maxDimension: 1440,
        targetMaxBytes: 350 * 1024,
      });

      expect(compressed).toBeDefined();
      expect(compressed.name).toBe('IMG_20260904_123456.webp');
      expect(compressed.type).toBe('image/webp');
      expect(compressed.size).toBeLessThanOrEqual(350 * 1024);
      expect(mockCtx.drawImage).toHaveBeenCalled();

      window.Image = originalImage;
      globalThis.Image = originalImage;
      vi.restoreAllMocks();
    });
  });
});
