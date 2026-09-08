import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteAccountModal } from '../../../../src/components/settings/DeleteAccountModal.tsx';
import * as AccountDeletionService from '../../../../src/lib/accountDeletionService.ts';

vi.mock('../../../../src/lib/accountDeletionService.ts', () => ({
  executeGdprAccountPurge: vi.fn(),
}));

describe('DeleteAccountModal Component (GDPR Article 17 Purge)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with GDPR Article 17 warning and target email', () => {
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-test-uuid"
        userEmail="athlete@example.com"
      />
    );

    expect(screen.getByText(/gdpr article 17/i)).toBeInTheDocument();
    expect(screen.getByText(/right to be forgotten/i)).toBeInTheDocument();
    expect(screen.getByText(/athlete@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /erase all data/i })).toBeDisabled();
  });

  it('keeps erase button disabled until countdown finishes AND confirmation phrase is typed', async () => {
    vi.useFakeTimers();
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-test-uuid"
      />
    );

    const eraseBtn = screen.getByRole('button', { name: /erase all data/i });
    expect(eraseBtn).toBeDisabled();

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Still disabled because phrase is not typed
    expect(eraseBtn).toBeDisabled();

    // Type matching confirmation phrase
    const input = screen.getByPlaceholderText('PERMANENTLY DELETE');
    fireEvent.change(input, { target: { value: 'PERMANENTLY DELETE' } });

    // Now button should be enabled!
    expect(eraseBtn).not.toBeDisabled();
    vi.useRealTimers();
  });

  it('calls executeGdprAccountPurge and triggers onAccountDeleted on success', async () => {
    vi.useFakeTimers();
    vi.mocked(AccountDeletionService.executeGdprAccountPurge).mockResolvedValue({
      success: true,
      purgedUserId: 'user-test-uuid',
    });

    const handleDeleted = vi.fn();
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-test-uuid"
        onAccountDeleted={handleDeleted}
      />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const input = screen.getByPlaceholderText('PERMANENTLY DELETE');
    fireEvent.change(input, { target: { value: 'PERMANENTLY DELETE' } });

    const eraseBtn = screen.getByRole('button', { name: /erase all data/i });
    await act(async () => {
      fireEvent.click(eraseBtn);
    });

    expect(AccountDeletionService.executeGdprAccountPurge).toHaveBeenCalledWith('user-test-uuid');

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(handleDeleted).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('displays error message if purge fails', async () => {
    vi.useFakeTimers();
    vi.mocked(AccountDeletionService.executeGdprAccountPurge).mockResolvedValue({
      success: false,
      error: 'Permission denied on database',
    });

    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-test-uuid"
      />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const input = screen.getByPlaceholderText('PERMANENTLY DELETE');
    fireEvent.change(input, { target: { value: 'PERMANENTLY DELETE' } });

    const eraseBtn = screen.getByRole('button', { name: /erase all data/i });
    await act(async () => {
      fireEvent.click(eraseBtn);
    });

    expect(screen.getByText(/permission denied on database/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
