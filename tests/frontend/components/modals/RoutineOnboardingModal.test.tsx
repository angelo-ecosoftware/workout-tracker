import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoutineOnboardingModal } from '../../../../src/components/modals/RoutineOnboardingModal.tsx';

describe('Interactive Skippable Routine & Logging Onboarding (RoutineOnboardingModal)', () => {
  it('1. Renders Step 1 with prominent skip walkthrough button', () => {
    const handleClose = vi.fn();
    render(
      <RoutineOnboardingModal
        isOpen={true}
        onClose={handleClose}
      />
    );

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. create a routine day/i)).toBeInTheDocument();
    expect(screen.getByText(/routine architecture/i)).toBeInTheDocument();

    const skipBtn = screen.getByRole('button', { name: /skip walkthrough/i });
    expect(skipBtn).toBeInTheDocument();

    fireEvent.click(skipBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('2. Steps through Step 1 -> Step 2 -> Step 3 -> Step 4 (Welcome to the App)', () => {
    const handleClose = vi.fn();
    const handleOpenEditor = vi.fn();

    render(
      <RoutineOnboardingModal
        isOpen={true}
        onClose={handleClose}
        onOpenRoutineEditor={handleOpenEditor}
      />
    );

    // Step 1: Create a Routine Day
    expect(screen.getByText(/1\. create a routine day/i)).toBeInTheDocument();
    const nextBtn1 = screen.getByRole('button', { name: /next: add an exercise/i });
    fireEvent.click(nextBtn1);

    // Step 2: Add 1 Exercise
    expect(screen.getByText(/2\. add 1 exercise to your day/i)).toBeInTheDocument();
    expect(screen.getByText(/barbell bench press/i)).toBeInTheDocument();
    const nextBtn2 = screen.getByRole('button', { name: /next: how to log sets/i });
    fireEvent.click(nextBtn2);

    // Step 3: Log Sets & Check Off
    expect(screen.getByText(/3\. log sets & check off/i)).toBeInTheDocument();
    expect(screen.getByText(/interactive practice row/i)).toBeInTheDocument();

    // Practice row interaction: Tap checkmark
    const checkBtn = screen.getByRole('button', { name: /check off practice set/i });
    expect(checkBtn).toBeInTheDocument();
    fireEvent.click(checkBtn);
    expect(screen.getByText(/set complete! background rest timer auto-started/i)).toBeInTheDocument();

    // Advance to Step 4
    const completeBtn = screen.getByRole('button', { name: /complete walkthrough/i });
    fireEvent.click(completeBtn);

    // Step 4: Welcome to the App!
    expect(screen.getByText(/welcome to the app!/i)).toBeInTheDocument();
    expect(screen.getByText(/walkthrough complete/i)).toBeInTheDocument();
    expect(screen.getByText(/1-tap set logging with background vibration timers/i)).toBeInTheDocument();

    const finishBtn = screen.getByRole('button', { name: /start lifting & track workouts/i });
    fireEvent.click(finishBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleOpenEditor).toHaveBeenCalledTimes(1);
  });

  it('3. Allows stepping backward using Back button', () => {
    render(
      <RoutineOnboardingModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /next: add an exercise/i }));
    expect(screen.getByText(/2\. add 1 exercise to your day/i)).toBeInTheDocument();

    // Click Back
    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);

    // Should be back on Step 1
    expect(screen.getByText(/1\. create a routine day/i)).toBeInTheDocument();
  });

  it('4. Returns null when isOpen is false', () => {
    const { container } = render(
      <RoutineOnboardingModal
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
