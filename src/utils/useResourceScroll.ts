import { useEffect } from 'react';
import { readContinuity, writeContinuity } from './continuityState.ts';

export function useResourceScroll(
  userId: string | undefined,
  resourceType: string,
  resourceId: string | null | undefined,
  context = 'view',
): void {
  useEffect(() => {
    if (!userId || !resourceId || typeof window === 'undefined') return;
    const continuityId = `${resourceId}:${context}:scroll`;
    const saved = readContinuity<{ scrollY: number }>(userId, resourceType, continuityId, 1);
    const restore = () => {
      if (saved?.payload && Number.isFinite(saved.payload.scrollY)) {
        window.scrollTo({ top: saved.payload.scrollY, behavior: 'auto' });
      }
    };
    const frame = window.requestAnimationFrame?.(restore) ?? window.setTimeout(restore, 0);
    let pendingWrite: number | null = null;
    const handleScroll = () => {
      if (pendingWrite !== null) return;
      pendingWrite = window.setTimeout(() => {
        pendingWrite = null;
        writeContinuity(userId, resourceType, continuityId, 1, { scrollY: window.scrollY });
      }, 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (pendingWrite !== null) window.clearTimeout(pendingWrite);
      writeContinuity(userId, resourceType, continuityId, 1, { scrollY: window.scrollY });
      if (typeof frame === 'number') {
        if (window.cancelAnimationFrame) window.cancelAnimationFrame(frame);
        else window.clearTimeout(frame);
      }
    };
  }, [userId, resourceType, resourceId, context]);
}
