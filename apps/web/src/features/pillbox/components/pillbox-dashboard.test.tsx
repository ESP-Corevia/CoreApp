import { faker } from '@faker-js/faker';
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminPillboxList } from '@/queries';
import { render } from '@/test/render';

import PillboxDashboard from './pillbox-dashboard';

vi.mock('../../../queries', () => ({
  useAdminPillboxList: vi.fn(),
}));

vi.mock('./pillbox-medication-card', () => ({
  default: ({ medication }: any) => (
    <div data-testid={`med-${medication.id}`}>{medication.medicationName}</div>
  ),
}));

const fakeSession = { isAuthenticated: true, userId: faker.string.uuid() };

function mockHook(overrides: Record<string, unknown> = {}) {
  (useAdminPillboxList as any).mockReturnValue({
    data: undefined,
    isLoading: false,
    ...overrides,
  });
}

function makeMedication(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    medicationName: faker.commerce.productName(),
    ...overrides,
  };
}

describe('PillboxDashboard', () => {
  it('renders nothing when not authenticated', () => {
    mockHook();
    const { container } = render(<PillboxDashboard session={null} />);
    expect(container.querySelector('.space-y-6')).not.toBeInTheDocument();
  });

  it('shows loading skeletons', () => {
    mockHook({ data: undefined, isLoading: true });
    const { container } = render(<PillboxDashboard session={fakeSession} />);

    const skeletons = container.querySelectorAll('.h-36');
    expect(skeletons.length).toBe(6);
  });

  it('shows empty state when no treatments found', () => {
    mockHook({
      data: { items: [], total: 0, page: 1, limit: 12 },
      isLoading: false,
    });

    const { getByText } = render(<PillboxDashboard session={fakeSession} />);
    expect(getByText('Aucun traitement trouvé')).toBeInTheDocument();
  });

  it('renders medication cards', () => {
    const meds = [makeMedication(), makeMedication()];
    mockHook({
      data: { items: meds, total: 2, page: 1, limit: 12 },
      isLoading: false,
    });

    const { getByTestId, getByText } = render(<PillboxDashboard session={fakeSession} />);

    for (const med of meds) {
      expect(getByTestId(`med-${med.id}`)).toBeInTheDocument();
      expect(getByText(med.medicationName)).toBeInTheDocument();
    }
  });

  it('calls useAdminPillboxList with correct params', () => {
    mockHook({
      data: { items: [], total: 0, page: 1, limit: 12 },
      isLoading: false,
    });

    render(<PillboxDashboard session={fakeSession} />);

    expect(useAdminPillboxList).toHaveBeenCalledWith(
      expect.objectContaining({
        search: undefined,
        isActive: true,
        page: 1,
        limit: 12,
        enabled: true,
      }),
    );
  });

  it('shows results count', async () => {
    mockHook({
      data: {
        items: [makeMedication(), makeMedication(), makeMedication()],
        total: 3,
        page: 1,
        limit: 12,
      },
      isLoading: false,
    });

    const { getByText } = render(<PillboxDashboard session={fakeSession} />);

    await waitFor(() => {
      expect(getByText('3 traitement(s) trouvé(s)')).toBeInTheDocument();
    });
  });

  it('shows pagination when multiple pages', () => {
    const meds = Array.from({ length: 12 }, () => makeMedication());
    mockHook({
      data: { items: meds, total: 25, page: 1, limit: 12 },
      isLoading: false,
    });

    const { getByText } = render(<PillboxDashboard session={fakeSession} />);

    expect(getByText('Précédent')).toBeInTheDocument();
    expect(getByText('Suivant')).toBeInTheDocument();
    expect(getByText('Page 1 sur 3')).toBeInTheDocument();
  });
});
