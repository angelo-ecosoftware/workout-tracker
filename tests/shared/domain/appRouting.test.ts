import { describe, expect, it } from 'vitest';
import {
  getAppRoute,
  getAppTab,
  getCanonicalPath,
  getPathForTab,
  getResourceRoute,
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

  it('recognizes durable workout and logbook resource routes without swallowing other paths', () => {
    expect(getResourceRoute('/workouts/wk_push')).toEqual({
      type: 'workout',
      resourceId: 'wk_push',
      isEdit: false,
    });
    expect(getResourceRoute('/workouts/wk_push/edit')).toEqual({
      type: 'workout',
      resourceId: 'wk_push',
      isEdit: true,
    });
    expect(getResourceRoute('/logbook/session-1')).toEqual({
      type: 'logbook',
      resourceId: 'session-1',
      isEdit: false,
    });
    expect(getAppRoute('/workouts/wk_push/edit')).toBe('tracker');
    expect(getAppRoute('/logbook/session-1/edit')).toBe('history');
    expect(getResourceRoute('/api/workouts/wk_push')).toBeNull();
  });
});
