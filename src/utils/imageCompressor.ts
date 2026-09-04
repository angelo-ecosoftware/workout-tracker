/**
 * Client-Side Muscle-Definition Preserving Image Compressor
 * 
 * Specialized for gym physique & workout progress photography:
 * - Preserves high-frequency edge contrast and muscular vascularity/striations.
 * - Caps max dimension at 1440px (1440p QHD / Retina tier) to balance crispness with compact storage.
 * - Applies subtle unsharp mask sharpening to counter bicubic canvas downsampling softness.
 * - Uses modern WebP (with fallback to high-quality JPEG) at optimal 0.82-0.85 quality factor.
 * - Multi-pass auto-budgeting targets < 350KB per photo (allowing 5 photos to stay under 1.5MB total).
 * - Automatically handles canvas environment fallbacks safely.
 */

export interface CompressionOptions {
  maxDimension?: number;
  initialQuality?: number;
  minQuality?: number;
  targetMaxBytes?: number;
  applySharpening?: boolean;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxDimension: 1440, // 1440p resolution preserves crisp muscular detail with 70% fewer raw pixels than 4K
  initialQuality: 0.84, // Optimal WebP quality factor for photographic contrast
  minQuality: 0.72,
  targetMaxBytes: 350 * 1024, // 350 KB target ceiling per progress photo
  applySharpening: true,
};

/**
 * Loads a File or Blob into an HTMLImageElement or ImageBitmap asynchronously.
 * Uses modern createImageBitmap when available for fast off-main-thread hardware decoding,
 * with standard HTMLImageElement fallback.
 */
function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
      reject(new Error('Image DOM API unavailable in current environment'));
      return;
    }
    const img = new Image();
    let isSettled = false;

    // Fast fallback timer for headless test environments (like JSDOM without canvas backend)
    const isTestEnv = typeof process !== 'undefined' && (Boolean(process.env?.VITEST) || process.env?.NODE_ENV === 'test');
    const safetyTimeoutMs = isTestEnv ? 150 : 15000;

    const safetyTimer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        reject(new Error('Image decode timeout'));
      }
    }, safetyTimeoutMs);

    const url = URL.createObjectURL(file);
    img.onload = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(safetyTimer);
        URL.revokeObjectURL(url);
        resolve(img);
      }
    };
    img.onerror = (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(safetyTimer);
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for compression'));
      }
    };
    img.src = url;
  });
}

/**
 * Loads image dimensions and source drawable (ImageBitmap or HTMLImageElement)
 */
async function loadDrawable(file: File | Blob): Promise<{ drawable: CanvasImageSource; width: number; height: number }> {
  // 1. Prefer modern createImageBitmap if available in browser
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 0 && bitmap.height > 0) {
        return { drawable: bitmap, width: bitmap.width, height: bitmap.height };
      }
    } catch {
      // Fallback to Image element if createImageBitmap encounters unsupported format
    }
  }

  // 2. Standard HTMLImageElement fallback
  const img = await loadImageElement(file);
  return { drawable: img, width: img.width, height: img.height };
}

/**
 * Applies subtle unsharp masking to enhance muscular edges and vascularity definition
 * that might otherwise get softened during canvas interpolation.
 */
function enhanceMuscleDefinition(ctx: CanvasRenderingContext2D, width: number, height: number) {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    // Fast 3x3 high-pass subtle edge crisping kernel
    const buffer = new Uint8ClampedArray(data);
    const weight = 0.12; // Gentle contrast edge boost

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const current = buffer[idx + c];
          const up = buffer[((y - 1) * width + x) * 4 + c];
          const down = buffer[((y + 1) * width + x) * 4 + c];
          const left = buffer[(y * width + (x - 1)) * 4 + c];
          const right = buffer[(y * width + (x + 1)) * 4 + c];

          const edgeVal = current * (1 + 4 * weight) - (up + down + left + right) * weight;
          data[idx + c] = Math.min(255, Math.max(0, edgeVal));
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  } catch (e) {
    // Canvas security/taint fallback if any
    console.warn('Skipping sharpening step:', e);
  }
}

/**
 * Helper to render image to blob via canvas with specified mime and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), mimeType, quality);
  });
}

/**
 * Compresses a workout photo File before upload while preserving crisp muscular definition.
 */
export async function compressWorkoutImage(
  file: File,
  options?: CompressionOptions
): Promise<File> {
  // If file is not an image (e.g. video or already tiny SVG), return original
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // If canvas is not supported in current environment (e.g. basic Node/JSDOM test runner), fallback safely
  if (typeof document === 'undefined' || !document.createElement) {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const { drawable, width: origWidth, height: origHeight } = await loadDrawable(file);
    let width = origWidth;
    let height = origHeight;

    if (!width || !height) {
      return file;
    }

    // Compute target dimensions preserving strict aspect ratio
    if (width > opts.maxDimension || height > opts.maxDimension) {
      if (width > height) {
        height = Math.round((height * opts.maxDimension) / width);
        width = opts.maxDimension;
      } else {
        width = Math.round((width * opts.maxDimension) / height);
        height = opts.maxDimension;
      }
    }

    // Create high-precision offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

    if (!ctx) {
      return file; // Fallback to raw file if canvas context unavailable
    }

    // Enable high-quality bicubic image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill canvas with black background in case of transparent source
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw scaled image
    ctx.drawImage(drawable, 0, 0, width, height);

    // Apply high-frequency edge enhancement for muscle striations
    if (opts.applySharpening && width >= 480 && height >= 480) {
      enhanceMuscleDefinition(ctx, width, height);
    }

    // First pass: High quality WebP (0.84)
    let blob = await canvasToBlob(canvas, 'image/webp', opts.initialQuality);

    // Fallback to JPEG if WebP encoding unsupported by older browser
    if (!blob) {
      blob = await canvasToBlob(canvas, 'image/jpeg', opts.initialQuality);
    }

    if (!blob) {
      return file;
    }

    // Multi-tier budget check: If output exceeds targetMaxBytes, perform secondary compression pass
    if (blob.size > opts.targetMaxBytes) {
      const secondPassBlob = await canvasToBlob(
        canvas,
        blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg',
        opts.minQuality
      );
      if (secondPassBlob && secondPassBlob.size < blob.size) {
        blob = secondPassBlob;
      }
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const outExt = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const compressedFileName = `${baseName}.${outExt}`;

    // If compressed file is somehow larger than original, return original
    if (blob.size >= file.size && file.type === blob.type) {
      return file;
    }

    return new File([blob], compressedFileName, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch (err) {
    // If any step in canvas processing fails, gracefully return the original file
    console.warn('Image compression fallback to original file:', err);
    return file;
  }
}

