import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmModal } from '../../../../src/components/ui/ConfirmModal.tsx';

describe('ConfirmModal Component (Dynamic Behavioral Suite)', () => {
  const dynamicScenarios = [
    {
      title: 'Delete Routine',
      description: 'Are you sure you want to permanently delete this routine?',
      confirmText: 'Yes, Delete',
      cancelText: 'Keep Routine',
      confirmVariant: 'danger' as const,
    },
    {
      title: 'Reset Active Workout',
      description: 'Your logged sets for today will be discarded.',
      confirmText: 'Reset',
      cancelText: 'Continue Session',
      confirmVariant: 'primary' as const,
    },
    {
      title: `Custom Action ${Math.random().toString(36).substring(7)}`,
      description: 'Testing parameterized dynamic content propagation.',
      confirmText: 'Apply',
      cancelText: 'Dismiss',
      confirmVariant: 'primary' as const,
    },
  ];

  dynamicScenarios.forEach(({ title, description, confirmText, cancelText, confirmVariant }) => {
    it(`renders and behaves correctly for scenario: "${title}"`, async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { rerender } = render(
        <ConfirmModal
          isOpen={true}
          title={title}
          description={description}
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirmText={confirmText}
          cancelText={cancelText}
          confirmVariant={confirmVariant}
        />
      );

      // Verify dynamic text content rendered
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();

      // Verify user clicking cancel dispatches onCancel
      const cancelBtn = screen.getByRole('button', { name: cancelText });
      await user.click(cancelBtn);
      expect(onCancel).toHaveBeenCalledTimes(1);

      // Verify user clicking confirm dispatches onConfirm
      const confirmBtn = screen.getByRole('button', { name: confirmText });
      await user.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Verify closed modal unmounts from accessibility tree
      rerender(
        <ConfirmModal
          isOpen={false}
          title={title}
          description={description}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
    });
  });

  it('invokes onCancel when clicking backdrop outside modal content', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    const { container } = render(
      <ConfirmModal
        isOpen={true}
        title="Backdrop Test"
        description="Clicking backdrop should close"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    const backdrop = container.firstChild as HTMLElement;
    await user.click(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
