import {
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDocumentDownload, useDoctorPatientDocuments } from '@/queries/doctor';

interface Props {
  patientUserId: string | undefined;
}

type DocItem = {
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
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime === 'text/csv'
  )
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

export function PatientDocuments({ patientUserId }: Props) {
  const { t, i18n } = useTranslation();
  const listQuery = useDoctorPatientDocuments(patientUserId);
  const download = useDocumentDownload();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleDownload = async (doc: DocItem) => {
    setPendingId(doc.id);
    try {
      const res = await download.mutateAsync(doc.id);
      triggerBrowserDownload(res.downloadUrl, res.fileName);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t('doctor.appointments.documentDownloadError', {
              defaultValue: 'Unable to download document',
            }),
      );
    } finally {
      setPendingId(null);
    }
  };

  if (!patientUserId) return null;

  const docs = (listQuery.data ?? []) as DocItem[];
  const confirmed = docs.filter(d => d.status === 'confirmed');

  return (
    <Card>
      <CardContent className="space-y-3 p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
              {t('doctor.appointments.documents', { defaultValue: 'Patient documents' })}
            </h2>
          </div>
          {!listQuery.isLoading && confirmed.length > 0 && (
            <span className="text-muted-foreground text-xs tabular-nums">{confirmed.length}</span>
          )}
        </div>

        {listQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <p className="py-4 text-center text-destructive text-sm" role="alert">
            {t('doctor.appointments.documentsError', {
              defaultValue: 'Unable to load documents.',
            })}
          </p>
        ) : confirmed.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            {t('doctor.appointments.documentsEmpty', {
              defaultValue: 'The patient has not uploaded any documents yet.',
            })}
          </p>
        ) : (
          <ul className="space-y-2">
            {confirmed.map(doc => {
              const Icon = iconForMime(doc.mimeType);
              const busy = pendingId === doc.id;
              const uploaded = new Intl.DateTimeFormat(i18n.language, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date(doc.createdAt));
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                  >
                    <Icon className="size-5" />
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
                    aria-label={t('doctor.appointments.downloadDocument', {
                      defaultValue: 'Download {{name}}',
                      name: doc.fileName,
                    })}
                    className="shrink-0 gap-1.5"
                  >
                    {busy ? (
                      <Loader2 className={cn('size-4 animate-spin')} aria-hidden="true" />
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
        )}
      </CardContent>
    </Card>
  );
}
