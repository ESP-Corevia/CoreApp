import { Download, MoreHorizontal, RotateCcw, Trash, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useAdminDocumentDownloadUrl,
  useHardDeleteDocument,
  useRestoreDocument,
  useSoftDeleteDocument,
} from '@/queries';

import type { AdminDocument } from './documents-table';

export function DocumentActionsMenu({ document }: { document: AdminDocument }) {
  const { t } = useTranslation();
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);

  const downloadMutation = useAdminDocumentDownloadUrl();
  const softDeleteMutation = useSoftDeleteDocument();
  const restoreMutation = useRestoreDocument();
  const hardDeleteMutation = useHardDeleteDocument();

  const isDeleted = !!document.deletedAt;

  return (
    <AlertDialog open={hardDeleteOpen} onOpenChange={setHardDeleteOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => downloadMutation.mutate(document.id)}
            disabled={downloadMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('documents.download', 'Download')}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {!isDeleted && (
            <DropdownMenuItem
              onClick={() => softDeleteMutation.mutate(document.id)}
              disabled={softDeleteMutation.isPending}
            >
              <Trash className="mr-2 h-4 w-4" />
              {t('documents.softDelete', 'Soft Delete')}
            </DropdownMenuItem>
          )}

          {isDeleted && (
            <DropdownMenuItem
              onClick={() => restoreMutation.mutate(document.id)}
              disabled={restoreMutation.isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('documents.restore', 'Restore')}
            </DropdownMenuItem>
          )}

          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('documents.hardDelete', 'Permanently Delete')}
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('documents.hardDeleteTitle', 'Permanently delete this document?')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'documents.hardDeleteDescription',
              'This will permanently remove the file from storage and cannot be undone. Document: {{fileName}}',
              { fileName: document.fileName },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              hardDeleteMutation.mutate(document.id);
              setHardDeleteOpen(false);
            }}
          >
            {t('documents.confirmHardDelete', 'Delete Permanently')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
