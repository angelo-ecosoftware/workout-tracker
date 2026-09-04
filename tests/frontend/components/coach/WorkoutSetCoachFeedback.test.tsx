import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkoutSetCoachFeedback } from '../../../../src/components/coach/WorkoutSetCoachFeedback.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';
import { WorkoutSetCoachFeedback as FeedbackModel } from '../../../../src/models.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  addWorkoutSetFeedback: vi.fn(),
}));

describe('WorkoutSetCoachFeedback Component', () => {
  const mockFeedback: FeedbackModel[] = [
    {
      id: 'fb-1',
      setId: 'set-1',
      sessionId: 'sess-1',
      coachId: 'coach-123',
      coachName: 'Coach Alex',
      athleteId: 'athlete-1',
      timestampMarker: '0:08',
      cueText: 'Knees caving slightly on ascent—drive knees outward',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders feedback list with coach name, timestamp marker, and cue text', () => {
    render(
      <WorkoutSetCoachFeedback
        setId="set-1"
        sessionId="sess-1"
        athleteId="athlete-1"
        feedbackList={mockFeedback}
      />
    );

    expect(screen.getByText(/coach alex:/i)).toBeInTheDocument();
    expect(screen.getByText('0:08')).toBeInTheDocument();
    expect(screen.getByText(/knees caving slightly on ascent/i)).toBeInTheDocument();
  });

  it('allows coach to add timestamped technique cue', async () => {
    const user = userEvent.setup();
    const onFeedbackAdded = vi.fn();
    vi.mocked(SupabaseData.addWorkoutSetFeedback).mockResolvedValue({
      id: 'fb-2',
      setId: 'set-1',
      sessionId: 'sess-1',
      coachId: 'coach-123',
      coachName: 'Coach Alex',
      athleteId: 'athlete-1',
      timestampMarker: '0:12',
      cueText: 'Keep elbows tucked at 45 degrees',
      createdAt: new Date(),
    });

    render(
      <WorkoutSetCoachFeedback
        setId="set-1"
        sessionId="sess-1"
        athleteId="athlete-1"
        coachId="coach-123"
        coachName="Coach Alex"
        isCoach={true}
        feedbackList={mockFeedback}
        onFeedbackAdded={onFeedbackAdded}
      />
    );

    const addCueBtn = screen.getByRole('button', { name: /add coach technique cue/i });
    await user.click(addCueBtn);

    const cueInput = screen.getByPlaceholderText(/drive knees outward/i);
    await user.type(cueInput, 'Keep elbows tucked at 45 degrees');

    const saveBtn = screen.getByRole('button', { name: /save feedback/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(SupabaseData.addWorkoutSetFeedback).toHaveBeenCalledWith(
        'set-1',
        'sess-1',
        'coach-123',
        'athlete-1',
        'Keep elbows tucked at 45 degrees',
        '0:08',
        undefined,
        'Coach Alex'
      );
    });
  });
});
