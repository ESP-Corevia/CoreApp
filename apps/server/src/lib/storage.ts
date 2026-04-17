import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '../env';
import { logger } from './logger';

const PRESIGNED_URL_EXPIRY = 900; // 15 minutes in seconds

export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export const createStorageService = (client: S3Client = s3Client) => ({
  /**
   * Ensures the configured bucket exists, creating it if necessary.
   */
  ensureBucket: async (): Promise<void> => {
    try {
      await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET_NAME }));
      logger.info({ bucket: env.S3_BUCKET_NAME }, 'S3 bucket exists');
    } catch {
      logger.info({ bucket: env.S3_BUCKET_NAME }, 'Creating S3 bucket');
      await client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET_NAME }));
      logger.info({ bucket: env.S3_BUCKET_NAME }, 'S3 bucket created');
    }
  },

  /**
   * Generates a presigned PUT URL for uploading a file.
   */
  generateUploadUrl: async (
    fileKey: string,
    mimeType: string,
    _fileSize: number,
  ): Promise<string> => {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
    });
    return getSignedUrl(client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
      signableHeaders: new Set(['content-type', 'host']),
    });
  },

  /**
   * Generates a presigned GET URL for downloading a file.
   */
  generateDownloadUrl: async (fileKey: string): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: fileKey,
    });
    return getSignedUrl(client, command, { expiresIn: PRESIGNED_URL_EXPIRY });
  },

  /**
   * Checks whether an object exists in S3.
   */
  objectExists: async (fileKey: string): Promise<boolean> => {
    try {
      await client.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: fileKey }));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Deletes an object from S3.
   */
  deleteObject: async (fileKey: string): Promise<void> => {
    await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: fileKey }));
  },
});

export type StorageService = ReturnType<typeof createStorageService>;
