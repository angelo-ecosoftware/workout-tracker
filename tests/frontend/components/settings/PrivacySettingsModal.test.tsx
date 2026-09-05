import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrivacySettingsModal } from '../../../../src/components/settings/PrivacySettingsModal.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';
import { UserPrivacySettings, UserPeerShare } from '../../../../src/models.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  fetchUserPrivacySettings: vi.fn(),
  updateUserPrivacySettings: vi.fn(),
  fetchUserPeerShares: vi.fn(),
  saveUserPeerShare: vi.fn(),
  deleteUserPeerShare: vi.fn(),
}));

describe('PrivacySettingsModal Component', () => {
  const mockPrivacy: UserPrivacySettings = {
    userId: 'user-123',
    isPublicProfile: false,
    shareWorkouts: true,
    shareBiometrics: false,
    shareDietary: false,
    sharePhotos: false,
    shareReviewReceipts: true,
  };

  const mockPeers: UserPeerShare[] = [
    {
      id: 'peer-1',
      ownerId: 'user-123',
      granteeId: 'grantee-456',
      granteeName: 'Marcus Rivera',
      shareWorkouts: true,
      shareBiometrics: false,
      shareDietary: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SupabaseData.fetchUserPrivacySettings).mockResolvedValue(mockPrivacy);
    vi.mocked(SupabaseData.fetchUserPeerShares).mockResolvedValue(mockPeers);
    vi.mocked(SupabaseData.updateUserPrivacySettings).mockResolvedValue({
      ...mockPrivacy,
      isPublicProfile: true,
    });
  });

  it('renders privacy modal with public toggle and coach override security notice', async () => {
    render(
      <PrivacySettingsModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/privacy & visibility settings/i)).toBeInTheDocument();
      expect(screen.getByText(/coach handshake security guarantee/i)).toBeInTheDocument();
      expect(screen.getByText(/marcus rivera/i)).toBeInTheDocument();
    });
  });

  it('toggles public profile state and reveals granular module controls', async () => {
    const user = userEvent.setup();
    render(
      <PrivacySettingsModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle public profile/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /toggle public profile/i }));

    await waitFor(() => {
      expect(SupabaseData.updateUserPrivacySettings).toHaveBeenCalledWith('user-123', {
        isPublicProfile: true,
      });
      expect(screen.getByText(/granular public module visibility/i)).toBeInTheDocument();
      expect(screen.getByText(/bodyweight & bmi matrix/i)).toBeInTheDocument();
    });
  });

  it('allows adding a new selective peer share training partner', async () => {
    const user = userEvent.setup();
    const newPeer: UserPeerShare = {
      id: 'peer-2',
      ownerId: 'user-123',
      granteeId: 'peer_elena',
      granteeName: 'Dr. Elena',
      shareWorkouts: true,
      shareBiometrics: true,
      shareDietary: true,
    };

    vi.mocked(SupabaseData.saveUserPeerShare).mockResolvedValue(newPeer);

    render(
      <PrivacySettingsModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add partner/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add partner/i }));

    const nameInput = screen.getByPlaceholderText(/marcus rivera/i);
    await user.type(nameInput, 'Dr. Elena');

    await user.click(screen.getByRole('button', { name: /grant access/i }));

    await waitFor(() => {
      expect(SupabaseData.saveUserPeerShare).toHaveBeenCalledWith(
        'user-123',
        expect.any(String),
        'Dr. Elena',
        {
          shareWorkouts: true,
          shareBiometrics: false,
          shareDietary: false,
        }
      );
      expect(screen.getByText('Dr. Elena')).toBeInTheDocument();
    });
  });

  it('allows toggling workout review receipts (seen status)', async () => {
    const user = userEvent.setup();
    render(
      <PrivacySettingsModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-123"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle workout review receipts/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /toggle workout review receipts/i }));

    await waitFor(() => {
      expect(SupabaseData.updateUserPrivacySettings).toHaveBeenCalledWith('user-123', {
        shareReviewReceipts: false,
      });
    });
  });
});
