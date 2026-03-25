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
  externalId: '60234100',
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
    page: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
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

  it('shows pagination when totalPages > 1', () => {
    render(<MedicationResultsList {...defaultProps} items={[makeMed()]} page={1} totalPages={3} />);

    expect(screen.getByText(/page 1 sur 3/i)).toBeInTheDocument();
  });

  it('hides pagination when totalPages is 1', () => {
    render(<MedicationResultsList {...defaultProps} items={[makeMed()]} page={1} totalPages={1} />);

    expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
  });

  it('calls onPageChange when next is clicked', async () => {
    const onPageChange = vi.fn();
    render(
      <MedicationResultsList
        {...defaultProps}
        items={[makeMed()]}
        page={1}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );

    await userEvent.setup().click(screen.getByText(/suivant/i));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    render(<MedicationResultsList {...defaultProps} items={[makeMed()]} page={1} totalPages={3} />);

    expect(screen.getByText(/précédent/i).closest('button')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<MedicationResultsList {...defaultProps} items={[makeMed()]} page={3} totalPages={3} />);

    expect(screen.getByText(/suivant/i).closest('button')).toBeDisabled();
  });
});
