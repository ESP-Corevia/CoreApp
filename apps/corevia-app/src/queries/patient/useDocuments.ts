import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trpcClient } from '@/providers/trpc';

const QUERY_KEY = ['patient', 'documents'] as const;

export function usePatientDocuments() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => trpcClient.document.list.query({}),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useDocumentDownload() {
  return useMutation({
    mutationFn: (documentId: string) =>
      trpcClient.document.getDownloadUrl.query({ documentId }),
  });
}

export function useDeleteDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentIds: string[]) => {
      const results = await Promise.allSettled(
        documentIds.map(id => trpcClient.document.delete.mutate({ documentId: id })),
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      return { total: documentIds.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      if (failed === 0) {
        toast.success(
          total === 1 ? 'Document deleted' : `${total} documents deleted`,
        );
      } else if (failed < total) {
        toast.warning(`Deleted ${total - failed} of ${total} (${failed} failed)`);
      } else {
        toast.error('Failed to delete documents');
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export const DOCUMENTS_QUERY_KEY = QUERY_KEY;
