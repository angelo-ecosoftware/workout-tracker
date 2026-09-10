import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isGoogleAuthUrl, sanitizeAuthenticatedSession } from '../../../src/utils/authUrl.ts';

describe('Google Auth URL Detection & Session Redirection', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('1. Detects Google accounts and signin URLs correctly', () => {
    expect(isGoogleAuthUrl('https://accounts.google.com/v3/signin')).toBe(true);
    expect(isGoogleAuthUrl('https://accounts.google.com')).toBe(true);
    expect(isGoogleAuthUrl('https://accounts.google.com/signin/oauth/v3/consent')).toBe(true);
    expect(isGoogleAuthUrl('https://accounts.google.com/o/oauth2/v2/auth?prompt=select_account')).toBe(true);
    expect(isGoogleAuthUrl('https://workout-tracker.vercel.app/#tracker')).toBe(false);
  });

  it('2. Sanitizes URL to /workouts and replaces history state for authenticated user', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    const mockLocation = new URL(
      'https://workout-tracker.vercel.app/?code=sample-oauth-code&state=oauth-state#access_token=token123'
    );
    Object.defineProperty(window, 'location', {
      writable: true,
      value: mockLocation,
    });

    sanitizeAuthenticatedSession('/workouts');

    expect(replaceStateSpy).toHaveBeenCalledWith(
      { appState: 'authenticated' },
      '',
      '/workouts'
    );
  });
});
