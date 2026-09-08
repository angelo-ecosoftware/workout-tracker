import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseCard } from '../../../../src/components/workout/tracker/ExerciseCard.tsx';
import { Exercise } from '../../../../src/models.ts';

const mockExercise: Exercise = {
  id: 'ex-bench',
  name: 'Barbell Bench Press',
  type: 'strength',
  targetSets: 3,
  targetRepMin: 8,
  targetRepMax: 12,
};

describe('Skip / Didnt Do Exercise Feature (ExerciseCard)', () => {
  it('1. Renders slim minimal Skip button in active exercise header', () => {
    const handleToggleSkip = vi.fn();

    render(
      <ExerciseCard
        exercise={mockExercise}
        userProfile={null}
        inputs={{}}
        isExpanded={false}
        isSkipped={false}
        advice={{ action: 'keep', details: 'Keep weight' }}
        onToggleExpand={vi.fn()}
        onToggleSkip={handleToggleSkip}
        onUpdateInput={vi.fn()}
        onTextInput={vi.fn()}
      />
    );

    const skipBtn = screen.getByRole('button', { name: /skip barbell bench press/i });
    expect(skipBtn).toBeInTheDocument();
    expect(skipBtn).toHaveTextContent(/skip/i);

    // Clicking skip triggers onToggleSkip with exercise.id
    fireEvent.click(skipBtn);
    expect(handleToggleSkip).toHaveBeenCalledWith('ex-bench');
  });

  it('2. Renders dimmed skipped state with line-through title and Skipped (Undo) button', () => {
    const handleToggleSkip = vi.fn();

    render(
      <ExerciseCard
        exercise={mockExercise}
        userProfile={null}
        inputs={{}}
        isExpanded={true}
        isSkipped={true}
        advice={{ action: 'keep', details: 'Keep weight' }}
        onToggleExpand={vi.fn()}
        onToggleSkip={handleToggleSkip}
        onUpdateInput={vi.fn()}
        onTextInput={vi.fn()}
      />
    );

    // Title should be styled with line-through
    const title = screen.getByText(/barbell bench press/i);
    expect(title).toHaveClass('line-through');

    // Button shows Skipped (Undo)
    const undoBtn = screen.getByRole('button', { name: /restore barbell bench press/i });
    expect(undoBtn).toBeInTheDocument();
    expect(undoBtn).toHaveTextContent(/skipped \(undo\)/i);

    // Subtitle shows skipped notice
    expect(screen.getByText(/⊘ skipped for this session • no sets will be logged/i)).toBeInTheDocument();

    // Sets table is replaced by restore banner
    expect(screen.getByText(/exercise marked as skipped for this workout session/i)).toBeInTheDocument();
    const restoreBtn = screen.getByRole('button', { name: /restore exercise/i });
    expect(restoreBtn).toBeInTheDocument();

    fireEvent.click(restoreBtn);
    expect(handleToggleSkip).toHaveBeenCalledWith('ex-bench');
  });
});
