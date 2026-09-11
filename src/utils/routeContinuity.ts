export function getCollectionScrollKey(
  userId: string | undefined,
  collection: 'workouts' | 'routines' | 'exercises' | 'logbook',
  context = 'default'
): string | null {
  return userId ? `route_scroll_${userId}_${collection}_${context}` : null;
}

export function saveCollectionScroll(
  userId: string | undefined,
  collection: 'workouts' | 'routines' | 'exercises' | 'logbook',
  context: string,
  scrollY: number
): void {
  const key = getCollectionScrollKey(userId, collection, context);
  if (!key || !Number.isFinite(scrollY)) return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ version: 1, scrollY: Math.max(0, scrollY) }));
  } catch {}
}

export function readCollectionScroll(
  userId: string | undefined,
  collection: 'workouts' | 'routines' | 'exercises' | 'logbook',
  context: string
): number | null {
  const key = getCollectionScrollKey(userId, collection, context);
  if (!key) return null;
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(key) || '');
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      'scrollY' in parsed &&
      parsed.version === 1 &&
      typeof parsed.scrollY === 'number'
    ) {
      return Math.max(0, parsed.scrollY);
    }
  } catch {}
  return null;
}

export function scheduleResourceScroll(
  selector: string,
  identity: string,
  isCurrent: () => boolean,
  scrollIntoView: (element: Element) => void = (element) =>
    element.scrollIntoView({ block: 'start', behavior: 'auto' })
): () => void {
  let cancelled = false;
  let frame: number | null = null;
  const attempt = () => {
    if (cancelled || !isCurrent()) return;
    const element = document.querySelector(selector);
    if (element) {
      scrollIntoView(element);
      return;
    }
    frame = window.requestAnimationFrame(attempt);
  };
  frame = window.requestAnimationFrame(attempt);
  return () => {
    cancelled = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    void identity;
  };
}
