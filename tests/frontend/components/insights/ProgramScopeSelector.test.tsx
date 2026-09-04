import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ProgramScopeSelector } from '../../../../src/components/insights/ProgramScopeSelector.tsx';
import { SavedRoutineProgram } from '../../../../src/models.ts';

describe('ProgramScopeSelector Component', () => {
  const mockPrograms: SavedRoutineProgram[] = [
    {
      id: 'prog-ppl',
      userId: 'user-123',
      title: 'PPL Hypertrophy',
      isActive: true,
      programData: { workouts: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prog-ul',
      userId: 'user-123',
      title: 'Upper/Lower Strength',
      isActive: false,
      programData: { workouts: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders global option and individual program options', () => {
    render(
      <ProgramScopeSelector
        programs={mockPrograms}
        selectedProgramId="all"
        onSelectProgram={vi.fn()}
      />
    );

    expect(screen.getByText(/all programs \(global\)/i)).toBeInTheDocument();
    expect(screen.getByText('PPL Hypertrophy')).toBeInTheDocument();
    expect(screen.getByText('Upper/Lower Strength')).toBeInTheDocument();
  });

  it('calls onSelectProgram when a specific program is clicked', async () => {
    const user = userEvent.setup();
    const onSelectProgram = vi.fn();

    render(
      <ProgramScopeSelector
        programs={mockPrograms}
        selectedProgramId="all"
        onSelectProgram={onSelectProgram}
      />
    );

    await user.click(screen.getByText('Upper/Lower Strength'));

    expect(onSelectProgram).toHaveBeenCalledWith('prog-ul');
  });
});
