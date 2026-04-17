import { Check, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ALLOWED_MIME_TYPES, type FileEntry, useDocumentUpload } from '../hooks/use-document-upload';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileRow({ file, onRemove }: { file: FileEntry; onRemove: (id: string) => void }) {
  const showProgress = file.status === 'uploading' || file.status === 'confirmed';
  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-sm" title={file.name}>
            {file.name}
          </span>
          <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
            {formatBytes(file.size)}
          </span>
        </div>
        {showProgress && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={file.progress}
            className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-200 ease-out',
                file.status === 'confirmed' ? 'bg-emerald-500' : 'bg-primary',
              )}
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        {file.status === 'error' && file.error && (
          <p className="mt-1 text-destructive text-xs">{file.error}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        {file.status === 'confirmed' && (
          <Check className="size-4 text-emerald-600 dark:text-emerald-500" aria-hidden="true" />
        )}
        {file.status === 'uploading' && (
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
        )}
        {file.status === 'error' && <X className="size-4 text-destructive" aria-hidden="true" />}
        {file.status === 'pending' && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onRemove(file.id)}
            aria-label={`Remove ${file.name}`}
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function UploadDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const {
    files,
    overallProgress,
    isUploading,
    canUpload,
    pendingCount,
    addFiles,
    removeFile,
    startUpload,
    reset,
  } = useDocumentUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const closeIfDone = () => {
    if (!isUploading) onOpenChange(false);
  };

  const allDone =
    files.length > 0 && files.every(f => f.status === 'confirmed' || f.status === 'error');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('patient.documents.uploadTitle', { defaultValue: 'Upload documents' })}
          </DialogTitle>
          <DialogDescription>
            {t('patient.documents.uploadDescription', {
              defaultValue: 'PDF, Word, JPEG, PNG or WEBP up to 25 MB each.',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/60 hover:bg-accent/40',
              isUploading && 'pointer-events-none opacity-60',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES.join(',')}
              className="sr-only"
              onChange={e => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
              disabled={isUploading}
            />
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Upload className="size-5" />
            </span>
            <span className="font-medium text-sm">
              {t('patient.documents.uploadCta', {
                defaultValue: 'Click or drag files here',
              })}
            </span>
            <span className="text-muted-foreground text-xs">
              {t('patient.documents.uploadHint', {
                defaultValue: 'You can select multiple files at once',
              })}
            </span>
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {files.map(f => (
                  <FileRow key={f.id} file={f} onRemove={removeFile} />
                ))}
              </div>

              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>
                      {t('patient.documents.uploadingN', {
                        defaultValue: 'Uploading {{count}}',
                        count: pendingCount,
                      })}
                    </span>
                    <span className="tabular-nums">{overallProgress}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={overallProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={closeIfDone} disabled={isUploading}>
            {allDone
              ? t('common.done', { defaultValue: 'Done' })
              : t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="button"
            onClick={() => {
              void startUpload();
            }}
            disabled={!canUpload}
            className="gap-2"
          >
            {isUploading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {t('patient.documents.uploadButton', { defaultValue: 'Upload' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
