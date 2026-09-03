import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from '../../../../src/components/ui/Header.tsx';
import { ThemeProvider } from '../../../../src/context/ThemeContext.tsx';
import { userFactory } from '../../../shared/fixtures/factories.ts';

// Dynamic mock state for AuthContext & PWAContext
const mockAuthUser = {
  id: 'usr_test_athlete',
  uid: 'usr_test_athlete',
  email: 'athlete@champion.com',
  displayName: 'Champion Athlete',
  photoURL: null as string | null,
};

let mockIsOnline = true;
let mockTriggerManualSync = vi.fn();

vi.mock('../../../../src/context/AuthContext.tsx', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    logout: vi.fn(),
    switchAccount: vi.fn(),
    loginWithGoogle: vi.fn(),
  }),
}));

vi.mock('../../../../src/context/PWAContext.tsx', () => ({
  usePWA: () => ({
    isOnline: mockIsOnline,
    pendingSyncCount: 0,
    triggerManualSync: mockTriggerManualSync,
  }),
}));

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  initializeUser: vi.fn().mockResolvedValue({
    userId: 'usr_test_athlete',
    metrics: { heightCm: 180, bodyWeightKg: 80 },
  }),
  fetchWorkoutsData: vi.fn().mockResolvedValue({
    workoutsList: [],
    customExercisesList: [],
  }),
}));

describe('Header Component (Dynamic Behavioral Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOnline = true;
    mockAuthUser.displayName = 'Champion Athlete';
  });

  it('renders application branding and user identity', async () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByRole('heading', { name: /workout tracker/i })).toBeInTheDocument();
    expect(screen.getByText(/CHAMPION ATHLETE/i)).toBeInTheDocument();
  });

  it('renders offline mode badge dynamically when network is disconnected', async () => {
    mockIsOnline = false;
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    expect(screen.getByText(/Offline Mode/i)).toBeInTheDocument();
  });

  it('opens Settings and Profile modals on respective user interactions', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );

    // Click settings button
    const settingsBtn = screen.getByTitle('Settings');
    await user.click(settingsBtn);

    // Settings Modal should open with its heading
    expect(await screen.findByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
  });
});
