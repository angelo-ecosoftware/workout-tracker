import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SuccessModal } from '../../../../src/components/ui/SuccessModal.tsx';

describe('SuccessModal Component (Universal Dynamic Success Notification)', () => {
  it('renders modal with custom title, message, and action text when open', () => {
    const handleClose = vi.fn();

    render(
      <SuccessModal
        isOpen={true}
        onClose={handleClose}
        title="Settings Saved!"
        message="Your workout settings were successfully applied."
        details="Synced to Cloud"
        actionText="Awesome"
        autoCloseMs={0}
      />
    );

    expect(screen.getByRole('dialog', { name: /settings saved!/i })).toBeInTheDocument();
    expect(screen.getByText(/your workout settings were successfully applied/i)).toBeInTheDocument();
    expect(screen.getByText(/synced to cloud/i)).toBeInTheDocument();

    const actionBtn = screen.getByRole('button', { name: /awesome/i });
    expect(actionBtn).toBeInTheDocument();

    fireEvent.click(actionBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SuccessModal
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('auto-closes after specified duration', () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();

    render(
      <SuccessModal
        isOpen={true}
        onClose={handleClose}
        autoCloseMs={1500}
      />
    );

    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();

    render(
      <SuccessModal
        isOpen={true}
        onClose={handleClose}
        autoCloseMs={0}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
