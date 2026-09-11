import { useEffect } from 'react';
import { CanonicalRoute } from '../appRouting.ts';
import { readCollectionScroll, saveCollectionScroll } from '../utils/routeContinuity.ts';

export function useRouteContinuity(userId: string | undefined, route: CanonicalRoute): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    if (route.kind !== 'collection') return;
    const collection = route.collection;

    const context = 'default';
    const save = () => saveCollectionScroll(userId, collection, context, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('pagehide', save);

    const saved = readCollectionScroll(userId, collection, context);
    let cancelled = false;
    let frame: number | null = null;
    let attempts = 0;
    const restore = () => {
      if (cancelled || saved === null) return;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(saved, maxScroll);
      window.scrollTo({ top: target, behavior: 'auto' });
      attempts += 1;
      const reachedTarget = Math.abs(window.scrollY - target) <= 1;
      const contentSettled = maxScroll >= saved || attempts >= 120;
      if (reachedTarget && contentSettled) return;
      frame = window.requestAnimationFrame(restore);
    };
    frame = window.requestAnimationFrame(restore);

    return () => {
      save();
      window.removeEventListener('scroll', save);
      window.removeEventListener('pagehide', save);
      cancelled = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [userId, route]);
}
