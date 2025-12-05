import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: () => {} }),
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

import { render } from '@/test/render';

import HealthChatbot from './HealthChatbot';

describe('HealthChatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  beforeAll(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders header and quick tags', () => {
    render(<HealthChatbot />);

    expect(screen.getByText(/Assistant santé/i)).toBeInTheDocument();
    expect(screen.getByText('Je suis stressé(e)')).toBeInTheDocument();
  });

  it('allows selecting a manual profile', async () => {
    const user = userEvent.setup();
    render(<HealthChatbot />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Psychologue' }));

    await waitFor(() => {
      expect(within(trigger).getByText('Psychologue')).toBeInTheDocument();
    });
  });

  it('displays a mock assistant reply after sending a message', async () => {
    const user = userEvent.setup();
    render(<HealthChatbot />);

    await user.type(screen.getByPlaceholderText(/Décris ta question/i), 'Comment mieux dormir ?');
    await user.click(screen.getByRole('button', { name: /Envoyer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tu mentionnes/i)).toBeInTheDocument();
    });
  });
});
