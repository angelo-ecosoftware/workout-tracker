import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionCoachNotesSection } from '../../../../src/components/workout/history/SessionCoachNotesSection.tsx';

describe('SessionCoachNotesSection', () => {
  const onStartEditMock = vi.fn();
  const onCancelEditMock = vi.fn();
  const onChangeValueMock = vi.fn();
  const onSaveEditMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no coach notes and viewer is not coach', () => {
    const { container } = render(
      <SessionCoachNotesSection
        sessionId="sess_1"
        coachNotes={null}
        coachName={null}
        isCoach={false}
        isEditing={false}
        editingValue=""
        isSaving={false}
        onStartEdit={onStartEditMock}
        onCancelEdit={onCancelEditMock}
        onChangeValue={onChangeValueMock}
        onSaveEdit={onSaveEditMock}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders coach notes for athletes when present', () => {
    render(
      <SessionCoachNotesSection
        sessionId="sess_1"
        coachNotes="Great depth on your squats, keep knees tracking toes."
        coachName="Coach Mike"
        isCoach={false}
        isEditing={false}
        editingValue=""
        isSaving={false}
        onStartEdit={onStartEditMock}
        onCancelEdit={onCancelEditMock}
        onChangeValue={onChangeValueMock}
        onSaveEdit={onSaveEditMock}
      />
    );

    expect(screen.getByText(/Coach Note \(Coach Mike\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Great depth on your squats/i)).toBeInTheDocument();
  });

  it('allows coach to enter edit mode and save new coach notes', async () => {
    const user = userEvent.setup();
    render(
      <SessionCoachNotesSection
        sessionId="sess_1"
        coachNotes={null}
        coachName="Coach Mike"
        isCoach={true}
        isEditing={false}
        editingValue=""
        isSaving={false}
        onStartEdit={onStartEditMock}
        onCancelEdit={onCancelEditMock}
        onChangeValue={onChangeValueMock}
        onSaveEdit={onSaveEditMock}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Add Note/i });
    expect(addBtn).toBeInTheDocument();
    await user.click(addBtn);

    expect(onStartEditMock).toHaveBeenCalled();
  });

  it('renders textarea and save button when in editing mode', async () => {
    const user = userEvent.setup();
    render(
      <SessionCoachNotesSection
        sessionId="sess_1"
        coachNotes="Initial note"
        coachName="Coach Mike"
        isCoach={true}
        isEditing={true}
        editingValue="Updated coach advice"
        isSaving={false}
        onStartEdit={onStartEditMock}
        onCancelEdit={onCancelEditMock}
        onChangeValue={onChangeValueMock}
        onSaveEdit={onSaveEditMock}
      />
    );

    const textarea = screen.getByPlaceholderText(/Write coaching feedback/i);
    expect(textarea).toHaveValue('Updated coach advice');

    const saveBtn = screen.getByRole('button', { name: /Save Coach Note/i });
    await user.click(saveBtn);

    expect(onSaveEditMock).toHaveBeenCalledWith('sess_1');
  });
});
