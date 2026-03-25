import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

export function useAdminPillboxList(params: {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  enabled?: boolean;
}) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.pillbox.adminListAll.queryOptions({
      search: params.search,
      isActive: params.isActive,
      page: params.page,
      limit: params.limit,
    }),
    enabled: params.enabled ?? true,
  });
}

export function usePillboxDetail(id: string, enabled = true) {
  const trpc = useTrpc();

  return useQuery({
    ...trpc.pillbox.detail.queryOptions({ id }),
    enabled: enabled && !!id,
  });
}
interface UseAddScheduleParams {
  patientMedicationId: string;
  weekday?: number | null;
  intakeTime: string;
  intakeMoment?: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
  quantity?: string;
  unit?: string | null;
  notes?: string | null;
}
export function useAddSchedule() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: UseAddScheduleParams) => {
      return trpcClient.pillbox.addSchedule.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('pillbox.scheduleAdded', 'Rappel ajouté avec succès'));
      void queryClient.invalidateQueries(trpc.pillbox.detail.queryFilter());
    },
    onError: error => {
      toast.error(
        t('pillbox.scheduleAddError', "Erreur lors de l'ajout du rappel : {{message}}", {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        }),
      );
    },
  });
}
interface UseUpdateScheduleParams {
  id: string;
  weekday?: number | null;
  intakeTime?: string;
  intakeMoment?: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
  quantity?: string;
  unit?: string | null;
  notes?: string | null;
}
export function useUpdateSchedule() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: UseUpdateScheduleParams) => {
      return trpcClient.pillbox.updateSchedule.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('pillbox.scheduleUpdated', 'Rappel mis à jour avec succès'));
      void queryClient.invalidateQueries(trpc.pillbox.detail.queryFilter());
    },
    onError: error => {
      toast.error(
        t('pillbox.scheduleUpdateError', 'Erreur lors de la mise à jour du rappel : {{message}}', {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        }),
      );
    },
  });
}

export function useDeleteSchedule() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { id: string }) => {
      return trpcClient.pillbox.deleteSchedule.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('pillbox.scheduleDeleted', 'Rappel supprimé avec succès'));
      void queryClient.invalidateQueries(trpc.pillbox.detail.queryFilter());
    },
    onError: error => {
      toast.error(
        t('pillbox.scheduleDeleteError', 'Erreur lors de la suppression du rappel : {{message}}', {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        }),
      );
    },
  });
}
interface UseAdminCreateMedicationParams {
  patientId: string;
  medicationExternalId?: string | null;
  source?: string;
  cis?: string | null;
  cip?: string | null;
  medicationName: string;
  medicationForm?: string | null;
  activeSubstances?: string[] | null;
  dosageLabel?: string | null;
  instructions?: string | null;
  startDate: string;
  endDate?: string | null;
  schedules: {
    weekday?: number | null;
    intakeTime: string;
    intakeMoment?: 'MORNING' | 'NOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
    quantity?: string;
    unit?: string | null;
    notes?: string | null;
  }[];
}
export function useAdminUpdateMedication() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: {
      id: string;
      dosageLabel?: string | null;
      instructions?: string | null;
      startDate?: string;
      endDate?: string | null;
      isActive?: boolean;
    }) => {
      return trpcClient.pillbox.adminUpdateMedication.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('pillbox.medicationUpdated', 'Traitement mis à jour'));
      void queryClient.invalidateQueries(trpc.pillbox.adminListAll.queryFilter());
      void queryClient.invalidateQueries(trpc.pillbox.detail.queryFilter());
    },
    onError: error => {
      toast.error(
        t('pillbox.medicationUpdateError', 'Erreur lors de la mise à jour : {{message}}', {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        }),
      );
    },
  });
}

export function useAdminDeleteMedication() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: { id: string }) => {
      return trpcClient.pillbox.adminDeleteMedication.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('pillbox.medicationDeleted', 'Traitement supprimé'));
      void queryClient.invalidateQueries(trpc.pillbox.adminListAll.queryFilter());
    },
    onError: error => {
      toast.error(
        t('pillbox.medicationDeleteError', 'Erreur lors de la suppression : {{message}}', {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        }),
      );
    },
  });
}

export function useAdminCreateMedication() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: UseAdminCreateMedicationParams) => {
      return trpcClient.pillbox.adminCreateMedication.mutate(input);
    },
    onSuccess: () => {
      toast.success(t('pillbox.medicationCreated', 'Médicament ajouté au pilulier avec succès'));
      void queryClient.invalidateQueries(trpc.pillbox.adminListAll.queryFilter());
    },
    onError: error => {
      toast.error(
        t('pillbox.medicationCreateError', "Erreur lors de l'ajout : {{message}}", {
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        }),
      );
    },
  });
}
