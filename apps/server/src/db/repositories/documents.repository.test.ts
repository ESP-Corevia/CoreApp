import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { users } from '../schema/auth';
import type { documents } from '../schema/documents';
import { createDocumentsRepo } from './documents.repository';

const repo = createDocumentsRepo(db);

let userId: string;

beforeAll(async () => {
  await applyMigration();
}, 30_000);

beforeEach(async () => {
  await resetDb();

  const [user] = await db
    .insert(users)
    .values({
      name: 'Test Patient',
      email: 'patient@test.com',
      emailVerified: true,
      role: 'patient',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  userId = user.id;
});

describe('documentsRepository', () => {
  const makeDoc = (overrides: Partial<typeof documents.$inferInsert> = {}) => ({
    userId,
    fileName: 'test.pdf',
    fileKey: `users/${userId}/abc.pdf`,
    mimeType: 'application/pdf',
    fileSize: 1024,
    ...overrides,
  });

  it('creates a document and returns it', async () => {
    const doc = await repo.create(makeDoc());
    expect(doc).toBeDefined();
    expect(doc.fileName).toBe('test.pdf');
    expect(doc.status).toBe('pending');
  });

  it('finds a document by id', async () => {
    const created = await repo.create(makeDoc());
    const found = await repo.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
  });

  it('returns null for soft-deleted documents in findById', async () => {
    const created = await repo.create(makeDoc());
    await repo.softDelete(created.id);
    const found = await repo.findById(created.id);
    expect(found).toBeNull();
  });

  it('lists documents by userId excluding soft-deleted', async () => {
    const doc1 = await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
    const doc2 = await repo.create(makeDoc({ fileKey: 'users/1/b.pdf' }));
    await repo.confirmUpload(doc2.id);
    await repo.softDelete(doc1.id);

    const list = await repo.findByUserId(userId);
    expect(list).toHaveLength(1);
  });

  it('confirms a document', async () => {
    const created = await repo.create(makeDoc());
    const confirmed = await repo.confirmUpload(created.id);
    expect(confirmed?.status).toBe('confirmed');
  });
});
