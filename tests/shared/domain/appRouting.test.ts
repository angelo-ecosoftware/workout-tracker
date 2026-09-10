import { describe, expect, it } from 'vitest';
import {
  getAppRoute,
  getAppTab,
  getCanonicalPath,
  getPathForTab,
} from '../../../src/appRouting.ts';

describe('application path routing', () => {
  it('maps canonical paths to their application routes', () => {
    expect(getAppRoute('/dashboard')).toBe('tracker');
    expect(getAppRoute('/workouts')).toBe('tracker');
    expect(getAppRoute('/history')).toBe('history');
    expect(getAppRoute('/insights')).toBe('insights');
    expect(getAppRoute('/food')).toBe('dietary');
    expect(getAppRoute('/admin')).toBe('admin');
  });

  it('supports legacy hash bookmarks only at the site root', () => {
    expect(getAppRoute('/', '#/workouts')).toBe('tracker');
    expect(getAppRoute('/', '#history')).toBe('history');
    expect(getAppRoute('/', '#philosophy')).toBe('home');
    expect(getAppRoute('/history', '#philosophy')).toBe('history');
  });

  it('returns canonical paths for tab navigation and legacy migration', () => {
    expect(getPathForTab('tracker')).toBe('/workouts');
    expect(getPathForTab('history')).toBe('/history');
    expect(getAppTab('/insights')).toBe('insights');
    expect(getCanonicalPath('/', '#tracker')).toBe('/workouts');
    expect(getCanonicalPath('/', '#/admin')).toBe('/admin');
    expect(getCanonicalPath('/', '#philosophy')).toBeNull();
  });
});
