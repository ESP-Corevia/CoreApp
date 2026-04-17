import { useQueryClient } from '@tanstack/react-query';
import AwsS3 from '@uppy/aws-s3';
import Uppy from '@uppy/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { trpcUnbatchedClient, useTrpc } from '@/providers/trpc';

type AllowedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const ALLOWED_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'confirmed' | 'error';
  error?: string;
}

export function useAdminUpload() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const trpc = useTrpc();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Maps Uppy file IDs to server document IDs — populated during getUploadParameters
  const fileDocumentIds = useRef(new Map<string, string>());

  const uppy = useMemo(() => {
    const instance = new Uppy({
      restrictions: {
        maxFileSize: MAX_FILE_SIZE,
        allowedFileTypes: ALLOWED_MIME_TYPES,
      },
      autoProceed: false,
    });

    instance.use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters: async file => {
        const meta = file.meta as { userId?: string };
        const mimeType = (file.type ?? '') as AllowedMimeType;
        const result = await trpcUnbatchedClient.admin.adminRequestUpload.mutate({
          userId: meta.userId ?? '',
          fileName: file.name ?? '',
          mimeType,
          fileSize: file.size ?? 0,
        });

        fileDocumentIds.current.set(file.id, result.documentId);

        return {
          method: 'PUT' as const,
          url: result.uploadUrl,
          headers: { 'Content-Type': file.type ?? '' },
        };
      },
    });

    return instance;
  }, []);

  // Track progress from Uppy events
  useEffect(() => {
    const onProgress = (progress: number) => {
      setOverallProgress(progress);
    };

    const onUploadProgress = (
      file: { id: string } | undefined,
      progress: { bytesUploaded: number; bytesTotal: number | null },
    ) => {
      if (!file) return;
      const pct = progress.bytesTotal
        ? Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
        : 0;
      setFiles(prev =>
        prev.map(f => (f.id === file.id ? { ...f, progress: pct, status: 'uploading' } : f)),
      );
    };

    const onUploadError = (file: { id: string } | undefined, error: Error) => {
      if (!file) return;
      setFiles(prev =>
        prev.map(f => (f.id === file.id ? { ...f, status: 'error', error: error.message } : f)),
      );
    };

    uppy.on('progress', onProgress);
    uppy.on('upload-progress', onUploadProgress);
    uppy.on('upload-error', onUploadError);

    return () => {
      uppy.off('progress', onProgress);
      uppy.off('upload-progress', onUploadProgress);
      uppy.off('upload-error', onUploadError);
    };
  }, [uppy]);

  useEffect(() => {
    return () => {
      uppy.clear();
    };
  }, [uppy]);

  const addFiles = useCallback(
    (selected: FileList) => {
      for (const file of Array.from(selected)) {
        try {
          const id = uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
            meta: { userId },
          });
          setFiles(prev => [
            ...prev,
            { id, name: file.name, size: file.size, progress: 0, status: 'pending' },
          ]);
        } catch (err) {
          toast.error(
            t('documents.fileAddError', 'Could not add {{name}}: {{error}}', {
              name: file.name,
              error: err instanceof Error ? err.message : 'Unknown error',
            }),
          );
        }
      }
    },
    [uppy, userId, t],
  );

  const removeFile = useCallback(
    (fileId: string) => {
      uppy.removeFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    },
    [uppy],
  );

  const startUpload = useCallback(async () => {
    if (!userId.trim() || files.length === 0) return;
    setIsUploading(true);
    setOverallProgress(0);

    for (const file of uppy.getFiles()) {
      uppy.setFileMeta(file.id, { userId });
    }

    try {
      const result = await uppy.upload();
      const successful = result?.successful ?? [];

      // Confirm each successfully uploaded file, then refresh the table
      for (const file of successful) {
        const documentId = fileDocumentIds.current.get(file.id);
        if (!documentId) continue;
        try {
          await trpcUnbatchedClient.admin.adminConfirmUpload.mutate({ documentId });
          setFiles(prev =>
            prev.map(f => (f.id === file.id ? { ...f, progress: 100, status: 'confirmed' } : f)),
          );
        } catch {
          setFiles(prev =>
            prev.map(f =>
              f.id === file.id ? { ...f, status: 'error', error: 'Failed to confirm' } : f,
            ),
          );
        }
        // Invalidate after each confirm so the table updates incrementally
        void queryClient.invalidateQueries(trpc.admin.adminListDocuments.queryFilter());
      }

      if (successful.length > 0) {
        toast.success(
          t('documents.uploadComplete', '{{count}} file(s) uploaded successfully', {
            count: successful.length,
          }),
        );
      }
    } catch {
      toast.error(t('documents.uploadFailed', 'Upload failed'));
    } finally {
      setIsUploading(false);
    }
  }, [uppy, userId, files.length, queryClient, trpc, t]);

  const reset = useCallback(() => {
    uppy.clear();
    fileDocumentIds.current.clear();
    setFiles([]);
    setUserId('');
    setOverallProgress(0);
  }, [uppy]);

  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    userId,
  );

  return {
    userId,
    setUserId,
    files,
    overallProgress,
    isUploading,
    isValidUuid,
    canUpload: isValidUuid && files.length > 0 && !isUploading,
    pendingCount: files.filter(f => f.status === 'pending' || f.status === 'uploading').length,
    fileInputRef,
    addFiles,
    removeFile,
    startUpload,
    reset,
  };
}
