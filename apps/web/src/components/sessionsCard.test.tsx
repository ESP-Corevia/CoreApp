import { describe, it, expect, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { render } from '@/test/render';

import SessionsCard from './sessionsCard';

const mockSessions = [
  {
    id: 'session-1',
    token: 'current-token',
    createdAt: new Date('2025-12-01T10:00:00Z'),
    updatedAt: new Date('2025-12-01T10:00:00Z'),
    expiresAt: new Date('2025-12-08T10:00:00Z'),
    userId: 'user-1',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  },
  {
    id: 'session-2',
    token: 'other-token',
    createdAt: new Date('2025-12-02T10:00:00Z'),
    updatedAt: new Date('2025-12-02T10:00:00Z'),
    expiresAt: new Date('2025-12-09T10:00:00Z'),
    userId: 'user-1',
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1',
  },
];

vi.mock('@/queries', () => ({
  useListSessions: vi.fn(),
  useRevokeSession: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useRevokeOtherSessions: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useRevokeSessions: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

import {
  useListSessions,
  useRevokeSession,
  useRevokeOtherSessions,
  useRevokeSessions,
} from '@/queries';

describe('SessionsCard', () => {
  it('renders loading skeleton when loading', () => {
    vi.mocked(useListSessions).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    const { getByText, container } = render(<SessionsCard />);

    expect(getByText('Active Sessions')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renders sessions list when data is loaded', () => {
    vi.mocked(useListSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    const { getByText } = render(<SessionsCard currentSessionToken="current-token" />);

    expect(getByText('Active Sessions')).toBeInTheDocument();
    expect(getByText('Chrome on Windows')).toBeInTheDocument();
    expect(getByText('Safari on iOS')).toBeInTheDocument();
  });

  it('shows no sessions message when sessions array is empty', () => {
    vi.mocked(useListSessions).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    const { getByText } = render(<SessionsCard />);

    expect(getByText('No active sessions found')).toBeInTheDocument();
  });

  it('shows bulk action buttons when there are other sessions', () => {
    vi.mocked(useListSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    const { getByRole } = render(<SessionsCard currentSessionToken="current-token" />);

    expect(getByRole('button', { name: 'Revoke Other Sessions (1)' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Revoke All Sessions' })).toBeInTheDocument();
  });

  it('calls revokeOtherSessions when clicking revoke other button', async () => {
    const mockMutate = vi.fn();
    vi.mocked(useListSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);
    vi.mocked(useRevokeOtherSessions).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    const { getByRole } = render(<SessionsCard currentSessionToken="current-token" />);

    await userEvent.click(getByRole('button', { name: 'Revoke Other Sessions (1)' }));
    expect(mockMutate).toHaveBeenCalled();
  });

  it('calls revokeSessions when clicking revoke all button', async () => {
    const mockMutate = vi.fn();
    vi.mocked(useListSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);
    vi.mocked(useRevokeSessions).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    const { getByRole } = render(<SessionsCard currentSessionToken="current-token" />);

    await userEvent.click(getByRole('button', { name: 'Revoke All Sessions' }));
    expect(mockMutate).toHaveBeenCalled();
  });

  it('marks current session correctly', () => {
    vi.mocked(useListSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    const { getByText } = render(<SessionsCard currentSessionToken="current-token" />);

    expect(getByText('Current')).toBeInTheDocument();
  });
  it('calls revokeSession when clicking individual session revoke button', async () => {
    const mockMutate = vi.fn();

    vi.mocked(useListSessions).mockReturnValue({
      data: mockSessions,
      isLoading: false,
    } as any);

    vi.mocked(useRevokeSession).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    const { getAllByRole } = render(<SessionsCard currentSessionToken="current-token" />);
    const revokeButtons = getAllByRole('button', { name: 'Revoke session' });

    await userEvent.click(revokeButtons[0]);

    expect(mockMutate).toHaveBeenCalledWith('other-token');
  });
  it('does not show bulk action buttons when there are no other sessions', () => {
    vi.mocked(useListSessions).mockReturnValue({
      data: [mockSessions[0]],
      isLoading: false,
    } as any);

    const { queryByRole } = render(<SessionsCard currentSessionToken="current-token" />);

    expect(queryByRole('button', { name: /Revoke Other Sessions/ })).toBeNull();
    expect(queryByRole('button', { name: /Revoke All Sessions/ })).toBeNull();
  });
});
