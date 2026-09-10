export interface ContinuityEnvelope<T> {
  version: number;
  userId: string;
  resourceType: string;
  resourceId: string;
  updatedAt: string;
  payload: T;
}

const encodeKeyPart = (value: string) => encodeURIComponent(value);

export function getContinuityKey(userId: string | undefined, resourceType: string, resourceId: string): string | null {
  if (!userId || !resourceType || !resourceId) return null;
  return `continuity_${encodeKeyPart(userId)}_${encodeKeyPart(resourceType)}_${encodeKeyPart(resourceId)}`;
}

export function readContinuity<T>(
  userId: string | undefined,
  resourceType: string,
  resourceId: string,
  version: number,
): ContinuityEnvelope<T> | null {
  const key = getContinuityKey(userId, resourceType, resourceId);
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ContinuityEnvelope<T>>;
    if (
      parsed.version !== version ||
      parsed.userId !== userId ||
      parsed.resourceType !== resourceType ||
      parsed.resourceId !== resourceId ||
      typeof parsed.updatedAt !== 'string' ||
      !('payload' in parsed)
    ) {
      return null;
    }
    return parsed as ContinuityEnvelope<T>;
  } catch {
    return null;
  }
}

export function writeContinuity<T>(
  userId: string | undefined,
  resourceType: string,
  resourceId: string,
  version: number,
  payload: T,
): void {
  const key = getContinuityKey(userId, resourceType, resourceId);
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({
      version,
      userId,
      resourceType,
      resourceId,
      updatedAt: new Date().toISOString(),
      payload,
    } satisfies ContinuityEnvelope<T>));
  } catch {
    // Persistence is best-effort; the active in-memory workflow remains usable.
  }
}

export function clearContinuity(userId: string | undefined, resourceType: string, resourceId: string): void {
  const key = getContinuityKey(userId, resourceType, resourceId);
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}
