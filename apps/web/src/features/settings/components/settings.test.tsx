import userEvent from '@testing-library/user-event';

import { render } from '@/test/render';

import Settings from './settings';

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the settings page with appearance and language sections', () => {
    const { getByText, getByRole } = render(<Settings />);

    expect(getByRole('heading', { level: 2, name: 'Appearance' })).toBeInTheDocument();
    expect(getByText('Customize how Corevia looks')).toBeInTheDocument();
    expect(
      getByRole('heading', {
        level: 2,
        name: 'Language',
      })
    ).toBeInTheDocument();
    expect(getByText('Choose your preferred language')).toBeInTheDocument();
  });

  it('renders theme buttons', () => {
    const { getByRole } = render(<Settings />);

    expect(getByRole('button', { name: 'Light' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Dark' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'System' })).toBeInTheDocument();
  });

  it('renders language buttons', () => {
    const { getByRole } = render(<Settings />);

    expect(getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Français' })).toBeInTheDocument();
  });

  it('calls setTheme when light button is clicked', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<Settings />);

    const lightButton = getByRole('button', { name: 'Light' });
    const darkButton = getByRole('button', { name: 'Dark' });
    const systemButton = getByRole('button', { name: 'System' });
    await user.click(lightButton);

    expect(lightButton).toHaveAttribute('aria-pressed', 'true');
    expect(darkButton).toHaveAttribute('aria-pressed', 'false');
    expect(systemButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setTheme when dark button is clicked', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<Settings />);

    const darkButton = getByRole('button', { name: 'Dark' });
    const systemButton = getByRole('button', { name: 'System' });
    const lightButton = getByRole('button', { name: 'Light' });
    await user.click(darkButton);

    expect(darkButton).toHaveAttribute('aria-pressed', 'true');
    expect(lightButton).toHaveAttribute('aria-pressed', 'false');
    expect(systemButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setTheme when system button is clicked', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<Settings />);

    const systemButton = getByRole('button', { name: 'System' });
    const darkButton = getByRole('button', { name: 'Dark' });
    const lightButton = getByRole('button', { name: 'Light' });
    await user.click(systemButton);

    expect(systemButton).toHaveAttribute('aria-pressed', 'true');
    expect(darkButton).toHaveAttribute('aria-pressed', 'false');
    expect(lightButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('changes language to English and saves to localStorage', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<Settings />);

    const englishButton = getByRole('button', { name: 'English' });
    await user.click(englishButton);

    expect(englishButton).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('lang')).toBe('en');
  });

  it('changes language to French and saves to localStorage', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<Settings />);

    const frenchButton = getByRole('button', { name: 'Français' });
    await user.click(frenchButton);

    expect(frenchButton).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('lang')).toBe('fr');
  });
});
