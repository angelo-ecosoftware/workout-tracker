import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachMacroPlannerModal } from '../../../../src/components/coach/CoachMacroPlannerModal.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';
import { CoachMacroPrescription } from '../../../../src/models.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  fetchActiveMacroPrescription: vi.fn(),
  saveMacroPrescription: vi.fn(),
}));

describe('CoachMacroPlannerModal Component', () => {
  const mockPrescription: CoachMacroPrescription = {
    id: 'presc-1',
    coachId: 'coach-123',
    coachName: 'Dr. Elena',
    athleteId: 'athlete-1',
    targetKcal: 2600,
    targetProteinG: 185,
    targetCarbsG: 280,
    targetFatG: 70,
    targetFiberG: 35,
    notes: 'High protein refeed protocol',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SupabaseData.fetchActiveMacroPrescription).mockResolvedValue(mockPrescription);
  });

  it('renders modal with preloaded macro prescription inputs', async () => {
    render(
      <CoachMacroPlannerModal
        isOpen={true}
        onClose={vi.fn()}
        coachId="coach-123"
        coachName="Dr. Elena"
        athleteId="athlete-1"
        athleteName="Sarah Connor"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/prescribe macro targets/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('2600')).toBeInTheDocument();
      expect(screen.getByDisplayValue('185')).toBeInTheDocument();
      expect(screen.getByDisplayValue('280')).toBeInTheDocument();
      expect(screen.getByDisplayValue('70')).toBeInTheDocument();
      expect(screen.getByDisplayValue('High protein refeed protocol')).toBeInTheDocument();
    });
  });

  it('allows coach to update and publish new macro prescription', async () => {
    const user = userEvent.setup();
    const onPrescriptionSaved = vi.fn();
    vi.mocked(SupabaseData.saveMacroPrescription).mockResolvedValue({
      ...mockPrescription,
      targetKcal: 2800,
    });

    render(
      <CoachMacroPlannerModal
        isOpen={true}
        onClose={vi.fn()}
        coachId="coach-123"
        coachName="Dr. Elena"
        athleteId="athlete-1"
        athleteName="Sarah Connor"
        onPrescriptionSaved={onPrescriptionSaved}
      />
    );

    const kcalInput = await screen.findByDisplayValue('2600');
    await user.clear(kcalInput);
    await user.type(kcalInput, '2800');

    const submitBtn = screen.getByRole('button', { name: /publish macro targets/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(SupabaseData.saveMacroPrescription).toHaveBeenCalledWith(
        'coach-123',
        'athlete-1',
        2800,
        185,
        280,
        70,
        35,
        'High protein refeed protocol',
        'Dr. Elena'
      );
    });
  });
});
