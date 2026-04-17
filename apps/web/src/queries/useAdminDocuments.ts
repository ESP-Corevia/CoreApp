import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcClient, useTrpc } from '@/providers/trpc';

interface UseListDocumentsParams {
  page: number;
  perPage: number;
  search?: string;
  includeDeleted?: boolean;
  enabled?: boolean;
}

export function useListDocuments({
  page,
  perPage,
  search,
  includeDeleted,
  enabled = true,
}: UseListDocumentsParams) {
  const trpc = useTrpc();
  return useQuery({
    ...trpc.admin.adminListDocuments.queryOptions({ page, perPage, search, includeDeleted }),
    enabled,
  });
}

export function useSoftDeleteDocument() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (documentId: string) => {
      return trpcClient.admin.adminSoftDeleteDocument.mutate({ documentId });
    },
    onSuccess: () => {
      toast.success(t('documents.softDeleted', 'Document soft-deleted successfully'));
      void queryClient.invalidateQueries(trpc.admin.adminListDocuments.queryFilter());
    },
    onError: error => {
      toast.error(
        t('documents.softDeleteError', 'Failed to soft-delete document: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}

export function useRestoreDocument() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (documentId: string) => {
      return trpcClient.admin.adminRestoreDocument.mutate({ documentId });
    },
    onSuccess: () => {
      toast.success(t('documents.restored', 'Document restored successfully'));
      void queryClient.invalidateQueries(trpc.admin.adminListDocuments.queryFilter());
    },
    onError: error => {
      toast.error(
        t('documents.restoreError', 'Failed to restore document: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}

export function useHardDeleteDocument() {
  const trpc = useTrpc();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (documentId: string) => {
      return trpcClient.admin.adminHardDeleteDocument.mutate({ documentId });
    },
    onSuccess: () => {
      toast.success(t('documents.hardDeleted', 'Document permanently deleted'));
      void queryClient.invalidateQueries(trpc.admin.adminListDocuments.queryFilter());
    },
    onError: error => {
      toast.error(
        t('documents.hardDeleteError', 'Failed to delete document: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}

export function useAdminDocumentDownloadUrl() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (documentId: string) => {
      return trpcClient.admin.adminGetDocumentDownloadUrl.query({ documentId });
    },
    onSuccess: data => {
      window.open(data.downloadUrl, '_blank');
    },
    onError: error => {
      toast.error(
        t('documents.downloadError', 'Failed to get download URL: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    },
  });
}
