import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseSetRow } from '../../../../src/components/workout/tracker/ExerciseSetRow.tsx';
import { Exercise } from '../../../../src/models.ts';

const mockExercise: Exercise = {
  id: 'ex-bench',
  name: 'Bench Press',
  type: 'strength',
  targetSets: 3,
  targetRepMin: 8,
  targetRepMax: 12,
};

describe('ExerciseSetRow Checkmark State', () => {
  it('displays a disabled checkmark when unchecked and enables it when checked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    const { rerender } = render(
      <ExerciseSetRow
        exercise={mockExercise}
        setNum={1}
        inputKey="ex-bench-1"
        values={{ weight: '80', reps: '10', completed: false }}
        isCurrent={false}
        onUpdateInput={vi.fn()}
        onTextInput={vi.fn()}
        onToggleCompleted={onToggle}
      />
    );

    // When unchecked: checkbox has aria-checked="false" and disabled icon styling
    const checkButton = screen.getByRole('checkbox', { name: /mark set 1 complete/i });
    expect(checkButton).toBeInTheDocument();
    expect(checkButton).toHaveAttribute('aria-checked', 'false');
    expect(checkButton).toHaveClass('text-zinc-600');
    expect(checkButton).not.toHaveClass('bg-[#C0FF00]');

    // Click to toggle
    await user.click(checkButton);
    expect(onToggle).toHaveBeenCalledWith('ex-bench-1');

    // Re-render as completed (checked)
    rerender(
      <ExerciseSetRow
        exercise={mockExercise}
        setNum={1}
        inputKey="ex-bench-1"
        values={{ weight: '80', reps: '10', completed: true, completedAt: '14:30' }}
        isCurrent={false}
        onUpdateInput={vi.fn()}
        onTextInput={vi.fn()}
        onToggleCompleted={onToggle}
      />
    );

    const checkedButton = screen.getByRole('checkbox', { name: /mark set 1 incomplete/i });
    expect(checkedButton).toHaveAttribute('aria-checked', 'true');
    expect(checkedButton).toHaveClass('bg-[#C0FF00]');
    expect(checkedButton).toHaveClass('text-black');
  });
});
