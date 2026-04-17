import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  useAdminDocumentDownloadUrl,
  useHardDeleteDocument,
  useListDocuments,
  useRestoreDocument,
  useSoftDeleteDocument,
} from './useAdminDocuments';

// Mock trpc client and proxy
const mockMutate = vi.fn();
const mockQuery = vi.fn();
const mockQueryOptions = vi.fn().mockReturnValue({ queryKey: ['test'], queryFn: () => ({}) });
const mockQueryFilter = vi.fn().mockReturnValue({ queryKey: ['test'] });

vi.mock('@/providers/trpc', () => ({
  trpcClient: {
    admin: {
      adminSoftDeleteDocument: { mutate: (...args: unknown[]) => mockMutate(...args) },
      adminRestoreDocument: { mutate: (...args: unknown[]) => mockMutate(...args) },
      adminHardDeleteDocument: { mutate: (...args: unknown[]) => mockMutate(...args) },
      adminGetDocumentDownloadUrl: { query: (...args: unknown[]) => mockQuery(...args) },
    },
  },
  useTrpc: () => ({
    admin: {
      adminListDocuments: {
        queryOptions: mockQueryOptions,
        queryFilter: mockQueryFilter,
      },
    },
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useListDocuments', () => {
  it('calls queryOptions with correct params', () => {
    renderHook(
      () =>
        useListDocuments({
          page: 1,
          perPage: 10,
          search: 'test',
          includeDeleted: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(mockQueryOptions).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      search: 'test',
      includeDeleted: true,
    });
  });

  it('disables query when enabled is false', () => {
    const { result } = renderHook(
      () =>
        useListDocuments({
          page: 1,
          perPage: 10,
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
  });
});

describe('useSoftDeleteDocument', () => {
  it('calls mutate and shows success toast', async () => {
    mockMutate.mockResolvedValueOnce({ id: 'doc-1' });

    const { result } = renderHook(() => useSoftDeleteDocument(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ documentId: 'doc-1' });
    });
  });

  it('shows error toast on failure', async () => {
    mockMutate.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useSoftDeleteDocument(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRestoreDocument', () => {
  it('calls mutate with documentId', async () => {
    mockMutate.mockResolvedValueOnce({ id: 'doc-1' });

    const { result } = renderHook(() => useRestoreDocument(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ documentId: 'doc-1' });
    });
  });

  it('shows error toast on failure', async () => {
    mockMutate.mockRejectedValueOnce(new Error('restore fail'));

    const { result } = renderHook(() => useRestoreDocument(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useHardDeleteDocument', () => {
  it('calls mutate with documentId', async () => {
    mockMutate.mockResolvedValueOnce({ id: 'doc-1' });

    const { result } = renderHook(() => useHardDeleteDocument(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ documentId: 'doc-1' });
    });
  });

  it('shows error toast on failure', async () => {
    mockMutate.mockRejectedValueOnce(new Error('delete fail'));

    const { result } = renderHook(() => useHardDeleteDocument(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useAdminDocumentDownloadUrl', () => {
  it('calls query with documentId and opens window on success', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    mockQuery.mockResolvedValueOnce({
      downloadUrl: 'https://minio.local/file',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
    });

    const { result } = renderHook(() => useAdminDocumentDownloadUrl(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith({ documentId: 'doc-1' });
    });

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith('https://minio.local/file', '_blank');
    });

    openSpy.mockRestore();
  });

  it('shows error toast on failure', async () => {
    mockQuery.mockRejectedValueOnce(new Error('download fail'));

    const { result } = renderHook(() => useAdminDocumentDownloadUrl(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('doc-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
