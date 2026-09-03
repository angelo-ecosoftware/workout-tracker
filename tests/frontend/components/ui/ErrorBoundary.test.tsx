import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../../../../src/components/ui/ErrorBoundary.tsx';

const ThrowingComponent: React.FC<{ errorMessage?: string }> = ({ errorMessage = 'Simulated Crash' }) => {
  throw new Error(errorMessage);
};

const SafeComponent: React.FC = () => {
  return <div>App Content Intact</div>;
};

describe('ErrorBoundary Component (Dynamic Behavioral Suite)', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress console.error during deliberate error throwing in tests
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no runtime error occurs', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('App Content Intact')).toBeInTheDocument();
  });

  it('catches render errors and dynamically renders the error boundary fallback UI', () => {
    const dynamicErrorMessage = `Critical invariant violation: ${Math.random().toString(36).substring(7)}`;

    render(
      <ErrorBoundary>
        <ThrowingComponent errorMessage={dynamicErrorMessage} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(dynamicErrorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload app/i })).toBeInTheDocument();
  });
});
