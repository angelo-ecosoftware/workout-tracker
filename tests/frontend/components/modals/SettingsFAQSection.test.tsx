import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsFAQSection } from '../../../../src/components/modals/SettingsFAQSection.tsx';

describe('P1.5: In-App Searchable FAQ Section (SettingsFAQSection)', () => {
  it('1. Renders FAQ accordion with common support topics', () => {
    render(<SettingsFAQSection />);

    expect(screen.getByText(/help & faq/i)).toBeInTheDocument();
    expect(screen.getByText(/how is progressive overload calculated\?/i)).toBeInTheDocument();
    expect(screen.getByText(/how does the rest timer and vibration work\?/i)).toBeInTheDocument();
    expect(screen.getByText(/how do i scan or import supermarket groceries\?/i)).toBeInTheDocument();
    expect(screen.getByText(/can i log workouts offline in gym basements\?/i)).toBeInTheDocument();
  });

  it('2. Expands and collapses accordion answers on click', () => {
    render(<SettingsFAQSection />);

    const questionBtn = screen.getByRole('button', { name: /how is progressive overload calculated\?/i });
    expect(questionBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(questionBtn);
    expect(questionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/when you hit the maximum prescribed reps on all working sets/i)).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(questionBtn);
    expect(questionBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('3. Filters questions dynamically via live search input', () => {
    render(<SettingsFAQSection />);

    const searchInput = screen.getByPlaceholderText(/search faq/i);
    fireEvent.change(searchInput, { target: { value: 'offline' } });

    // Should display offline question
    expect(screen.getByText(/can i log workouts offline in gym basements\?/i)).toBeInTheDocument();

    // Should not display non-matching question
    expect(screen.queryByText(/how is progressive overload calculated\?/i)).not.toBeInTheDocument();
  });

  it('4. Shows friendly empty state message when no results match query', () => {
    render(<SettingsFAQSection />);

    const searchInput = screen.getByPlaceholderText(/search faq/i);
    fireEvent.change(searchInput, { target: { value: 'xyznonexistentterm' } });

    expect(screen.getByText(/no answers matching/i)).toBeInTheDocument();
  });

  it('5. Renders routine onboarding walkthrough launcher banner and in-answer action', () => {
    const handleLaunch = vi.fn();
    render(<SettingsFAQSection onLaunchRoutineOnboarding={handleLaunch} />);

    // Top banner is rendered
    const startGuideBtn = screen.getByRole('button', { name: /start guide/i });
    expect(startGuideBtn).toBeInTheDocument();
    fireEvent.click(startGuideBtn);
    expect(handleLaunch).toHaveBeenCalledTimes(1);

    // Question accordion also contains walkthrough launcher
    const routineQuestion = screen.getByRole('button', { name: /how do i create a routine and log my first exercise\?/i });
    expect(routineQuestion).toBeInTheDocument();
    fireEvent.click(routineQuestion);

    const launchWalkthroughBtn = screen.getByRole('button', { name: /launch interactive walkthrough/i });
    expect(launchWalkthroughBtn).toBeInTheDocument();
    fireEvent.click(launchWalkthroughBtn);
    expect(handleLaunch).toHaveBeenCalledTimes(2);
  });
});
