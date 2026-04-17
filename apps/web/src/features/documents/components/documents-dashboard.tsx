import { Upload } from 'lucide-react';
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useListDocuments } from '@/queries';

import { AdminUploadModal } from './admin-upload-modal';
import DocumentsTable from './documents-table';

export default function DocumentsDashboard({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    includeDeleted: parseAsBoolean.withDefault(false),
  });

  const [search, setSearch] = useState(queryParams.search);
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    data: documentsData,
    error,
    isLoading,
  } = useListDocuments({
    page: queryParams.page,
    perPage: queryParams.perPage,
    search: search || undefined,
    includeDeleted: queryParams.includeDeleted,
    enabled: !!session?.isAuthenticated,
  });

  useEffect(() => {
    if (error) {
      toast.error(
        t('documents.loadError', 'Failed to load documents: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }, [error, t]);

  const handleSearchChange = useCallback(
    async (value: string) => {
      setSearch(value);
      await setQueryParams({ page: 1, search: value });
    },
    [setQueryParams],
  );

  const handleIncludeDeletedChange = useCallback(
    async (checked: boolean) => {
      await setQueryParams({ page: 1, includeDeleted: checked });
    },
    [setQueryParams],
  );

  if (!session?.isAuthenticated) {
    return null;
  }

  const docRows = documentsData?.documents ?? [];
  const totalDocs = documentsData?.totalItems ?? 0;
  const pageCount = Math.ceil(totalDocs / queryParams.perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="include-deleted"
            checked={queryParams.includeDeleted}
            onCheckedChange={handleIncludeDeletedChange}
          />
          <Label htmlFor="include-deleted">{t('documents.showDeleted', 'Show deleted')}</Label>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          {t('documents.upload', 'Upload')}
        </Button>
      </div>
      <AdminUploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <DocumentsTable
        title={t('documents.title', 'Documents Management')}
        data={docRows}
        pageCount={pageCount}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        includeDeleted={queryParams.includeDeleted}
      />
    </div>
  );
}
