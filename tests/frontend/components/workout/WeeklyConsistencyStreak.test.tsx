import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  WeeklyConsistencyStreak,
  calculateWeeklyConsistency,
  formatLocalISODate,
} from '../../../../src/components/workout/history/WeeklyConsistencyStreak.tsx';

describe('P1.2: Weekly Consistency Streak & Activity Heatmap', () => {
  // Use a fixed reference date: Wednesday, September 9, 2026
  const refDate = new Date(2026, 8, 9, 12, 0, 0); // Month 8 is September in JS

  it('1. Returns 0 streak and unhighlighted days when no sessions exist', () => {
    const result = calculateWeeklyConsistency([], refDate);

    expect(result.streakWeeks).toBe(0);
    expect(result.workoutsThisWeek).toBe(0);
    expect(result.days).toHaveLength(7);
    expect(result.days.every((d) => !d.hasWorkout)).toBe(true);

    // Monday of this week is September 7
    expect(result.days[0].dayLabel).toBe('M');
    expect(result.days[0].dayNumber).toBe(7);
    expect(result.days[2].dayLabel).toBe('W');
    expect(result.days[2].isToday).toBe(true);
  });

  it('2. Calculates active multi-week streak across consecutive weeks', () => {
    // Current week: Sept 7 - Sept 13
    // Week -1: Aug 31 - Sept 6
    // Week -2: Aug 24 - Aug 30
    // Week -3: Aug 17 - Aug 23
    const sessions = [
      { completedAt: new Date(2026, 8, 8) }, // Tuesday this week (Sept 8)
      { completedAt: new Date(2026, 8, 2) }, // Last week (Sept 2)
      { completedAt: new Date(2026, 7, 26) }, // 2 weeks ago (Aug 26)
      { completedAt: new Date(2026, 7, 19) }, // 3 weeks ago (Aug 19)
    ];

    const result = calculateWeeklyConsistency(sessions, refDate);

    expect(result.streakWeeks).toBe(4);
    expect(result.workoutsThisWeek).toBe(1);
    expect(result.days[1].hasWorkout).toBe(true); // Tuesday Sept 8
    expect(result.days[0].hasWorkout).toBe(false); // Monday Sept 7
  });

  it('3. Preserves streak if current week has not had a workout yet (grace window)', () => {
    // Current week (Sept 7-13) has 0 workouts so far
    // But last week and week before had workouts
    const sessions = [
      { completedAt: new Date(2026, 8, 2) }, // Last week
      { completedAt: new Date(2026, 7, 26) }, // 2 weeks ago
    ];

    const result = calculateWeeklyConsistency(sessions, refDate);

    // Streak is maintained at 2 weeks
    expect(result.streakWeeks).toBe(2);
    expect(result.workoutsThisWeek).toBe(0);
  });

  it('4. Resets streak when a calendar week was skipped', () => {
    // Current week has a workout, but 2 weeks ago had a workout with week -1 skipped
    const sessions = [
      { completedAt: new Date(2026, 8, 8) }, // This week
      // Missing week of Aug 31 - Sept 6
      { completedAt: new Date(2026, 7, 26) }, // 2 weeks ago
    ];

    const result = calculateWeeklyConsistency(sessions, refDate);

    expect(result.streakWeeks).toBe(1);
    expect(result.workoutsThisWeek).toBe(1);
  });

  it('5. Renders 7-day pill strip, streak counter, and on-fire badge in UI', () => {
    const sessions = [
      { completedAt: new Date(2026, 8, 7) }, // Mon Sept 7
      { completedAt: new Date(2026, 8, 9) }, // Wed Sept 9
      { completedAt: new Date(2026, 8, 2) }, // Last week
      { completedAt: new Date(2026, 7, 26) }, // 2 wks ago
      { completedAt: new Date(2026, 7, 19) }, // 3 wks ago
    ];

    render(
      <WeeklyConsistencyStreak
        sessions={sessions}
        referenceDate={refDate}
      />
    );

    // Streak badge
    expect(screen.getByText(/4-week/i)).toBeInTheDocument();
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
    expect(screen.getByText(/on fire/i)).toBeInTheDocument();
    expect(screen.getByText(/2 workouts logged this week/i)).toBeInTheDocument();

    // 7 Day Pill Bar
    const pills = screen.getAllByRole('listitem');
    expect(pills).toHaveLength(7);

    // Monday (Sept 7) has workout
    expect(pills[0]).toHaveAttribute('aria-label', expect.stringContaining('Completed'));
    // Wednesday (Sept 9) has workout
    expect(pills[2]).toHaveAttribute('aria-label', expect.stringContaining('Completed'));
    // Thursday (Sept 10) is a rest day
    expect(pills[3]).toHaveAttribute('aria-label', expect.stringContaining('Rest day'));
  });

  it('6. Renders encouraging callout when streak is zero', () => {
    render(
      <WeeklyConsistencyStreak
        sessions={[]}
        referenceDate={refDate}
      />
    );

    expect(screen.getByText(/start your streak/i)).toBeInTheDocument();
    expect(screen.getByText(/no workouts logged yet this week/i)).toBeInTheDocument();
  });
});
