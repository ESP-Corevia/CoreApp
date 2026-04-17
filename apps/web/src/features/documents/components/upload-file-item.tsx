import { Check, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import type { FileEntry } from '../hooks/use-admin-upload';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadFileItem({
  file,
  onRemove,
}: {
  file: FileEntry;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="max-w-[200px] truncate font-medium text-sm" title={file.name}>
            {file.name}
          </span>
          <span className="text-muted-foreground text-xs">{formatFileSize(file.size)}</span>
        </div>
        {(file.status === 'uploading' || file.status === 'confirmed') && (
          <Progress value={file.progress} className="mt-1 h-1.5" />
        )}
        {file.status === 'error' && <p className="mt-1 text-destructive text-xs">{file.error}</p>}
      </div>
      <div className="flex shrink-0 items-center">
        {file.status === 'confirmed' && <Check className="h-4 w-4 text-green-500" />}
        {file.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
        {file.status === 'error' && <X className="h-4 w-4 text-destructive" />}
        {file.status === 'pending' && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(file.id)}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
