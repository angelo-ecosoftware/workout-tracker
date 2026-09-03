import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseProgressionCard } from '../../../../src/components/workout/ExerciseProgressionCard.tsx';
import { ExerciseProgressionReport } from '../../../../src/lib/insightsEngine.ts';

describe('ExerciseProgressionCard Component', () => {
  it('renders empty fallback message when dataPoints is empty', () => {
    const emptyReport: ExerciseProgressionReport = {
      exerciseId: 'ex-bench',
      exerciseName: 'Barbell Bench Press',
      exerciseType: 'strength',
      isBodyweight: false,
      totalSetsLogged: 0,
      weightDeltaPercentage: 0,
      repsDeltaPercentage: 0,
      oneRmDeltaPercentage: 0,
      volumeDeltaPercentage: 0,
      allTimePrWeightKg: 0,
      allTimePr1RMKg: 0,
      allTimePrVolumeKg: 0,
      allTimePrTotalReps: 0,
      allTimePrHoldSeconds: 0,
      dataPoints: [],
    };

    render(<ExerciseProgressionCard report={emptyReport} />);
    expect(screen.getByText(/no recorded sets for barbell bench press yet/i)).toBeInTheDocument();
  });

  it('renders exercise title, sets count, and metric switcher for weighted movements', () => {
    const mockReport: ExerciseProgressionReport = {
      exerciseId: 'ex-squat',
      exerciseName: 'Barbell Back Squat',
      exerciseType: 'strength',
      isBodyweight: false,
      totalSetsLogged: 6,
      weightDeltaPercentage: 10,
      repsDeltaPercentage: 5,
      oneRmDeltaPercentage: 8,
      volumeDeltaPercentage: 12,
      allTimePrWeightKg: 140,
      allTimePr1RMKg: 160,
      allTimePrVolumeKg: 3500,
      allTimePrTotalReps: 16,
      allTimePrHoldSeconds: 0,
      dataPoints: [
        {
          sessionId: 's-1',
          sessionDate: '2026-08-01',
          formattedDate: 'Aug 1',
          maxWeightKg: 120,
          totalReps: 15,
          totalVolumeKg: 1800,
          estimated1RMKg: 140,
          maxHoldDurationSeconds: 0,
          setsCount: 2,
          sets: [
            { setNumber: 1, weight: 120, reps: 5 },
            { setNumber: 2, weight: 120, reps: 5 },
          ],
        },
        {
          sessionId: 's-2',
          sessionDate: '2026-08-15',
          formattedDate: 'Aug 15',
          maxWeightKg: 140,
          totalReps: 16,
          totalVolumeKg: 2240,
          estimated1RMKg: 160,
          maxHoldDurationSeconds: 0,
          setsCount: 2,
          sets: [
            { setNumber: 1, weight: 140, reps: 5 },
            { setNumber: 2, weight: 140, reps: 5 },
          ],
        },
      ],
    };

    render(<ExerciseProgressionCard report={mockReport} />);

    expect(screen.getByText(/barbell back squat/i)).toBeInTheDocument();
    expect(screen.getByText(/2 sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/6 sets logged/i)).toBeInTheDocument();

    const topWeightBtn = screen.getByRole('button', { name: /top weight/i });
    const oneRmBtn = screen.getByRole('button', { name: /est\. 1rm/i });
    const volumeBtn = screen.getByRole('button', { name: /volume/i });

    expect(topWeightBtn).toBeInTheDocument();
    expect(oneRmBtn).toBeInTheDocument();
    expect(volumeBtn).toBeInTheDocument();

    fireEvent.click(oneRmBtn);
    expect(oneRmBtn).toHaveClass('bg-[#C0FF00]');
  });

  it('renders Total Reps button for bodyweight exercises', () => {
    const bwReport: ExerciseProgressionReport = {
      exerciseId: 'ex-pullup',
      exerciseName: 'Pull-Up',
      exerciseType: 'strength',
      isBodyweight: true,
      totalSetsLogged: 4,
      weightDeltaPercentage: 0,
      repsDeltaPercentage: 20,
      oneRmDeltaPercentage: 0,
      volumeDeltaPercentage: 0,
      allTimePrWeightKg: 0,
      allTimePr1RMKg: 0,
      allTimePrVolumeKg: 0,
      allTimePrTotalReps: 15,
      allTimePrHoldSeconds: 0,
      dataPoints: [
        {
          sessionId: 's-bw-1',
          sessionDate: '2026-08-01',
          formattedDate: 'Aug 1',
          maxWeightKg: 0,
          totalReps: 25,
          totalVolumeKg: 0,
          estimated1RMKg: 0,
          maxHoldDurationSeconds: 0,
          setsCount: 2,
          sets: [
            { setNumber: 1, weight: 0, reps: 15 },
            { setNumber: 2, weight: 0, reps: 10 },
          ],
        },
      ],
    };

    render(<ExerciseProgressionCard report={bwReport} />);

    expect(screen.getByText(/pull-up/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /total reps/i })).toBeInTheDocument();
  });
});
