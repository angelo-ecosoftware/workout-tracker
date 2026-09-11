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

/**
 * Sanitizes window.history for authenticated users, cleaning OAuth tokens, PKCE codes,
 * and replacing history states to prevent backward navigation into Google sign-in pages.
 */
export function sanitizeAuthenticatedSession(targetHash = '#tracker'): void {
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

    const isPathTarget = Boolean(targetHash && targetHash.startsWith('/'));
    let cleanHash = isPathTarget ? '' : (targetHash || window.location.hash || '#tracker');
    if (
      cleanHash.includes('access_token') ||
      cleanHash.includes('refresh_token') ||
      cleanHash.includes('code=') ||
      cleanHash.includes('error=')
    ) {
      cleanHash = '#tracker';
    }

    if (cleanHash && !cleanHash.startsWith('#')) {
      cleanHash = `#${cleanHash}`;
    }

    const cleanQuery = url.searchParams.toString();
    const cleanSearch = cleanQuery ? `?${cleanQuery}` : '';
    const cleanPath = isPathTarget ? targetHash : url.pathname;
    const cleanUrl = `${cleanPath}${cleanSearch}${cleanHash}`;

    window.history.replaceState({ appState: 'authenticated' }, '', cleanUrl);
  } catch (e) {
    console.warn('Failed to sanitize authenticated session URL:', e);
  }
}
