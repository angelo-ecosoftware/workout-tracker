export type AppRoute =
  | 'home'
  | 'login'
  | 'tracker'
  | 'history'
  | 'insights'
  | 'dietary'
  | 'coach'
  | 'admin';

export type AppTab = Exclude<AppRoute, 'home' | 'login'>;

export interface ResourceRoute {
  type: 'workout' | 'logbook';
  resourceId: string | null;
  isEdit: boolean;
}

const routeByPath: Record<string, AppRoute> = {
  '/': 'home',
  '/login': 'login',
  '/signin': 'login',
  '/dashboard': 'tracker',
  '/tracker': 'tracker',
  '/workouts': 'tracker',
  '/history': 'history',
  '/logbook': 'history',
  '/insights': 'insights',
  '/dietary': 'dietary',
  '/food': 'dietary',
  '/coach': 'coach',
  '/roster': 'coach',
  '/admin': 'admin',
};

const routeByLegacyHash: Record<string, AppRoute> = {
  '#': 'home',
  '#/': 'home',
  '#tracker': 'tracker',
  '#/tracker': 'tracker',
  '#dashboard': 'tracker',
  '#/dashboard': 'tracker',
  '#workouts': 'tracker',
  '#/workouts': 'tracker',
  '#history': 'history',
  '#/history': 'history',
  '#logbook': 'history',
  '#/logbook': 'history',
  '#insights': 'insights',
  '#/insights': 'insights',
  '#dietary': 'dietary',
  '#/dietary': 'dietary',
  '#food': 'dietary',
  '#/food': 'dietary',
  '#coach': 'coach',
  '#/coach': 'coach',
  '#roster': 'coach',
  '#/roster': 'coach',
  '#admin': 'admin',
  '#/admin': 'admin',
  '#login': 'login',
  '#/login': 'login',
};

function normalizePath(pathname: string): string {
  const path = pathname.trim().toLowerCase();
  if (!path || path === '/') return '/';
  const withoutTrailingSlash = path.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function normalizeHash(hash: string): string {
  return hash.trim().toLowerCase().split('?')[0];
}

function getResourcePath(pathname: string, base: string): { resourceId: string | null; isEdit: boolean } | null {
  const path = pathname.trim().replace(/\/+$/, '') || '/';
  const match = path.match(new RegExp(`^${base}(?:/([^/]+))?(?:/(edit))?$`, 'i'));
  if (!match) return null;
  let resourceId = match?.[1] || null;
  try {
    resourceId = resourceId ? decodeURIComponent(resourceId) : null;
  } catch {
    return null;
  }
  return {
    resourceId,
    isEdit: match?.[2] === 'edit',
  };
}

export function getResourceRoute(pathname: string): ResourceRoute | null {
  const workout = getResourcePath(pathname, '/workouts');
  if (workout) return { type: 'workout', ...workout };
  const logbook = getResourcePath(pathname, '/logbook');
  if (logbook) return { type: 'logbook', ...logbook };
  return null;
}

export function getAppRoute(pathname: string, hash = ''): AppRoute {
  // Existing bookmarks use hash routes at the site root. Only recognized
  // application routes are interpreted; in-page anchors remain untouched.
  const normalizedPath = normalizePath(pathname);
  if (normalizedPath === '/') {
    const legacyRoute = routeByLegacyHash[normalizeHash(hash)];
    if (legacyRoute) return legacyRoute;
  }

  if (getResourceRoute(normalizedPath)) {
    return normalizedPath.startsWith('/logbook') ? 'history' : 'tracker';
  }
  return routeByPath[normalizedPath] || 'home';
}

export function getAppTab(pathname: string, hash = ''): AppTab | null {
  const route = getAppRoute(pathname, hash);
  return route === 'home' || route === 'login' ? null : route;
}

export function getPathForTab(tab: AppTab): string {
  return tab === 'tracker' ? '/workouts' : `/${tab}`;
}

export function getCanonicalPath(pathname: string, hash = ''): string | null {
  const normalizedPath = normalizePath(pathname);
  if (normalizedPath !== '/' || !routeByLegacyHash[normalizeHash(hash)]) return null;

  const tab = getAppTab(pathname, hash);
  if (tab) return getPathForTab(tab);
  if (routeByLegacyHash[normalizeHash(hash)] === 'login') return '/login';
  return '/';
}
