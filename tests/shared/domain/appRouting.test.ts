import { describe, expect, it } from 'vitest';
import {
  migrateLegacyLocation,
  parseCanonicalPath,
  parseLocation,
  serializeRoute,
} from '../../../src/appRouting.ts';

describe('canonical application routes', () => {
  it.each([
    ['/workouts', { kind: 'collection', collection: 'workouts' }],
    ['/workout/w-1', { kind: 'workout', workoutId: 'w-1', mode: 'view' }],
    ['/workout/w-1/info', { kind: 'workout', workoutId: 'w-1', mode: 'info' }],
    ['/workout/w-1/edit', { kind: 'workout', workoutId: 'w-1', mode: 'edit' }],
    ['/workout/w-1/exercise/e-1/info', { kind: 'workoutExercise', workoutId: 'w-1', exerciseId: 'e-1' }],
    ['/routines', { kind: 'collection', collection: 'routines' }],
    ['/routine/r-1', { kind: 'routine', routineId: 'r-1', mode: 'view' }],
    ['/routine/r-1/editor', { kind: 'routine', routineId: 'r-1', mode: 'editor' }],
    ['/logbook', { kind: 'collection', collection: 'logbook' }],
    ['/logbook/s-1', { kind: 'logbook', logId: 's-1', mode: 'view' }],
    ['/logbook/s-1/edit', { kind: 'logbook', logId: 's-1', mode: 'edit' }],
  ])('parses %s', (path, expected) => {
    expect(parseCanonicalPath(path)).toEqual(expected);
  });

  it('rejects ambiguous and malformed resource paths', () => {
    expect(parseCanonicalPath('/workout')).toBeNull();
    expect(parseCanonicalPath('/workout/a/b/c')).toBeNull();
    expect(parseCanonicalPath('/workout/%2F')).toBeNull();
    expect(parseCanonicalPath('/logbook/%E0%A4%A')).toBeNull();
  });

  it('serializes canonical states without competing route forms', () => {
    expect(serializeRoute({ kind: 'workout', workoutId: 'w/1', mode: 'edit' })).toBe('/workout/w%2F1/edit');
    expect(serializeRoute({ kind: 'workoutExercise', workoutId: 'w-1', exerciseId: 'e-1' })).toBe(
      '/workout/w-1/exercise/e-1/info'
    );
    expect(serializeRoute({ kind: 'routine', routineId: 'r-1', mode: 'view' })).toBe('/routine/r-1');
    expect(serializeRoute({ kind: 'logbook', logId: 's-1', mode: 'edit' })).toBe('/logbook/s-1/edit');
  });

  it('maps legacy tabs and historical resource aliases deterministically', () => {
    expect(parseLocation('/', '#tracker')).toEqual({ kind: 'collection', collection: 'workouts' });
    expect(parseLocation('/', '#history')).toEqual({ kind: 'collection', collection: 'logbook' });
    expect(parseLocation('/workouts/history/s-1')).toEqual({ kind: 'logbook', logId: 's-1', mode: 'view' });
    expect(migrateLegacyLocation('/', '#logbook')).toBe('/logbook');
    expect(migrateLegacyLocation('/workout/history/s-1')).toBe('/logbook/s-1');
    expect(migrateLegacyLocation('/', '#share/opaque-token')).toBeNull();
  });
});
