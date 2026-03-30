/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import '@testing-library/jest-dom';

import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(q => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
// Radix Select fixes
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = (_pointerId: number) => true;
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

// Fix Radix scrollIntoView crashes
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds = [0];

  disconnect() {}

  observe() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {}
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});
