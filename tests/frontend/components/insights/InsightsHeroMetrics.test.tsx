import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsightsHeroMetrics } from '../../../../src/components/insights/InsightsHeroMetrics.tsx';
import { InsightsMetrics } from '../../../../src/lib/insightsEngine.ts';

describe('InsightsHeroMetrics Component', () => {
  const mockMetrics: InsightsMetrics = {
    totalVolumeKg: 45000,
    totalVolume90DaysKg: 38250,
    volumeDeltaPercentage: 12.5,
    totalReps: 1250,
    totalTimedHoldSeconds: 600,
    totalWorkSeconds: 14400,
    totalRestSeconds: 7200,
    totalCompletedSessions: 24,
    sessionsLast90Days: 20,
    currentStreakWeeks: 4,
    longestStreakWeeks: 8,
    favoriteWorkoutName: 'Push Day A',
    heatmapDays: [],
    weeklyTonnage: [],
    restDiscipline: {
      totalRestSeconds: 7200,
      recordedRestIntervalsCount: 40,
      averageRestSeconds: 90,
      adherencePercentage: 85,
      onTimeCount: 34,
      underRestCount: 3,
      overRestCount: 3,
      workToRestRatio: 2.0,
    },
  };

  const defaultProps = {
    metrics: mockMetrics,
    activeInfoKey: null,
    onToggleInfoKey: vi.fn(),
    onCloseInfoKey: vi.fn(),
    formatKg: (kg: number) => `${kg.toLocaleString()} kg`,
    formatDuration: (sec: number) => `${Math.round(sec / 3600)}h`,
  };

  it('renders all 4 primary metric cards (90-Day Volume, Total Reps, Timed Tension, Active Effort)', () => {
    render(<InsightsHeroMetrics {...defaultProps} />);

    expect(screen.getAllByText('90-Day Volume')[0]).toBeInTheDocument();
    expect(screen.getByText('38,250 kg')).toBeInTheDocument();

    expect(screen.getAllByText('Total Reps')[0]).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();

    expect(screen.getAllByText('Timed Tension')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Active Effort')[0]).toBeInTheDocument();
  });

  it('handles userEvent click on info popover button to toggle metric explanation', async () => {
    const user = userEvent.setup();
    render(<InsightsHeroMetrics {...defaultProps} />);

    const volumeInfoBtn = screen.getByRole('button', { name: /information about 90-day volume/i });
    expect(volumeInfoBtn).toBeInTheDocument();

    await user.click(volumeInfoBtn);
    expect(defaultProps.onToggleInfoKey).toHaveBeenCalledWith('volume');
  });

  it('renders zeroed state gracefully with no NaN or crash when user has 0 workouts', () => {
    const zeroMetrics: InsightsMetrics = {
      totalVolumeKg: 0,
      totalVolume90DaysKg: 0,
      volumeDeltaPercentage: 0,
      totalReps: 0,
      totalTimedHoldSeconds: 0,
      totalWorkSeconds: 0,
      totalRestSeconds: 0,
      totalCompletedSessions: 0,
      sessionsLast90Days: 0,
      currentStreakWeeks: 0,
      longestStreakWeeks: 0,
      favoriteWorkoutName: 'None',
      heatmapDays: [],
      weeklyTonnage: [],
      restDiscipline: {
        totalRestSeconds: 0,
        recordedRestIntervalsCount: 0,
        averageRestSeconds: 0,
        adherencePercentage: 0,
        onTimeCount: 0,
        underRestCount: 0,
        overRestCount: 0,
        workToRestRatio: 0,
      },
    };

    render(<InsightsHeroMetrics {...defaultProps} metrics={zeroMetrics} />);

    expect(screen.getByText('0 kg')).toBeInTheDocument();
    expect(screen.getByText('Across 0 workouts')).toBeInTheDocument();
    expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
  });
});
