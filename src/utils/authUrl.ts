import { getAppRoute } from '../appRouting.ts';

/**
 * Authentication & OAuth Navigation Sanitizer
 * 
 * Intercepts back-navigation to Google sign-in/account chooser URLs and stale OAuth parameters,
 * ensuring logged-in users are immediately redirected back into the active Kinisia view.
 */

/**
 * Checks if the current window or document referrer points to a Google Account/OAuth sign-in URL.
 */
export function isGoogleAuthUrl(urlStr?: string): boolean {
  if (!urlStr && typeof window !== 'undefined') {
    urlStr = window.location.href;
  }
  if (!urlStr) return false;

  const lower = urlStr.toLowerCase();
  return (
    lower.includes('accounts.google.com') ||
    lower.includes('accounts.google.com/v3/signin') ||
    lower.includes('accounts.google.com/signin') ||
    lower.includes('accounts.google.com/o/oauth2') ||
    lower.includes('prompt=select_account')
  );
}

export function getAuthenticatedRoutePath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const path = window.location.pathname;
  if (path && path !== '/' && getAppRoute(path, window.location.hash) !== 'home') return path;
  return undefined;
}

/**
 * Sanitizes window.history for authenticated users, cleaning OAuth tokens, PKCE codes,
 * and replacing history states to prevent backward navigation into Google sign-in pages.
 */
export function sanitizeAuthenticatedSession(targetPath = '/workouts'): void {
  if (typeof window === 'undefined' || !window.history) return;

  try {
    const url = new URL(window.location.href);

    // Strip OAuth query parameters that might linger from redirects
    const oauthParams = [
      'code',
      'state',
      'error',
      'error_code',
      'error_description',
      'prompt',
      'redirect_to',
      'redirect_uri',
      'response_type',
      'scope',
    ];

    for (const p of oauthParams) {
      url.searchParams.delete(p);
    }

    let cleanPath = targetPath || window.location.pathname || '/workouts';
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath.replace(/^#\/?/, '')}`;
    }
    if (
      cleanPath.includes('access_token') ||
      cleanPath.includes('refresh_token') ||
      cleanPath.includes('code=') ||
      cleanPath.includes('error=')
    ) {
      cleanPath = '/workouts';
    }

    const cleanQuery = url.searchParams.toString();
    const cleanSearch = cleanQuery ? `?${cleanQuery}` : '';
    const cleanUrl = `${cleanPath}${cleanSearch}`;

    window.history.replaceState({ appState: 'authenticated' }, '', cleanUrl);
  } catch (e) {
    console.warn('Failed to sanitize authenticated session URL:', e);
  }
}
