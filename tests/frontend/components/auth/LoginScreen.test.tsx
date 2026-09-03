import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginScreen } from '../../../../src/components/auth/LoginScreen.tsx';

let mockLoginWithGoogle = vi.fn();
let mockInstallPrompt: any = null;
let mockIsStandalone = false;
let mockIsIOS = false;
let mockIsMobile = false;

vi.mock('../../../../src/context/AuthContext.tsx', () => ({
  useAuth: () => ({
    loginWithGoogle: mockLoginWithGoogle,
  }),
}));

vi.mock('../../../../src/context/PWAContext.tsx', () => ({
  usePWA: () => ({
    installPrompt: mockInstallPrompt,
    setInstallPrompt: vi.fn(),
    isStandalone: mockIsStandalone,
    isIOS: mockIsIOS,
    isMobile: mockIsMobile,
  }),
}));

describe('LoginScreen Component (Dynamic Behavioral Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockLoginWithGoogle = vi.fn();
    mockInstallPrompt = null;
    mockIsStandalone = false;
    mockIsIOS = false;
    mockIsMobile = false;
  });

  it('renders application branding, title, and sign in button', () => {
    render(<LoginScreen />);

    expect(screen.getByRole('heading', { name: /workout tracker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('handles Google login trigger on button click', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    const loginBtn = screen.getByRole('button', { name: /sign in with google/i });
    await user.click(loginBtn);

    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('displays error alert when login authentication fails', async () => {
    const user = userEvent.setup();
    const dynamicError = `Supabase OAuth failure: ${Math.random().toString(36).substring(7)}`;
    mockLoginWithGoogle.mockRejectedValueOnce(new Error(dynamicError));

    render(<LoginScreen />);

    const loginBtn = screen.getByRole('button', { name: /sign in with google/i });
    await user.click(loginBtn);

    expect(await screen.findByText(new RegExp(dynamicError, 'i'))).toBeInTheDocument();
    expect(screen.getByText(/sign-in failed:/i)).toBeInTheDocument();
  });

  it('shows install app banner dynamically when user is on mobile browser', () => {
    mockIsMobile = true;
    mockIsStandalone = false;

    render(<LoginScreen />);

    expect(screen.getByText(/install workout app/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download app/i })).toBeInTheDocument();
  });
});
