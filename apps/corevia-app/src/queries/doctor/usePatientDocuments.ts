import { useMutation, useQuery } from '@tanstack/react-query';
import { trpcClient } from '@/providers/trpc';

export function useDoctorPatientDocuments(patientUserId: string | undefined) {
  return useQuery({
    queryKey: ['doctor', 'documents', patientUserId],
    queryFn: () => trpcClient.document.list.query({ userId: patientUserId }),
    enabled: !!patientUserId,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useDocumentDownload() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await trpcClient.document.getDownloadUrl.query({ documentId });
      return res;
    },
  });
}
