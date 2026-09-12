import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('frontend test environment', () => {
  it('renders a React component in a browser-like environment', () => {
    render(<button type="button">Test environment ready</button>);

    expect(screen.getByRole('button', { name: 'Test environment ready' })).toBeInTheDocument();
  });
});
