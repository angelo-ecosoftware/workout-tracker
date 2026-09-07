import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionEngine } from '../../../../src/engine.ts';
import { RoutineSplitSelector } from '../../../../src/components/workout/tracker/RoutineSplitSelector.tsx';
import { Workout, Exercise } from '../../../../src/models.ts';

const mockExercises: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
];

const mockWorkouts: (Workout & { exercises: Exercise[] })[] = [
  { id: 'w-1', userId: 'u-1', name: 'Day 1 - Upper Body A', order: 1, exerciseIds: ['ex-1'], exercises: mockExercises },
  { id: 'w-2', userId: 'u-1', name: 'Day 2 - Lower Body A + Abs', order: 2, exerciseIds: ['ex-1'], exercises: mockExercises },
  { id: 'w-3', userId: 'u-1', name: 'Day 3 - Upper Body B', order: 3, exerciseIds: ['ex-1'], exercises: mockExercises },
  { id: 'w-4', userId: 'u-1', name: 'Day 4 - Lower Body B + Abs', order: 4, exerciseIds: ['ex-1'], exercises: mockExercises },
];

describe('Routine Streak & 48h/96h Recovery Engine (SessionEngine.calculateRoutineStreak)', () => {
  const refDate = new Date('2026-09-07T12:00:00.000Z');

  it('1. Returns 0 streak when no sessions have been completed', () => {
    const status = SessionEngine.calculateRoutineStreak([], refDate);
    expect(status.streakCount).toBe(0);
    expect(status.isBroken).toBe(false);
    expect(status.recoveryState).toBe('none');
    expect(status.recoveryHoursRemaining).toBe(0);
  });

  it('2. Marks recoveryState as "recovering" within 48 hours of session completion', () => {
    // Session completed 12 hours ago
    const session12hAgo = {
      completedAt: new Date('2026-09-07T00:00:00.000Z'),
      status: 'completed',
    };

    const status = SessionEngine.calculateRoutineStreak([session12hAgo], refDate);
    expect(status.streakCount).toBe(1);
    expect(status.isBroken).toBe(false);
    expect(status.recoveryState).toBe('recovering');
    expect(status.recoveryHoursRemaining).toBe(36); // 48 - 12 = 36h
    expect(status.hoursUntilStreakBreak).toBe(84); // 96 - 12 = 84h
  });

  it('3. Supports athletes training 5, 6, or 7 days a week (~24h intervals) without streak breakage', () => {
    // 6 consecutive daily sessions spaced 24 hours apart
    const sessions = [
      { completedAt: new Date('2026-09-07T00:00:00.000Z'), status: 'completed' }, // 12h ago
      { completedAt: new Date('2026-09-06T00:00:00.000Z'), status: 'completed' }, // 36h ago
      { completedAt: new Date('2026-09-05T00:00:00.000Z'), status: 'completed' }, // 60h ago
      { completedAt: new Date('2026-09-04T00:00:00.000Z'), status: 'completed' }, // 84h ago
      { completedAt: new Date('2026-09-03T00:00:00.000Z'), status: 'completed' }, // 108h ago
      { completedAt: new Date('2026-09-02T00:00:00.000Z'), status: 'completed' }, // 132h ago
    ];

    const status = SessionEngine.calculateRoutineStreak(sessions, refDate);
    // All 6 sessions were completed within 24h of each other (<= 96h cutoff)
    expect(status.streakCount).toBe(6);
    expect(status.isBroken).toBe(false);
  });

  it('4. Supports athletes training every 48-72h (e.g. 3-4 days/week) with peak recovery', () => {
    // 3 sessions spaced 48 hours apart, last session was 52 hours ago
    const sessions = [
      { completedAt: new Date('2026-09-05T08:00:00.000Z'), status: 'completed' }, // 52h ago
      { completedAt: new Date('2026-09-03T08:00:00.000Z'), status: 'completed' }, // 100h ago (48h gap)
      { completedAt: new Date('2026-09-01T08:00:00.000Z'), status: 'completed' }, // 148h ago (48h gap)
    ];

    const status = SessionEngine.calculateRoutineStreak(sessions, refDate);
    expect(status.streakCount).toBe(3);
    expect(status.isBroken).toBe(false);
    expect(status.recoveryState).toBe('ready'); // 52h > 48h -> fully recovered
    expect(status.recoveryHoursRemaining).toBe(0);
  });

  it('5. Breaks streak officially when more than 96 hours elapse without a completed routine', () => {
    // Last session was 98 hours ago
    const oldSession = {
      completedAt: new Date('2026-09-03T10:00:00.000Z'),
      status: 'completed',
    };

    const status = SessionEngine.calculateRoutineStreak([oldSession], refDate);
    expect(status.streakCount).toBe(0);
    expect(status.isBroken).toBe(true);
    expect(status.recoveryState).toBe('broken');
    expect(status.hoursUntilStreakBreak).toBe(0);
  });
});

describe('RoutineSplitSelector - Fire Icon & Recovery Badge in Red Zone', () => {
  it('renders the fire icon with current streak count in top right', () => {
    const sessions = [
      { completedAt: new Date(Date.now() - 10 * 3600 * 1000), status: 'completed' }, // 10h ago
      { completedAt: new Date(Date.now() - 34 * 3600 * 1000), status: 'completed' }, // 34h ago
    ];

    render(
      <RoutineSplitSelector
        workouts={mockWorkouts}
        activeWorkout={mockWorkouts[0]}
        suggestedDay={3}
        lastSessionDay={2}
        sessions={sessions}
        onSelectWorkout={vi.fn()}
      />
    );

    // Small number with fire icon in the red zone
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/rest/i)).toBeInTheDocument();

    // Footer shows 48h recovery remaining
    expect(screen.getByText(/48h recovery/i)).toBeInTheDocument();
  });

  it('renders 0 with muted fire icon when streak is broken or non-existent', () => {
    render(
      <RoutineSplitSelector
        workouts={mockWorkouts}
        activeWorkout={mockWorkouts[0]}
        suggestedDay={1}
        lastSessionDay={null}
        sessions={[]}
        onSelectWorkout={vi.fn()}
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText(/48h recovery/i)).not.toBeInTheDocument();
  });
});
