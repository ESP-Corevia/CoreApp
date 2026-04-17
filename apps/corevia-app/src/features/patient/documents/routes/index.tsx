import { useQueryClient } from '@tanstack/react-query';
import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Loader from '@/components/loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientOnboarded } from '@/hooks/use-patient-onboarded';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { cn } from '@/lib/utils';
import {
  DOCUMENTS_QUERY_KEY,
  useDeleteDocuments,
  useDocumentDownload,
  usePatientDocuments,
} from '@/queries/patient/useDocuments';
import { UploadDialog } from '../components/upload-dialog';

type Doc = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  createdAt: string | Date;
};

function iconForMime(mime: string): typeof FileText {
  if (mime.startsWith('image/')) return FileImage;
  if (mime === 'application/pdf') return FileType;
  if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv')
    return FileSpreadsheet;
  return FileText;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function triggerBrowserDownload(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener noreferrer';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function PatientDocuments() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { isLoading: authLoading } = useRequireAuth();
  const { isLoading: roleLoading } = useRoleGuard('patient');
  const { isLoading: onboardingLoading } = usePatientOnboarded();

  const listQuery = usePatientDocuments();
  const download = useDocumentDownload();
  const deleteDocs = useDeleteDocuments();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (authLoading || roleLoading || onboardingLoading) return <Loader />;

  const docs = ((listQuery.data ?? []) as Doc[]).filter(d => d.status === 'confirmed');
  const allSelected = docs.length > 0 && selected.size === docs.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected || someSelected) setSelected(new Set());
    else setSelected(new Set(docs.map(d => d.id)));
  };

  const handleDownload = async (doc: Doc) => {
    setDownloadingId(doc.id);
    try {
      const res = await download.mutateAsync(doc.id);
      triggerBrowserDownload(res.downloadUrl, res.fileName);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('patient.documents.downloadError', { defaultValue: 'Download failed' }),
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    await deleteDocs.mutateAsync(ids);
    setSelected(new Set());
    setConfirmOpen(false);
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
  };

  const isBusy = listQuery.isFetching;

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
            {t('patient.documents.section', { defaultValue: 'My records' })}
          </p>
          <h1 className="font-semibold text-lg tracking-tight md:text-xl">
            {t('patient.documents.title', { defaultValue: 'Documents' })}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('patient.documents.subtitle', {
              defaultValue: 'Upload and share files with your doctors.',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isBusy}
            aria-label={t('common.refresh', { defaultValue: 'Refresh' })}
            className="gap-2 text-muted-foreground"
          >
            <RefreshCw
              className={cn('size-4 transition-transform', isBusy && 'animate-spin')}
              aria-hidden="true"
            />
          </Button>
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            {t('patient.documents.upload', { defaultValue: 'Upload' })}
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div
          role="toolbar"
          aria-label={t('patient.documents.selectionToolbar', {
            defaultValue: 'Selection actions',
          })}
          className="sticky top-14 z-10 flex items-center justify-between gap-2 rounded-lg border bg-background/85 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70"
        >
          <span className="text-sm">
            {t('patient.documents.selectedN', {
              defaultValue: '{{n}} selected',
              n: selected.size,
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              {t('common.clear', { defaultValue: 'Clear' })}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteDocs.isPending}
              className="gap-2"
            >
              {deleteDocs.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              <Trash2 className="size-4" aria-hidden="true" />
              {t('common.delete', { defaultValue: 'Delete' })}
            </Button>
          </div>
        </div>
      )}

      {listQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="font-semibold text-destructive">
              {t('patient.documents.loadError', { defaultValue: 'Unable to load documents.' })}
            </p>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              {t('common.retry', { defaultValue: 'Retry' })}
            </Button>
          </CardContent>
        </Card>
      ) : docs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-full bg-primary/10"
            >
              <FileText className="size-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">
                {t('patient.documents.empty', { defaultValue: 'No documents yet' })}
              </p>
              <p className="text-muted-foreground text-sm">
                {t('patient.documents.emptyDescription', {
                  defaultValue: 'Upload your first file to share with your doctor.',
                })}
              </p>
            </div>
            <Button onClick={() => setUploadOpen(true)} size="sm" className="gap-2">
              <Plus className="size-4" aria-hidden="true" />
              {t('patient.documents.upload', { defaultValue: 'Upload' })}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
                aria-label={t('patient.documents.selectAll', { defaultValue: 'Select all' })}
                className="size-4 cursor-pointer rounded border-input accent-primary"
              />
              <span className="text-muted-foreground text-xs">
                {allSelected || someSelected
                  ? t('patient.documents.selectedN', {
                      defaultValue: '{{n}} selected',
                      n: selected.size,
                    })
                  : t('patient.documents.countN', {
                      defaultValue: '{{n}} document(s)',
                      n: docs.length,
                    })}
              </span>
            </div>
            <ul className="divide-y">
              {docs.map(doc => {
                const Icon = iconForMime(doc.mimeType);
                const isSelected = selected.has(doc.id);
                const busy = downloadingId === doc.id;
                const uploaded = new Intl.DateTimeFormat(i18n.language, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(doc.createdAt));
                return (
                  <li
                    key={doc.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors',
                      isSelected ? 'bg-primary/5' : 'hover:bg-accent/40',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(doc.id)}
                      aria-label={`Select ${doc.fileName}`}
                      className="size-4 cursor-pointer rounded border-input accent-primary"
                    />
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {formatBytes(doc.fileSize)} · {uploaded}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        void handleDownload(doc);
                      }}
                      aria-label={t('patient.documents.download', {
                        defaultValue: 'Download {{name}}',
                        name: doc.fileName,
                      })}
                      className="shrink-0 gap-1.5"
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="size-4" aria-hidden="true" />
                      )}
                      <span className="hidden sm:inline">
                        {t('common.download', { defaultValue: 'Download' })}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('patient.documents.confirmDeleteTitle', { defaultValue: 'Delete documents?' })}
            </DialogTitle>
            <DialogDescription>
              {t('patient.documents.confirmDeleteDescription', {
                defaultValue:
                  'This will permanently remove {{n}} document(s). This action cannot be undone.',
                n: selected.size,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteDocs.isPending}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleBulkDelete();
              }}
              disabled={deleteDocs.isPending}
              className="gap-2"
            >
              {deleteDocs.isPending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {t('common.delete', { defaultValue: 'Delete' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
