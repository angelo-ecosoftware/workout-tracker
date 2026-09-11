import { useEffect } from 'react';
import { CanonicalRoute, getCollectionForRoute } from '../appRouting.ts';
import { readCollectionScroll, saveCollectionScroll } from '../utils/routeContinuity.ts';

export function useRouteContinuity(userId: string | undefined, route: CanonicalRoute): void {
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    const collection = getCollectionForRoute(route);
    if (collection !== 'workouts' && collection !== 'routines' && collection !== 'logbook') return;

    const context = 'default';
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const save = () => saveCollectionScroll(userId, collection, context, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });

    const saved = readCollectionScroll(userId, collection, context);
    let frame = window.requestAnimationFrame(() => {
      if (saved !== null) window.scrollTo({ top: saved, behavior: 'auto' });
    });

    return () => {
      save();
      window.removeEventListener('scroll', save);
      window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previousRestoration;
    };
  }, [userId, route]);
}
