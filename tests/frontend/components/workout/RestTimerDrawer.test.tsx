import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { RestTimerDrawer } from '../../../../src/components/workout/tracker/RestTimerDrawer.tsx';
import * as soundUtils from '../../../../src/utils/sound.ts';

describe('P1.3: Rest Timer Auto-Start & Vibration Buzz (RestTimerDrawer)', () => {
  beforeEach(() => {
    vi.spyOn(soundUtils, 'playOneSecondVibrateAlarm').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Renders active countdown timer with exercise name and set number', () => {
    render(
      <RestTimerDrawer
        isOpen={true}
        initialSeconds={90}
        exerciseName="Barbell Bench Press"
        setNumber={2}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/rest interval/i)).toBeInTheDocument();
    expect(screen.getByText(/barbell bench press/i)).toBeInTheDocument();
    expect(screen.getByText(/set 2/i)).toBeInTheDocument();
    expect(screen.getByText('90s')).toBeInTheDocument();
  });

  it('2. Counts down and fires playOneSecondVibrateAlarm when rest expires (0s)', () => {
    vi.useFakeTimers();
    render(
      <RestTimerDrawer
        isOpen={true}
        initialSeconds={5}
        exerciseName="Squat"
        setNumber={1}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('5s')).toBeInTheDocument();

    // Fast-forward 5.1 seconds
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    expect(soundUtils.playOneSecondVibrateAlarm).toHaveBeenCalled();
    expect(screen.getByText('0s')).toBeInTheDocument();
    expect(screen.getByText('GO!')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('3. Allows adding and subtracting 15s dynamically', () => {
    render(
      <RestTimerDrawer
        isOpen={true}
        initialSeconds={60}
        exerciseName="Overhead Press"
        setNumber={1}
        onClose={vi.fn()}
      />
    );

    const plusBtn = screen.getByRole('button', { name: /\+15s/i });
    fireEvent.click(plusBtn);

    expect(screen.getByText('75s')).toBeInTheDocument();

    const minusBtn = screen.getByRole('button', { name: /-15s/i });
    fireEvent.click(minusBtn);

    expect(screen.getByText('60s')).toBeInTheDocument();
  });

  it('4. Calls onClose when Next Set button or X button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <RestTimerDrawer
        isOpen={true}
        initialSeconds={60}
        onClose={handleClose}
      />
    );

    const nextSetBtn = screen.getByRole('button', { name: /next set/i });
    fireEvent.click(nextSetBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
