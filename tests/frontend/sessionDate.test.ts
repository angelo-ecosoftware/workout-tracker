import { describe, expect, it } from 'vitest';
import { hasCompletedSessionOnDate } from '../../src/utils/sessionDate.ts';

describe('same-day workout safety check', () => {
  it('detects a completed session on the selected local date', () => {
    expect(hasCompletedSessionOnDate([
      { status: 'completed', completedAt: new Date(2026, 8, 12, 9, 0) },
    ], '2026-09-12')).toBe(true);

    expect(hasCompletedSessionOnDate([
      { status: 'completed', completedAt: new Date(2026, 8, 11, 23, 59) },
    ], '2026-09-12')).toBe(false);
  });
});
