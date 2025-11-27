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
  // eslint-disable-next-line no-unused-vars
  Element.prototype.hasPointerCapture = (pointerId: number) => true;
}

if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

// Fix Radix scrollIntoView crashes
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
