/**
 * In-memory replacement for `src/lib/storage`.
 *
 * S3/MinIO is the only external dependency of the document journey, so it is faked here: the
 * document rows, presigned-URL contract and confirmation rules stay under test while nothing
 * leaves the process. `uploadedKeys` lets a spec simulate the browser PUT that normally follows
 * a presigned upload URL.
 */
export const uploadedKeys = new Set<string>();

export const s3Client = {};

export const createStorageService = () => ({
  ensureBucket: async (): Promise<void> => {
    // nothing to create in memory
  },

  generateUploadUrl: async (fileKey: string, mimeType: string): Promise<string> => {
    return `https://storage.test/upload/${encodeURIComponent(fileKey)}?type=${encodeURIComponent(mimeType)}`;
  },

  generateDownloadUrl: async (fileKey: string): Promise<string> => {
    return `https://storage.test/download/${encodeURIComponent(fileKey)}`;
  },

  objectExists: async (fileKey: string): Promise<boolean> => {
    return uploadedKeys.has(fileKey);
  },

  deleteObject: async (fileKey: string): Promise<void> => {
    uploadedKeys.delete(fileKey);
  },
});
