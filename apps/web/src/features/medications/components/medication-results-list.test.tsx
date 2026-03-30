/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { render } from '@/test/render';
import type { MedicationData } from './medication-card';
import MedicationResultsList from './medication-results-list';

vi.mock('./medication-card', () => ({
  default: ({ medication, onAdd }: any) => (
    <div data-testid={`card-${medication.cis}`}>
      {medication.name}
      {/** biome-ignore lint/a11y/useButtonType: pass */}
      <button onClick={() => onAdd(medication)}>Add</button>
    </div>
  ),
}));

vi.mock('./add-to-pillbox-dialog', () => ({
  default: ({ open, medication }: any) =>
    open ? <div data-testid="dialog">{medication?.name}</div> : null,
}));

const makeMed = (overrides: Partial<MedicationData> = {}): MedicationData => ({
  externalId: overrides.externalId ?? overrides.cis ?? '60234100',
  cis: '60234100',
  cip: null,
  name: 'Doliprane',
  shortLabel: 'Doliprane',
  form: 'comprimé',
  route: 'orale',
  activeSubstances: [],
  laboratory: null,
  reimbursementRate: null,
  price: null,
  status: 'Commercialisée',
  marketingStatus: null,
  source: 'api-medicaments-fr',
  normalizedForm: 'tablet',
  iconKey: 'tablet',
  ...overrides,
});

describe('MedicationResultsList', () => {
  const defaultProps = {
    items: [] as MedicationData[],
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    onLoadMore: vi.fn(),
  };

  it('shows loading skeletons when isLoading', () => {
    const { container } = render(<MedicationResultsList {...defaultProps} isLoading />);

    // Skeletons are rendered (6 skeleton divs)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no items', () => {
    render(<MedicationResultsList {...defaultProps} items={[]} />);

    expect(screen.getByText(/aucun médicament trouvé/i)).toBeInTheDocument();
  });

  it('renders medication cards', () => {
    const items = [makeMed({ cis: '111', name: 'Med A' }), makeMed({ cis: '222', name: 'Med B' })];

    render(<MedicationResultsList {...defaultProps} items={items} />);

    expect(screen.getByText('Med A')).toBeInTheDocument();
    expect(screen.getByText('Med B')).toBeInTheDocument();
  });

  it('opens dialog when add button is clicked', async () => {
    const items = [makeMed()];
    render(<MedicationResultsList {...defaultProps} items={items} />);

    await userEvent.setup().click(screen.getByText('Add'));

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog')).toHaveTextContent('Doliprane');
  });

  it('shows end of results when no next page', () => {
    render(<MedicationResultsList {...defaultProps} items={[makeMed()]} hasNextPage={false} />);

    expect(screen.getByText(/fin des résultats/i)).toBeInTheDocument();
  });

  it('shows loading indicator when fetching next page', () => {
    render(
      <MedicationResultsList
        {...defaultProps}
        items={[makeMed()]}
        hasNextPage
        isFetchingNextPage
      />,
    );

    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });
});
