import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyVolumeChart, WeeklyTonnageItem } from '../../../../src/components/insights/WeeklyVolumeChart.tsx';

describe('WeeklyVolumeChart Component', () => {
  const mockWeeklyTonnage: WeeklyTonnageItem[] = [
    { weekLabel: '7w ago', volumeKg: 12000 },
    { weekLabel: '6w ago', volumeKg: 14500 },
    { weekLabel: '5w ago', volumeKg: 13200 },
    { weekLabel: '4w ago', volumeKg: 16000 },
    { weekLabel: '3w ago', volumeKg: 15500 },
    { weekLabel: '2w ago', volumeKg: 18000 },
    { weekLabel: '1w ago', volumeKg: 17500 },
    { weekLabel: 'This Wk', volumeKg: 19200 },
  ];

  it('renders chart title, subtitle description, and all 8 weekly bars', () => {
    render(<WeeklyVolumeChart weeklyTonnage={mockWeeklyTonnage} maxWeeklyVol={19200} />);

    expect(screen.getByText(/weekly volume trend \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByText(/cumulative weekly kilogram volume moved over the last 8 weeks/i)).toBeInTheDocument();

    expect(screen.getByText('This Wk')).toBeInTheDocument();
    expect(screen.getByText('7w ago')).toBeInTheDocument();
    expect(screen.getByText('19,200kg')).toBeInTheDocument();
    expect(screen.getByText('12,000kg')).toBeInTheDocument();
  });

  it('handles zero maximum weekly volume without throwing division by zero or NaN', () => {
    const zeroTonnage: WeeklyTonnageItem[] = [
      { weekLabel: '7w ago', volumeKg: 0 },
      { weekLabel: '6w ago', volumeKg: 0 },
      { weekLabel: '5w ago', volumeKg: 0 },
      { weekLabel: '4w ago', volumeKg: 0 },
      { weekLabel: '3w ago', volumeKg: 0 },
      { weekLabel: '2w ago', volumeKg: 0 },
      { weekLabel: '1w ago', volumeKg: 0 },
      { weekLabel: 'This Wk', volumeKg: 0 },
    ];

    render(<WeeklyVolumeChart weeklyTonnage={zeroTonnage} maxWeeklyVol={0} />);

    const zeroLabels = screen.getAllByText('0kg');
    expect(zeroLabels).toHaveLength(8);
    expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
  });
});
