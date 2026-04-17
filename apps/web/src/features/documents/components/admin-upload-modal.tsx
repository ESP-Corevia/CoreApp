import { FileUp, Loader2, Upload } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { ALLOWED_MIME_TYPES, useAdminUpload } from '../hooks/use-admin-upload';
import { UploadFileItem } from './upload-file-item';

export function AdminUploadModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const {
    userId,
    setUserId,
    files,
    overallProgress,
    isUploading,
    isValidUuid,
    canUpload,
    pendingCount,
    fileInputRef,
    addFiles,
    removeFile,
    startUpload,
    reset,
  } = useAdminUpload();

  const handleClose = () => {
    if (isUploading) return;
    reset();
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('documents.uploadTitle', 'Upload Documents')}</DialogTitle>
          <DialogDescription>
            {t(
              'documents.uploadDescription',
              'Upload files on behalf of a user. Enter their user ID and select files.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upload-user-id">{t('documents.userId', 'User ID')}</Label>
            <Input
              id="upload-user-id"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              disabled={isUploading}
            />
            {userId && !isValidUuid && (
              <p className="text-destructive text-xs">
                {t('documents.invalidUuid', 'Please enter a valid UUID')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('documents.selectFiles', 'Files')}</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || !isValidUuid}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !isValidUuid}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {t('documents.selectFilesButton', 'Select Files')}
            </Button>
          </div>

          {files.length > 0 && (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {files.map(file => (
                <UploadFileItem key={file.id} file={file} onRemove={removeFile} />
              ))}
            </div>
          )}

          {isUploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{t('documents.uploading', 'Uploading...')}</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={startUpload} disabled={!canUpload}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('documents.uploading', 'Uploading...')}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t('documents.uploadButton', 'Upload {{count}} file(s)', {
                  count: pendingCount,
                })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
