import { describe, it, expect, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { render } from '@/test/render';

import { SessionCell } from './sessionCell';

const mockSession = {
  id: 'session-123',
  token: 'token-abc',
  createdAt: new Date('2025-12-01T10:00:00Z'),
  expiresAt: new Date('2025-12-08T10:00:00Z'),
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
};

describe('SessionCell', () => {
  it('renders session information correctly', () => {
    const { getByText } = render(<SessionCell session={mockSession} />);

    expect(getByText('Chrome on Windows')).toBeInTheDocument();
    expect(getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('shows current session badge when isCurrentSession is true', () => {
    const { getByText } = render(<SessionCell session={mockSession} isCurrentSession={true} />);

    expect(getByText('Current')).toBeInTheDocument();
  });

  it('does not show current session badge when isCurrentSession is false', () => {
    const { queryByText } = render(<SessionCell session={mockSession} isCurrentSession={false} />);

    expect(queryByText('Current')).not.toBeInTheDocument();
  });

  it('shows revoke button when not current session and onRevoke provided', () => {
    const onRevoke = vi.fn();
    const { getByRole } = render(
      <SessionCell session={mockSession} isCurrentSession={false} onRevoke={onRevoke} />
    );

    const revokeButton = getByRole('button', { name: 'Revoke session' });
    expect(revokeButton).toBeInTheDocument();
  });

  it('does not show revoke button for current session', () => {
    const onRevoke = vi.fn();
    const { queryByRole } = render(
      <SessionCell session={mockSession} isCurrentSession={true} onRevoke={onRevoke} />
    );

    expect(queryByRole('button', { name: 'Revoke session' })).not.toBeInTheDocument();
  });

  it('calls onRevoke with token when revoke button is clicked', async () => {
    const onRevoke = vi.fn();
    const { getByRole } = render(
      <SessionCell session={mockSession} isCurrentSession={false} onRevoke={onRevoke} />
    );

    const revokeButton = getByRole('button', { name: 'Revoke session' });
    await userEvent.click(revokeButton);

    expect(onRevoke).toHaveBeenCalledWith('token-abc');
  });

  it('disables revoke button when isRevoking is true', () => {
    const onRevoke = vi.fn();
    const { getByRole } = render(
      <SessionCell
        session={mockSession}
        isCurrentSession={false}
        onRevoke={onRevoke}
        isRevoking={true}
      />
    );

    const revokeButton = getByRole('button', { name: 'Revoke session' });
    expect(revokeButton).toBeDisabled();
  });

  it('handles mobile user agent correctly', () => {
    const mobileSession = {
      ...mockSession,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
    };
    const { getByText } = render(<SessionCell session={mobileSession} />);

    expect(getByText('Safari on iOS')).toBeInTheDocument();
  });

  it('handles null userAgent gracefully', () => {
    const sessionWithoutUserAgent = {
      ...mockSession,
      userAgent: null,
    };
    const { getByText } = render(<SessionCell session={sessionWithoutUserAgent} />);

    expect(getByText('Unknown on Unknown')).toBeInTheDocument();
  });

  it('detects Firefox correctly', () => {
    const session = {
      ...mockSession,
      userAgent: 'Mozilla/5.0 Firefox/121.0',
    };
    const { getByText } = render(<SessionCell session={session} />);
    expect(getByText('Firefox on Unknown')).toBeInTheDocument();
  });

  it('detects Edge correctly', () => {
    const session = {
      ...mockSession,
      userAgent: 'Mozilla/5.0 Edg/120.0',
    };
    const { getByText } = render(<SessionCell session={session} />);
    expect(getByText('Edge on Unknown')).toBeInTheDocument();
  });

  it('detects Opera correctly', () => {
    const session = {
      ...mockSession,
      userAgent: 'Mozilla/5.0 OPR/90.0',
    };
    const { getByText } = render(<SessionCell session={session} />);
    expect(getByText('Opera on Unknown')).toBeInTheDocument();
  });

  it('detects Linux OS', () => {
    const session = {
      ...mockSession,
      userAgent: 'Mozilla/5.0 Linux Chrome/100',
    };
    const { getByText } = render(<SessionCell session={session} />);
    expect(getByText('Chrome on Linux')).toBeInTheDocument();
  });

  it('detects Android OS & device=mobile', () => {
    const session = {
      ...mockSession,
      userAgent: 'Mozilla/5.0 Android Chrome',
    };
    const { getByText } = render(<SessionCell session={session} />);
    expect(getByText('Chrome on Android')).toBeInTheDocument();
  });

  it('detects iPadOS & device=tablet', () => {
    const session = {
      ...mockSession,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) Safari',
    };
    const { getByText } = render(<SessionCell session={session} />);

    expect(getByText('Safari on iPadOS')).toBeInTheDocument();
  });
  it('detects macOS & device=desktop', () => {
    const session = {
      ...mockSession,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
    };
    const { getByText } = render(<SessionCell session={session} />);

    expect(getByText('Safari on macOS')).toBeInTheDocument();
  });

  it('renders correctly when ipAddress is missing', () => {
    const session = {
      ...mockSession,
      ipAddress: null,
    };
    const { queryByText, getByText } = render(<SessionCell session={session} />);

    expect(queryByText('192.168.1.1')).not.toBeInTheDocument();

    expect(
      getByText(
        `Created: ${mockSession.createdAt.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`
      )
    ).toBeInTheDocument();
  });

  it('does not render revoke button when onRevoke is missing', () => {
    const { queryByRole } = render(<SessionCell session={mockSession} isCurrentSession={false} />);

    expect(queryByRole('button', { name: 'Revoke session' })).not.toBeInTheDocument();
  });

  it('renders expiration date with translation key formatting', () => {
    const { getByText } = render(<SessionCell session={mockSession} />);

    expect(getByText(/Expires:/)).toBeInTheDocument();
  });
});
