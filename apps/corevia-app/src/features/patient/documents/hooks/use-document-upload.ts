import { useQueryClient } from '@tanstack/react-query';
import AwsS3 from '@uppy/aws-s3';
import Uppy from '@uppy/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpcUnbatchedClient } from '@/providers/trpc';
import { DOCUMENTS_QUERY_KEY } from '@/queries/patient/useDocuments';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'confirmed' | 'error';
  error?: string;
}

export function useDocumentUpload() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileDocumentIds = useRef(new Map<string, string>());

  const uppy = useMemo(() => {
    const instance = new Uppy({
      restrictions: {
        maxFileSize: MAX_FILE_SIZE,
        allowedFileTypes: [...ALLOWED_MIME_TYPES],
      },
      autoProceed: false,
    });

    instance.use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters: async file => {
        const mimeType = (file.type ?? '') as AllowedMimeType;
        const result = await trpcUnbatchedClient.document.requestUpload.mutate({
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

  useEffect(() => {
    const onProgress = (p: number) => setOverallProgress(p);
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
    (selected: FileList | File[]) => {
      for (const file of Array.from(selected)) {
        try {
          const id = uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
          });
          setFiles(prev => [
            ...prev,
            { id, name: file.name, size: file.size, progress: 0, status: 'pending' },
          ]);
        } catch (err) {
          toast.error(
            t('patient.documents.fileAddError', {
              defaultValue: 'Could not add {{name}}: {{error}}',
              name: file.name,
              error: err instanceof Error ? err.message : 'Unknown error',
            }),
          );
        }
      }
    },
    [uppy, t],
  );

  const removeFile = useCallback(
    (fileId: string) => {
      try {
        uppy.removeFile(fileId);
      } catch {
        // already removed
      }
      setFiles(prev => prev.filter(f => f.id !== fileId));
    },
    [uppy],
  );

  const startUpload = useCallback(async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setOverallProgress(0);

    try {
      const result = await uppy.upload();
      const successful = result?.successful ?? [];

      for (const file of successful) {
        const documentId = fileDocumentIds.current.get(file.id);
        if (!documentId) continue;
        try {
          await trpcUnbatchedClient.document.confirmUpload.mutate({ documentId });
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
        void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      }

      if (successful.length > 0) {
        toast.success(
          t('patient.documents.uploadComplete', {
            defaultValue: '{{count}} file(s) uploaded',
            count: successful.length,
          }),
        );
      }
    } catch {
      toast.error(t('patient.documents.uploadFailed', { defaultValue: 'Upload failed' }));
    } finally {
      setIsUploading(false);
    }
  }, [uppy, files.length, queryClient, t]);

  const reset = useCallback(() => {
    uppy.clear();
    fileDocumentIds.current.clear();
    setFiles([]);
    setOverallProgress(0);
  }, [uppy]);

  return {
    files,
    overallProgress,
    isUploading,
    canUpload: files.some(f => f.status === 'pending') && !isUploading,
    pendingCount: files.filter(f => f.status === 'pending' || f.status === 'uploading').length,
    addFiles,
    removeFile,
    startUpload,
    reset,
  };
}
