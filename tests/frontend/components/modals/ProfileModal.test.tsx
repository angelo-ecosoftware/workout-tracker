import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileModal } from '../../../../src/components/modals/ProfileModal.tsx';
import { AuthUser } from '../../../../src/context/AuthContext.tsx';
import { UserMetrics } from '../../../../src/models.ts';

const mockUser: AuthUser = {
  id: 'usr_profile_athlete',
  uid: 'usr_profile_athlete',
  email: 'athlete@champion.com',
  displayName: 'Champion Athlete',
};

const mockSaveUserMetrics = vi.fn();

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  saveUserMetrics: vi.fn(async (userId: string, metrics: UserMetrics) => {
    mockSaveUserMetrics(userId, metrics);
  }),
}));

describe('ProfileModal Component (Dynamic Behavioral Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders athlete biometric information and goals when open', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
        metrics={{
          height: 182,
          weight: 84.5,
          fitnessLevel: 'intermediate',
          trainingLocation: 'gym',
          goals: ['Build Muscle (Hypertrophy)'],
        }}
      />
    );

    expect(screen.getByRole('heading', { name: /athlete profile/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('182')).toBeInTheDocument();
    expect(screen.getByDisplayValue('84.5')).toBeInTheDocument();
  });

  it('dynamically saves updated biometrics via form submission', async () => {
    const user = userEvent.setup();
    const onMetricsUpdated = vi.fn();

    render(
      <ProfileModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
        onMetricsUpdated={onMetricsUpdated}
      />
    );

    const heightInput = screen.getByPlaceholderText(/182/i);
    const weightInput = screen.getByPlaceholderText(/78.5/i);

    await user.clear(heightInput);
    await user.type(heightInput, '185');

    await user.clear(weightInput);
    await user.type(weightInput, '88.5');

    const saveBtn = screen.getByRole('button', { name: /save profile/i });
    await user.click(saveBtn);

    expect(mockSaveUserMetrics).toHaveBeenCalledWith(
      'usr_profile_athlete',
      expect.objectContaining({
        height: 185,
        weight: 88.5,
      })
    );
    expect(onMetricsUpdated).toHaveBeenCalledTimes(1);
  });

  it('triggers confirmation warning dialog when biometric values exceed typical boundaries', async () => {
    const user = userEvent.setup();
    const onMetricsUpdated = vi.fn();

    render(
      <ProfileModal
        isOpen={true}
        onClose={vi.fn()}
        user={mockUser}
        onMetricsUpdated={onMetricsUpdated}
      />
    );

    const heightInput = screen.getByPlaceholderText(/182/i);
    const weightInput = screen.getByPlaceholderText(/78.5/i);

    // Enter out-of-range height (320 cm) and weight (15 kg)
    await user.clear(heightInput);
    await user.type(heightInput, '320');

    await user.clear(weightInput);
    await user.type(weightInput, '15');

    const saveBtn = screen.getByRole('button', { name: /save profile/i });
    await user.click(saveBtn);

    // Confirmation warning modal should appear
    expect(screen.getByText(/confirm biometric measurements/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure this information is correct\?/i)).toBeInTheDocument();
    expect(mockSaveUserMetrics).not.toHaveBeenCalled();

    // Confirm save
    const confirmBtn = screen.getByRole('button', { name: /yes, save anyway/i });
    await user.click(confirmBtn);

    expect(mockSaveUserMetrics).toHaveBeenCalledWith(
      'usr_profile_athlete',
      expect.objectContaining({
        height: 320,
        weight: 15,
      })
    );
  });
});
