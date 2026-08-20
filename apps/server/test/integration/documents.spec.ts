import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { documents } from '../../src/db/schema';
import { db } from '../db';
import {
  createAdminUser,
  createDoctorUser,
  createIntegrationApp,
  createPatientUser,
  resetIntegrationDb,
  type TestUser,
  trpcData,
  trpcError,
  trpcMutate,
  trpcQuery,
} from './harness';
import { uploadedKeys } from './storage.mock';

// `vi.mock` is hoisted above these imports, so every module below resolves the
// database through the PGlite double and object storage through the in-memory double.
vi.mock('../../src/db', () => import('./db.mock'));
vi.mock('../../src/lib/storage', () => import('./storage.mock'));

interface UploadTicket {
  documentId: string;
  uploadUrl: string;
}

interface Document {
  id: string;
  userId: string;
  fileName: string;
  status: string;
}

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

/**
 * Journey: a patient uploads a medical document, confirms it, downloads it and deletes it.
 *
 * Object storage is the only faked dependency; the presigned-URL protocol, the document rows and
 * the confirmation rules are exercised for real.
 */
describe('integration: medical document journey', () => {
  let app: FastifyInstance;
  let patient: TestUser;

  beforeAll(async () => {
    app = await createIntegrationApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetIntegrationDb();
    uploadedKeys.clear();
    patient = await createPatientUser(app);
  });

  function requestUpload(
    user: TestUser,
    overrides: Partial<{ fileName: string; mimeType: string; fileSize: number }> = {},
  ) {
    return trpcMutate(
      app,
      'document.requestUpload',
      {
        fileName: overrides.fileName ?? 'analysis.pdf',
        mimeType: overrides.mimeType ?? 'application/pdf',
        fileSize: overrides.fileSize ?? 12_345,
      },
      user.cookie,
    );
  }

  /** Simulates the browser PUT to the presigned URL. */
  async function putToStorage(documentId: string): Promise<void> {
    const [row] = await db
      .select({ fileKey: documents.fileKey })
      .from(documents)
      .where(eq(documents.id, documentId));
    uploadedKeys.add(row.fileKey);
  }

  /** Full happy path: request an upload, push the file to storage, confirm the document. */
  async function uploadConfirmed(
    user: TestUser,
    overrides: Partial<{ fileName: string }> = {},
  ): Promise<string> {
    const ticket = trpcData<UploadTicket>(await requestUpload(user, overrides));
    await putToStorage(ticket.documentId);
    await trpcMutate(app, 'document.confirmUpload', { documentId: ticket.documentId }, user.cookie);
    return ticket.documentId;
  }

  describe('requesting an upload', () => {
    it('creates a pending document and returns a presigned URL', async () => {
      const res = await requestUpload(patient);

      expect(res.statusCode).toBe(200);
      const ticket = trpcData<UploadTicket>(res);
      expect(ticket.documentId).toMatch(/^[0-9a-f-]{36}$/);
      expect(ticket.uploadUrl).toContain('https://storage.test/upload/');
    });

    it('keeps a document that was never confirmed out of the patient list', async () => {
      await requestUpload(patient);

      const res = await trpcQuery(app, 'document.list', {}, patient.cookie);

      expect(trpcData<Document[]>(res)).toEqual([]);
    });

    it('rejects a mime type that is not allowed', async () => {
      const res = await requestUpload(patient, { mimeType: 'application/x-msdownload' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects a file larger than 25 MB', async () => {
      const res = await requestUpload(patient, { fileSize: 26 * 1024 * 1024 });

      expect(res.statusCode).toBe(400);
    });

    it('rejects a file size of zero', async () => {
      const res = await requestUpload(patient, { fileSize: 0 });

      expect(res.statusCode).toBe(400);
    });

    it('rejects an empty file name', async () => {
      const res = await requestUpload(patient, { fileName: '' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects an unauthenticated upload request', async () => {
      const res = await trpcMutate(app, 'document.requestUpload', {
        fileName: 'analysis.pdf',
        mimeType: 'application/pdf',
        fileSize: 10,
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('confirming an upload', () => {
    it('confirms the document once the file reached storage', async () => {
      const ticket = trpcData<UploadTicket>(await requestUpload(patient));
      await putToStorage(ticket.documentId);

      const res = await trpcMutate(
        app,
        'document.confirmUpload',
        { documentId: ticket.documentId },
        patient.cookie,
      );

      expect(res.statusCode).toBe(200);
      expect(trpcData<Document>(res).status).toBe('confirmed');
    });

    it('refuses to confirm a document whose file was never uploaded', async () => {
      const ticket = trpcData<UploadTicket>(await requestUpload(patient));

      const res = await trpcMutate(
        app,
        'document.confirmUpload',
        { documentId: ticket.documentId },
        patient.cookie,
      );

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toBe('File has not been uploaded to storage');
    });

    it('refuses to confirm a document owned by another patient', async () => {
      const ticket = trpcData<UploadTicket>(await requestUpload(patient));
      await putToStorage(ticket.documentId);
      const other = await createPatientUser(app);

      const res = await trpcMutate(
        app,
        'document.confirmUpload',
        { documentId: ticket.documentId },
        other.cookie,
      );

      expect(res.statusCode).toBe(404);
      expect(trpcError(res).message).toBe('Document not found');
    });

    it('reports NOT_FOUND for an unknown document', async () => {
      const res = await trpcMutate(
        app,
        'document.confirmUpload',
        { documentId: UNKNOWN_UUID },
        patient.cookie,
      );

      expect(res.statusCode).toBe(404);
    });
  });

  describe('downloading', () => {
    it('returns a presigned download URL to the owner', async () => {
      const documentId = await uploadConfirmed(patient);

      const res = await trpcQuery(app, 'document.getDownloadUrl', { documentId }, patient.cookie);

      expect(trpcData<{ downloadUrl: string; fileName: string }>(res)).toMatchObject({
        fileName: 'analysis.pdf',
        downloadUrl: expect.stringContaining('https://storage.test/download/'),
      });
    });

    it('refuses to hand out a URL for a document that is still pending', async () => {
      const ticket = trpcData<UploadTicket>(await requestUpload(patient));

      const res = await trpcQuery(
        app,
        'document.getDownloadUrl',
        { documentId: ticket.documentId },
        patient.cookie,
      );

      expect(res.statusCode).toBe(400);
      expect(trpcError(res).message).toBe('Document upload not confirmed');
    });

    it('hides another patient document behind NOT_FOUND', async () => {
      const documentId = await uploadConfirmed(patient);
      const other = await createPatientUser(app);

      const res = await trpcQuery(app, 'document.getDownloadUrl', { documentId }, other.cookie);

      expect(res.statusCode).toBe(404);
      expect(trpcError(res).message).toBe('Document not found');
    });

    it('lets a doctor download a patient document', async () => {
      const documentId = await uploadConfirmed(patient);
      const doctor = await createDoctorUser(app);

      const res = await trpcQuery(app, 'document.getDownloadUrl', { documentId }, doctor.cookie);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('listing and deleting', () => {
    it('returns only the documents of the calling patient', async () => {
      await uploadConfirmed(patient);
      const other = await createPatientUser(app);
      await uploadConfirmed(other, { fileName: 'other.pdf' });

      const res = await trpcQuery(app, 'document.list', {}, patient.cookie);

      const list = trpcData<Document[]>(res);
      expect(list).toHaveLength(1);
      expect(list[0].userId).toBe(patient.id);
    });

    it('returns an empty list to a doctor who does not target a user', async () => {
      await uploadConfirmed(patient);
      const doctor = await createDoctorUser(app);

      const res = await trpcQuery(app, 'document.list', {}, doctor.cookie);

      expect(trpcData<Document[]>(res)).toEqual([]);
    });

    it('returns the documents of the targeted patient to a doctor', async () => {
      await uploadConfirmed(patient);
      const doctor = await createDoctorUser(app);

      const res = await trpcQuery(app, 'document.list', { userId: patient.id }, doctor.cookie);

      expect(trpcData<Document[]>(res)).toHaveLength(1);
    });

    it('soft deletes a document and removes it from the list', async () => {
      const documentId = await uploadConfirmed(patient);
      expect(
        trpcData<Document[]>(await trpcQuery(app, 'document.list', {}, patient.cookie)),
      ).toHaveLength(1);

      const res = await trpcMutate(app, 'document.delete', { documentId }, patient.cookie);

      expect(res.statusCode).toBe(200);
      expect(
        trpcData<Document[]>(await trpcQuery(app, 'document.list', {}, patient.cookie)),
      ).toEqual([]);
    });

    it('refuses to delete a document owned by another patient', async () => {
      const ticket = trpcData<UploadTicket>(await requestUpload(patient));
      const other = await createPatientUser(app);

      const res = await trpcMutate(
        app,
        'document.delete',
        { documentId: ticket.documentId },
        other.cookie,
      );

      expect(res.statusCode).toBe(404);
    });
  });

  describe('admin document administration', () => {
    it('lists documents of every user', async () => {
      await uploadConfirmed(patient);
      const admin = await createAdminUser(app);

      const res = await trpcQuery(
        app,
        'admin.adminListDocuments',
        { page: 1, perPage: 10 },
        admin.cookie,
      );

      expect(trpcData<{ totalItems: number }>(res).totalItems).toBe(1);
    });

    it('restores a soft-deleted document', async () => {
      const documentId = await uploadConfirmed(patient);
      await trpcMutate(app, 'document.delete', { documentId }, patient.cookie);
      const admin = await createAdminUser(app);

      const res = await trpcMutate(app, 'admin.adminRestoreDocument', { documentId }, admin.cookie);

      expect(res.statusCode).toBe(200);
      expect(
        trpcData<Document[]>(await trpcQuery(app, 'document.list', {}, patient.cookie)),
      ).toHaveLength(1);
    });

    it('rejects a patient calling the admin document endpoints', async () => {
      const res = await trpcQuery(
        app,
        'admin.adminListDocuments',
        { page: 1, perPage: 10 },
        patient.cookie,
      );

      expect(res.statusCode).toBe(401);
      expect(trpcError(res).message).toBe('You must be an admin to access this resource');
    });
  });
});
