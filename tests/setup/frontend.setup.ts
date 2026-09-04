import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Automatically cleanup DOM after each test run
afterEach(() => {
  cleanup();
});

// Polyfill window.matchMedia for JSDOM
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Polyfill ResizeObserver for JSDOM
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  window.ResizeObserver = ResizeObserver;
}

// Polyfill IntersectionObserver for JSDOM
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    takeRecords = vi.fn(() => []);
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  window.IntersectionObserver = IntersectionObserver as any;
}

// Polyfill URL.createObjectURL and URL.revokeObjectURL for JSDOM
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn().mockImplementation(() => `blob:mock-uuid-${Date.now()}`);
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}
