import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { render } from '@/test/render';

import { useSearchMedications } from '../../../queries';

import MedicationsSearch from './medications-search';

vi.mock('../../../queries', () => ({
  useSearchMedications: vi.fn(),
}));

vi.mock('./medication-results-list', () => ({
  default: ({ items, isLoading, page, totalPages }: any) => (
    <div data-testid="results-list">
      {isLoading ? 'loading' : `${items.length} items, page ${page}/${totalPages}`}
    </div>
  ),
}));

const session = { isAuthenticated: true, userId: 'u_1' };

function mockSearchHook(overrides: Partial<ReturnType<typeof useSearchMedications>> = {}) {
  (useSearchMedications as any).mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  });
}

describe('MedicationsSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchHook();
  });

  it('renders nothing when not authenticated', () => {
    render(<MedicationsSearch session={null} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/rechercher/i)).not.toBeInTheDocument();
  });

  it('renders header and search input when authenticated', () => {
    render(<MedicationsSearch session={session} />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/rechercher un médicament/i)).toBeInTheDocument();
  });

  it('renders disclaimer banner', () => {
    render(<MedicationsSearch session={session} />);

    expect(screen.getByText(/informations affichées/i)).toBeInTheDocument();
  });

  it('calls useSearchMedications with correct params', () => {
    render(<MedicationsSearch session={session} />);

    expect(useSearchMedications).toHaveBeenCalledWith(
      expect.objectContaining({
        query: '',
        page: 1,
        limit: 12,
        enabled: true,
      })
    );
  });

  it('does not show results when query is less than 3 characters', () => {
    render(<MedicationsSearch session={session} />);

    expect(screen.queryByTestId('results-list')).not.toBeInTheDocument();
  });

  it('shows error state when query fails', () => {
    mockSearchHook({ error: new Error('Network error') as any });

    render(<MedicationsSearch session={session} />);

    expect(screen.getByText(/erreur lors de la recherche/i)).toBeInTheDocument();
    expect(screen.getByText(/réessayer/i)).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', async () => {
    const refetch = vi.fn();
    mockSearchHook({ error: new Error('fail') as any, refetch });

    render(<MedicationsSearch session={session} />);

    await userEvent.setup().click(screen.getByText(/réessayer/i));

    expect(refetch).toHaveBeenCalled();
  });

  it('updates search input on typing', async () => {
    const user = userEvent.setup();
    render(<MedicationsSearch session={session} />);

    const input = screen.getByPlaceholderText(/rechercher un médicament/i);
    await user.clear(input);
    await user.type(input, 'dol');

    expect(input).toHaveValue('dol');
  });

  it('passes enabled=false when not authenticated', () => {
    render(<MedicationsSearch session={null} />);

    expect(useSearchMedications).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});
