import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomeModal } from '../../../../src/components/modals/WelcomeModal.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';

describe('P1.4: Interactive Skippable Onboarding Flow (WelcomeModal)', () => {
  beforeEach(() => {
    vi.spyOn(SupabaseData, 'saveUserMetrics').mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('1. Renders Step 1 with prominent skip button', () => {
    const handleClose = vi.fn();
    render(
      <WelcomeModal
        isOpen={true}
        onClose={handleClose}
      />
    );

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/what is your main focus\?/i)).toBeInTheDocument();

    const skipBtn = screen.getByRole('button', { name: /skip for now & explore/i });
    expect(skipBtn).toBeInTheDocument();

    fireEvent.click(skipBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('2. Navigates seamlessly through Goals -> Experience -> Equipment -> Biometrics', async () => {
    const handleClose = vi.fn();
    const handleCompleted = vi.fn();

    render(
      <WelcomeModal
        isOpen={true}
        userId="usr_lifter_1"
        onClose={handleClose}
        onCompletedOnboarding={handleCompleted}
      />
    );

    // Step 1: Goals
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
    const nextBtn1 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn1);

    // Step 2: Experience
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/your experience level/i)).toBeInTheDocument();
    const nextBtn2 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn2);

    // Step 3: Equipment & Location
    expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/where do you train\?/i)).toBeInTheDocument();
    const nextBtn3 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn3);

    // Step 4: Starting Biometrics
    expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument();
    expect(screen.getByText(/weight & height/i)).toBeInTheDocument();

    const finishBtn = screen.getByRole('button', { name: /start training/i });
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(SupabaseData.saveUserMetrics).toHaveBeenCalledWith(
        'usr_lifter_1',
        expect.objectContaining({
          weight: 80,
          height: 180,
          fitnessLevel: 'intermediate',
          trainingLocation: 'gym',
        })
      );
      expect(handleCompleted).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('3. Allows stepping backward using Back button', () => {
    render(
      <WelcomeModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument();

    // Click Back
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument();
  });
});
