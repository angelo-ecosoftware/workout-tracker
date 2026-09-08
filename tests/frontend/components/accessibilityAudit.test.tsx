import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { RestTimerDrawer } from '../../../src/components/workout/tracker/RestTimerDrawer.tsx';

describe('Accessibility Standards [ACC-01]', () => {
  it('does not restrict user zoom or scaling in index.html', () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    expect(htmlContent).not.toContain('user-scalable=no');
    expect(htmlContent).not.toContain('maximum-scale=1.0');
    expect(htmlContent).toContain('viewport-fit=cover');
  });

  it('renders aria-live timer for screen-readers during rest countdown', () => {
    render(
      <RestTimerDrawer
        isOpen={true}
        initialSeconds={45}
        onClose={() => {}}
      />
    );

    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveAttribute('aria-live', 'polite');
    expect(timer).toHaveTextContent('Rest time remaining: 45 seconds');
  });
});
