export type AppSection = 'workouts' | 'routines' | 'exercises' | 'logbook' | 'dietary' | 'coach' | 'admin';

export type CanonicalRoute =
  | { kind: 'collection'; collection: 'workouts' | 'routines' | 'exercises' | 'logbook' }
  | { kind: 'workout'; workoutId: string; mode: 'view' | 'info' | 'edit' }
  | { kind: 'workoutExercise'; workoutId: string; exerciseId: string; mode: 'info' | 'edit' }
  | { kind: 'routine'; routineId: string; mode: 'view' | 'editor' }
  | { kind: 'logbook'; logId: string; mode: 'view' | 'edit' }
  | { kind: 'section'; section: Exclude<AppSection, 'workouts' | 'routines' | 'exercises' | 'logbook'> }
  | { kind: 'onboarding' }
  | { kind: 'profile' }
  | { kind: 'home' | 'login' };

const LEGACY_HASH_SECTIONS: Record<string, CanonicalRoute> = {
  '#': { kind: 'home' },
  '#/': { kind: 'home' },
  '#tracker': { kind: 'collection', collection: 'workouts' },
  '#/tracker': { kind: 'collection', collection: 'workouts' },
  '#dashboard': { kind: 'collection', collection: 'workouts' },
  '#/dashboard': { kind: 'collection', collection: 'workouts' },
  '#workouts': { kind: 'collection', collection: 'workouts' },
  '#/workouts': { kind: 'collection', collection: 'workouts' },
  '#history': { kind: 'collection', collection: 'logbook' },
  '#/history': { kind: 'collection', collection: 'logbook' },
  '#logbook': { kind: 'collection', collection: 'logbook' },
  '#/logbook': { kind: 'collection', collection: 'logbook' },
  '#dietary': { kind: 'section', section: 'dietary' },
  '#/dietary': { kind: 'section', section: 'dietary' },
  '#food': { kind: 'section', section: 'dietary' },
  '#/food': { kind: 'section', section: 'dietary' },
  '#coach': { kind: 'section', section: 'coach' },
  '#/coach': { kind: 'section', section: 'coach' },
  '#roster': { kind: 'section', section: 'coach' },
  '#/roster': { kind: 'section', section: 'coach' },
  '#admin': { kind: 'section', section: 'admin' },
  '#/admin': { kind: 'section', section: 'admin' },
  '#login': { kind: 'login' },
  '#/login': { kind: 'login' },
};

function normalizePath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

function decodeSegment(segment: string): string | null {
  if (!segment || segment === '.' || segment === '..' || segment.includes('\\')) return null;
  try {
    const decoded = decodeURIComponent(segment);
    return decoded && !decoded.includes('/') && !decoded.includes('\\') ? decoded : null;
  } catch {
    return null;
  }
}

function parseResourceId(segment: string | undefined): string | null {
  return segment ? decodeSegment(segment) : null;
}

export function parseCanonicalPath(pathname: string): CanonicalRoute | null {
  const path = normalizePath(pathname);
  if (path === '/workouts') return { kind: 'collection', collection: 'workouts' };
  if (path === '/routines') return { kind: 'collection', collection: 'routines' };
  if (path === '/exercises') return { kind: 'collection', collection: 'exercises' };
  if (path === '/logbook') return { kind: 'collection', collection: 'logbook' };
  if (path === '/') return { kind: 'home' };
  if (path === '/login' || path === '/signin') return { kind: 'login' };
  if (path === '/dietary' || path === '/food') return { kind: 'section', section: 'dietary' };
  if (path === '/coach' || path === '/roster') return { kind: 'section', section: 'coach' };
  if (path === '/admin') return { kind: 'section', section: 'admin' };
  if (path === '/profile') return { kind: 'profile' };
  if (path === '/onboarding') return { kind: 'onboarding' };

  const segments = path.split('/').filter(Boolean);
  const id = parseResourceId(segments[1]);
  const childId = parseResourceId(segments[3]);
  if (
    segments[0] === 'workout' &&
    id &&
    segments[2] === 'exercise' &&
    childId &&
    (segments[4] === 'info' || segments[4] === 'edit') &&
    segments.length === 5
  ) {
    return { kind: 'workoutExercise', workoutId: id, exerciseId: childId, mode: segments[4] };
  }
  if (segments[0] === 'workout' && id && segments.length <= 3) {
    const mode = segments[2];
    if (!mode) return { kind: 'workout', workoutId: id, mode: 'view' };
    if (mode === 'info' || mode === 'edit') return { kind: 'workout', workoutId: id, mode };
  }
  if (segments[0] === 'routine' && id && segments.length <= 3) {
    const mode = segments[2];
    if (!mode) return { kind: 'routine', routineId: id, mode: 'view' };
    if (mode === 'editor') return { kind: 'routine', routineId: id, mode: 'editor' };
  }
  if (segments[0] === 'logbook' && id && segments.length <= 3) {
    const mode = segments[2];
    if (!mode) return { kind: 'logbook', logId: id, mode: 'view' };
    if (mode === 'edit') return { kind: 'logbook', logId: id, mode: 'edit' };
  }
  return null;
}

export function parseLocation(pathname: string, hash = ''): CanonicalRoute {
  const canonical = parseCanonicalPath(pathname);
  if (canonical && !(canonical.kind === 'home' && hash.trim())) return canonical;

  const normalizedPath = normalizePath(pathname);
  const segments = normalizedPath.split('/').filter(Boolean);
  const legacyResourceId = parseResourceId(segments[2]);
  if (
    (segments[0] === 'workout' || segments[0] === 'workouts') &&
    (segments[1] === 'history' || segments[1] === 'log')
  ) {
    return legacyResourceId
      ? { kind: 'logbook', logId: legacyResourceId, mode: 'view' }
      : { kind: 'collection', collection: 'logbook' };
  }
  if (normalizedPath === '/workout' || normalizedPath === '/dashboard' || normalizedPath === '/tracker') {
    return { kind: 'collection', collection: 'workouts' };
  }
  if (normalizedPath === '/history') return { kind: 'collection', collection: 'logbook' };
  if (normalizedPath === '/routine') return { kind: 'collection', collection: 'routines' };

  return LEGACY_HASH_SECTIONS[hash.trim().toLowerCase().split('?')[0]] || { kind: 'home' };
}

export function serializeRoute(route: CanonicalRoute): string {
  switch (route.kind) {
    case 'home':
      return '/';
    case 'login':
      return '/login';
    case 'section':
      return `/${route.section}`;
    case 'collection':
      return `/${route.collection}`;
    case 'workout':
      return `/workout/${encodeURIComponent(route.workoutId)}${route.mode === 'view' ? '' : `/${route.mode}`}`;
    case 'workoutExercise':
      return `/workout/${encodeURIComponent(route.workoutId)}/exercise/${encodeURIComponent(route.exerciseId)}/${route.mode}`;
    case 'routine':
      return `/routine/${encodeURIComponent(route.routineId)}${route.mode === 'view' ? '' : '/editor'}`;
    case 'logbook':
      return `/logbook/${encodeURIComponent(route.logId)}${route.mode === 'view' ? '' : '/edit'}`;
    case 'profile':
      return '/profile';
    case 'onboarding':
      return '/onboarding';
  }
}

export function migrateLegacyLocation(pathname: string, hash = ''): string | null {
  const path = normalizePath(pathname);
  const normalizedHash = hash.trim().toLowerCase().split('?')[0];
  if (path === '/' && normalizedHash && !LEGACY_HASH_SECTIONS[normalizedHash]) return null;
  const canonical = parseCanonicalPath(path);
  if (canonical && !hash.trim() && path === serializeRoute(canonical)) return null;
  const legacy = parseLocation(pathname, hash);
  const destination = serializeRoute(legacy);
  return destination === path && !hash ? null : destination;
}

export function isResourceRoute(route: CanonicalRoute): route is
  | Extract<CanonicalRoute, { kind: 'workout' }>
  | Extract<CanonicalRoute, { kind: 'workoutExercise' }>
  | Extract<CanonicalRoute, { kind: 'routine' }>
  | Extract<CanonicalRoute, { kind: 'logbook' }> {
  return route.kind === 'workout' || route.kind === 'routine' || route.kind === 'logbook';
}

export function getCollectionForRoute(route: CanonicalRoute): AppSection | null {
  if (route.kind === 'collection') return route.collection;
  if (route.kind === 'workout') return 'workouts';
  if (route.kind === 'workoutExercise') return 'workouts';
  if (route.kind === 'routine') return 'routines';
  if (route.kind === 'logbook') return 'logbook';
  return route.kind === 'section' ? route.section : null;
}
