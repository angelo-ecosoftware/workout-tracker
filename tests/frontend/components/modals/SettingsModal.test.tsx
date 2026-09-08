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
  fetchCoachAthleteLinks: vi.fn(async () => ({ coaches: [], athletes: [] })),
  fetchRoutineProposals: vi.fn(async () => []),
}));

describe('SettingsModal Component (Dynamic Behavioral Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders settings landing view with concise intent-driven categories', () => {
    const { rerender } = render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    // Verify top-level intent-driven categories are displayed on the landing page
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /training/i })).toBeInTheDocument();
    expect(screen.getByText(/timer, routines, exercises, appearance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /privacy & sharing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /data & app/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <SettingsModal isOpen={false} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.queryByRole('heading', { name: /^settings$/i })).not.toBeInTheDocument();
  });

  it('navigates to Training subpage and back to Settings home', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    // Click into Training subpage
    const trainingNav = screen.getByRole('button', { name: /training/i });
    await user.click(trainingNav);

    // Verify training content is visible in subpage
    expect(screen.getByText(/theme & appearance/i)).toBeInTheDocument();
    expect(screen.getByText(/rest interval timer/i)).toBeInTheDocument();
    expect(screen.queryByText(/assisted workout/i)).not.toBeInTheDocument();
    expect(screen.getByText(/edit routines & exercises/i)).toBeInTheDocument();

    // Click back button to return to Settings home
    const backBtn = screen.getByRole('button', { name: /back to settings menu/i });
    await user.click(backBtn);

    // Verify we are back on the landing home
    expect(screen.getByRole('button', { name: /privacy & sharing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /data & app/i })).toBeInTheDocument();
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

  it('navigates to Account subpage and triggers logout flow', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    // Navigate to Account subpage
    const accountNav = screen.getByRole('button', { name: /account/i });
    await user.click(accountNav);

    // Verify account subpage details
    expect(screen.getByText(/active signed-in account/i)).toBeInTheDocument();
    expect(screen.getByText('athlete@champion.com')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders "How to Build a Routine & Log" in Training and opens RoutineOnboardingModal when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    // Navigate to Training subpage
    const trainingNav = screen.getByRole('button', { name: /training/i });
    await user.click(trainingNav);

    const walkthroughBtn = screen.getByRole('button', { name: /how to build a routine & log/i });
    expect(walkthroughBtn).toBeInTheDocument();
    expect(screen.getByText(/interactive walkthrough: add routine, exercise & log sets/i)).toBeInTheDocument();

    await user.click(walkthroughBtn);

    // RoutineOnboardingModal should open displaying Step 1 of 4: Create a Routine Day
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. create a routine day/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip walkthrough/i })).toBeInTheDocument();
  });

  it('renders Profile & Biometrics Recalibration in Help and opens WelcomeModal when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    // Navigate to Help subpage
    const helpNav = screen.getByRole('button', { name: /help/i });
    await user.click(helpNav);

    const profileOnboardBtn = screen.getByRole('button', { name: /profile & biometrics recalibration/i });
    expect(profileOnboardBtn).toBeInTheDocument();

    await user.click(profileOnboardBtn);

    // WelcomeModal should open displaying Step 1 of 4
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/what is your main focus\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip for now & explore/i })).toBeInTheDocument();
  });

  it('navigates to Privacy subpage and displays privacy, coach, compliance, and danger zone', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    // Navigate to Privacy & Sharing subpage
    const privacyNav = screen.getByRole('button', { name: /privacy & sharing/i });
    await user.click(privacyNav);

    expect(screen.getByText(/profile & data visibility/i)).toBeInTheDocument();
    expect(screen.getByText(/security & compliance dossier/i)).toBeInTheDocument();
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});
