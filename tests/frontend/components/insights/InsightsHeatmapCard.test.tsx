import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsightsHeatmapCard } from '../../../../src/components/insights/InsightsHeatmapCard.tsx';
import { HeatmapDay } from '../../../../src/lib/insightsEngine.ts';

describe('InsightsHeatmapCard Component', () => {
  const mockHeatmapDays: HeatmapDay[] = [
    {
      date: '2026-09-01',
      dayOfWeek: 2,
      isToday: false,
      sessionsCount: 1,
      totalVolumeKg: 6200,
      totalWorkSeconds: 2400,
      workoutNames: ['Push Day A'],
    },
    {
      date: '2026-09-02',
      dayOfWeek: 3,
      isToday: false,
      sessionsCount: 1,
      totalVolumeKg: 3100,
      totalWorkSeconds: 1800,
      workoutNames: ['Pull Day B'],
    },
    {
      date: '2026-09-03',
      dayOfWeek: 4,
      isToday: true,
      sessionsCount: 0,
      totalVolumeKg: 0,
      totalWorkSeconds: 0,
      workoutNames: [],
    },
  ];

  const defaultProps = {
    sessionsLast90Days: 24,
    heatmapDays: mockHeatmapDays,
    hoveredDay: null,
    onHoverDay: vi.fn(),
  };

  it('renders heatmap title, 90-day sessions count subtitle, and calendar weekday columns', () => {
    render(<InsightsHeatmapCard {...defaultProps} />);

    expect(screen.getByText(/90-day activity & consistency heatmap/i)).toBeInTheDocument();
    expect(screen.getByText(/24 sessions completed in the last 90 days/i)).toBeInTheDocument();

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('handles user hovering over active and rest heatmap cells', async () => {
    const user = userEvent.setup();
    render(<InsightsHeatmapCard {...defaultProps} />);

    // Cell 1: Sep 1 (Day of month = 1)
    const day1Cell = screen.getByText('1').closest('div');
    expect(day1Cell).toBeInTheDocument();

    if (day1Cell) {
      await user.hover(day1Cell);
      expect(defaultProps.onHoverDay).toHaveBeenCalledWith(mockHeatmapDays[0]);

      await user.unhover(day1Cell);
      expect(defaultProps.onHoverDay).toHaveBeenCalledWith(null);
    }
  });

  it('renders active sessions with distinct volume visual threshold styling', () => {
    const { container } = render(<InsightsHeatmapCard {...defaultProps} />);

    // High volume day (> 5000 kg) gets #C0FF00
    const activeDay1 = screen.getByText('1').closest('div');
    expect(activeDay1).toHaveClass('bg-[#C0FF00]');

    // Medium volume day (> 2000 kg) gets #a3db00
    const activeDay2 = screen.getByText('2').closest('div');
    expect(activeDay2).toHaveClass('bg-[#a3db00]');

    // Rest day gets dark tile
    const restDay3 = screen.getByText('3').closest('div');
    expect(restDay3).toHaveClass('bg-[#181818]');
  });
});
