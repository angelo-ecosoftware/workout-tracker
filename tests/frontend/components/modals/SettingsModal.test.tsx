import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from '../../../../src/components/modals/SettingsModal.tsx';
import { ThemeProvider } from '../../../../src/context/ThemeContext.tsx';
import { AuthUser } from '../../../../src/context/AuthContext.tsx';

const mockUser: AuthUser = {
  id: 'usr_settings_athlete',
  uid: 'usr_settings_athlete',
  email: 'athlete@champion.com',
  displayName: 'Champion Athlete',
};

const mockLogout = vi.fn();
const mockSwitchAccount = vi.fn();

vi.mock('../../../../src/context/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    switchAccount: mockSwitchAccount,
    loginWithGoogle: vi.fn(),
  }),
}));

vi.mock('../../../../src/context/PWAContext.tsx', () => ({
  usePWA: () => ({
    installPrompt: null,
    setInstallPrompt: vi.fn(),
    isStandalone: false,
    isIOS: false,
    isMobile: false,
  }),
}));

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  exportAllLogs: vi.fn(async () => ({ workouts: [], sessions: [] })),
  importAllLogs: vi.fn(async () => ({ success: true })),
  fetchWorkoutsData: vi.fn(async () => ({ combinedWorkouts: [] })),
  saveWorkoutsAndExercises: vi.fn(async () => {}),
}));

describe('SettingsModal Component (Dynamic Behavioral Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders settings modal when isOpen is true and unmounts when false', () => {
    const { rerender } = render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
    expect(screen.getByText(/theme & appearance/i)).toBeInTheDocument();
    expect(screen.getByText(/assisted workout/i)).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <SettingsModal isOpen={false} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.queryByRole('heading', { name: /^settings$/i })).not.toBeInTheDocument();
  });

  it('dispatches onClose callback when clicking the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </ThemeProvider>
    );

    const closeBtn = screen.getByLabelText(/close settings/i);
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers logout flow when clicking logout button', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
