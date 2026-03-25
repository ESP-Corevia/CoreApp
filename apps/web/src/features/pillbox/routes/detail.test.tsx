/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { render } from '@/test/render';

import PillboxDetailRoute from './detail';

// ─── Mocks ───────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockNavigate = vi.fn();
let mockParams: Record<string, string> = { id: 'med_1' };

vi.mock('react-router', async importOriginal => {
  const original = await importOriginal<typeof import('react-router')>();
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const mockSession = { isAuthenticated: true, role: 'admin' };
let mockAuthLoading = false;

vi.mock('@/hooks/use-require-auth', () => ({
  useRequireAuth: () => ({
    session: mockAuthLoading ? null : mockSession,
    isLoading: mockAuthLoading,
    isAuthorized: !mockAuthLoading,
  }),
}));

let mockDetailData: any = null;
let mockDetailLoading = false;
let mockDetailError: Error | null = null;

const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('@/queries', () => ({
  usePillboxDetail: () => ({
    data: mockDetailData,
    isLoading: mockDetailLoading,
    error: mockDetailError,
  }),
  useAdminUpdateMedication: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useAdminDeleteMedication: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

vi.mock('../components/schedule-editor', () => ({
  default: ({ medicationId }: { medicationId: string }) => (
    <div data-testid="schedule-editor">{medicationId}</div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────

const fakeMedication = {
  id: 'med_1',
  patientId: 'u_1',
  medicationName: 'Doliprane 500mg',
  medicationForm: 'comprimé',
  dosageLabel: '500mg',
  instructions: 'Prendre au cours du repas',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  isActive: true,
  patientName: 'Jean Dupont',
  patientEmail: 'jean@test.com',
  schedules: [
    {
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
      intakeMoment: 'MORNING',
      quantity: '1',
      unit: 'comprimé',
      notes: null,
    },
  ],
};

function renderDetail() {
  return render(<PillboxDetailRoute />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockParams = { id: 'med_1' };
  mockAuthLoading = false;
  mockDetailData = fakeMedication;
  mockDetailLoading = false;
  mockDetailError = null;
});

// ─── Tests ───────────────────────────────────────────────────

describe('PillboxDetailRoute', () => {
  describe('loading states', () => {
    it('shows loader when auth is loading', () => {
      mockAuthLoading = true;
      renderDetail();
      // Loader component renders a dialog/overlay — check it doesn't show medication content
      expect(screen.queryByText('Doliprane 500mg')).not.toBeInTheDocument();
    });

    it('shows skeleton when detail is loading', () => {
      mockDetailLoading = true;
      mockDetailData = null;
      renderDetail();
      // Skeletons are rendered — no medication name should appear
      expect(screen.queryByText('Doliprane 500mg')).not.toBeInTheDocument();
    });

    it('shows error state when detail fetch fails', () => {
      mockDetailError = new Error('Server error');
      mockDetailData = null;
      renderDetail();
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });

    it('shows not-found state when medication is null', () => {
      mockDetailData = null;
      renderDetail();
      expect(screen.getByText(/Traitement introuvable/i)).toBeInTheDocument();
    });
  });

  describe('medication display', () => {
    it('renders medication name and form', () => {
      renderDetail();
      expect(screen.getByText('Doliprane 500mg')).toBeInTheDocument();
      expect(screen.getByText('comprimé')).toBeInTheDocument();
    });

    it('shows active badge', () => {
      renderDetail();
      expect(screen.getByText('Actif')).toBeInTheDocument();
    });

    it('shows inactive badge when medication is inactive', () => {
      mockDetailData = { ...fakeMedication, isActive: false };
      renderDetail();
      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });

    it('renders patient info card', () => {
      renderDetail();
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('jean@test.com')).toBeInTheDocument();
    });

    it('hides patient card when patientName is null', () => {
      mockDetailData = { ...fakeMedication, patientName: null, patientEmail: null };
      renderDetail();
      expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument();
    });

    it('renders dosage and instructions', () => {
      renderDetail();
      expect(screen.getByText('500mg')).toBeInTheDocument();
      expect(screen.getByText('Prendre au cours du repas')).toBeInTheDocument();
    });

    it('renders start and end dates', () => {
      renderDetail();
      expect(screen.getByText(/1 janvier 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/31 décembre 2025/i)).toBeInTheDocument();
    });

    it('hides end date when null', () => {
      mockDetailData = { ...fakeMedication, endDate: null };
      renderDetail();
      expect(screen.queryByText(/Date de fin/)).not.toBeInTheDocument();
    });

    it('renders schedule editor with medication id', () => {
      renderDetail();
      expect(screen.getByTestId('schedule-editor')).toHaveTextContent('med_1');
    });
  });

  describe('edit mode', () => {
    it('enters edit mode when clicking edit button', async () => {
      const user = userEvent.setup();
      renderDetail();

      await user.click(screen.getByText('Modifier'));

      expect(screen.getByText('Annuler')).toBeInTheDocument();
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    });

    it('cancels edit mode', async () => {
      const user = userEvent.setup();
      renderDetail();

      await user.click(screen.getByText('Modifier'));
      await user.click(screen.getByText('Annuler'));

      expect(screen.getByText('Modifier')).toBeInTheDocument();
    });

    it('submits form and calls update mutation', async () => {
      const user = userEvent.setup();
      mockUpdateMutateAsync.mockResolvedValue({});
      renderDetail();

      await user.click(screen.getByText('Modifier'));
      await user.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'med_1' }),
        );
      });
    });
  });

  describe('delete', () => {
    it('shows delete confirmation dialog', async () => {
      const user = userEvent.setup();
      renderDetail();

      await user.click(screen.getByText('Supprimer'));

      expect(screen.getByText('Supprimer ce traitement ?')).toBeInTheDocument();
    });

    it('calls delete mutation on confirm', async () => {
      const user = userEvent.setup();
      mockDeleteMutate.mockImplementation((_input: any, opts: any) => {
        opts?.onSuccess?.();
      });
      renderDetail();

      await user.click(screen.getByText('Supprimer'));
      // Click the confirm button in the dialog
      const confirmButtons = screen.getAllByText('Supprimer');
      await user.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockDeleteMutate).toHaveBeenCalledWith(
          { id: 'med_1' },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
      });
    });
  });

  describe('navigation', () => {
    it('navigates back when clicking back button on error state', async () => {
      const user = userEvent.setup();
      mockDetailError = new Error('fail');
      mockDetailData = null;
      renderDetail();

      await user.click(screen.getByText('Retour au pilulier'));

      expect(mockNavigate).toHaveBeenCalledWith('/pillbox');
    });

    it('navigates back when clicking back button on not-found state', async () => {
      const user = userEvent.setup();
      mockDetailData = null;
      renderDetail();

      await user.click(screen.getByText('Retour au pilulier'));

      expect(mockNavigate).toHaveBeenCalledWith('/pillbox');
    });
  });
});
