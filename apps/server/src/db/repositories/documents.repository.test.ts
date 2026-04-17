import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import { users } from '../schema/auth';
import type { documents } from '../schema/documents';
import { createDocumentsRepo } from './documents.repository';

const repo = createDocumentsRepo(db);

let userId: string;
let secondUserId: string;

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

  const [user2] = await db
    .insert(users)
    .values({
      name: 'Second User',
      email: 'second@test.com',
      emailVerified: true,
      role: 'patient',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  userId = user.id;
  secondUserId = user2.id;
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

  describe('create', () => {
    it('creates a document with pending status', async () => {
      const doc = await repo.create(makeDoc());
      expect(doc).toBeDefined();
      expect(doc.fileName).toBe('test.pdf');
      expect(doc.status).toBe('pending');
      expect(doc.deletedAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('finds an existing document', async () => {
      const created = await repo.create(makeDoc());
      const found = await repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('returns null for non-existent id', async () => {
      const found = await repo.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

    it('returns null for soft-deleted documents', async () => {
      const created = await repo.create(makeDoc());
      await repo.softDelete(created.id);
      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('returns only confirmed, non-deleted documents for the user', async () => {
      const doc1 = await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      const doc2 = await repo.create(makeDoc({ fileKey: 'users/1/b.pdf' }));
      await repo.create(makeDoc({ fileKey: 'users/1/c.pdf' })); // pending — excluded

      await repo.confirmUpload(doc1.id);
      await repo.confirmUpload(doc2.id);
      await repo.softDelete(doc1.id); // confirmed but deleted — excluded

      const list = await repo.findByUserId(userId);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(doc2.id);
    });

    it('returns empty array for user with no documents', async () => {
      const list = await repo.findByUserId(secondUserId);
      expect(list).toHaveLength(0);
    });
  });

  describe('confirmUpload', () => {
    it('sets status to confirmed', async () => {
      const created = await repo.create(makeDoc());
      const confirmed = await repo.confirmUpload(created.id);
      expect(confirmed.status).toBe('confirmed');
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt timestamp', async () => {
      const created = await repo.create(makeDoc());
      const deleted = await repo.softDelete(created.id);
      expect(deleted.deletedAt).toBeDefined();
      expect(deleted.deletedAt).not.toBeNull();
    });
  });

  describe('findByIdIncludeDeleted', () => {
    it('finds a non-deleted document', async () => {
      const created = await repo.create(makeDoc());
      const found = await repo.findByIdIncludeDeleted(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('finds a soft-deleted document', async () => {
      const created = await repo.create(makeDoc());
      await repo.softDelete(created.id);
      const found = await repo.findByIdIncludeDeleted(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.deletedAt).not.toBeNull();
    });

    it('returns null for non-existent id', async () => {
      const found = await repo.findByIdIncludeDeleted('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns paginated documents with user info', async () => {
      const doc = await repo.create(makeDoc());
      await repo.confirmUpload(doc.id);

      const results = await repo.findAll({
        includeDeleted: false,
        offset: 0,
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(doc.id);
      expect(results[0].userName).toBe('Test Patient');
      expect(results[0].userEmail).toBe('patient@test.com');
    });

    it('excludes soft-deleted documents when includeDeleted is false', async () => {
      const doc1 = await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      const doc2 = await repo.create(makeDoc({ fileKey: 'users/1/b.pdf' }));
      await repo.softDelete(doc1.id);

      const results = await repo.findAll({
        includeDeleted: false,
        offset: 0,
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(doc2.id);
    });

    it('includes soft-deleted documents when includeDeleted is true', async () => {
      const doc1 = await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      await repo.create(makeDoc({ fileKey: 'users/1/b.pdf' }));
      await repo.softDelete(doc1.id);

      const results = await repo.findAll({
        includeDeleted: true,
        offset: 0,
        limit: 10,
      });

      expect(results).toHaveLength(2);
    });

    it('filters by user name search', async () => {
      await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      await repo.create(makeDoc({ userId: secondUserId, fileKey: 'users/2/b.pdf' }));

      const results = await repo.findAll({
        search: 'Second',
        includeDeleted: false,
        offset: 0,
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].userName).toBe('Second User');
    });

    it('filters by user email search', async () => {
      await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      await repo.create(makeDoc({ userId: secondUserId, fileKey: 'users/2/b.pdf' }));

      const results = await repo.findAll({
        search: 'second@',
        includeDeleted: false,
        offset: 0,
        limit: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0].userEmail).toBe('second@test.com');
    });

    it('respects offset and limit for pagination', async () => {
      await repo.create(makeDoc({ fileKey: 'users/1/a.pdf', fileName: 'a.pdf' }));
      await repo.create(makeDoc({ fileKey: 'users/1/b.pdf', fileName: 'b.pdf' }));
      await repo.create(makeDoc({ fileKey: 'users/1/c.pdf', fileName: 'c.pdf' }));

      const page1 = await repo.findAll({ includeDeleted: false, offset: 0, limit: 2 });
      const page2 = await repo.findAll({ includeDeleted: false, offset: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });

    it('returns empty array with no conditions when no documents exist', async () => {
      const results = await repo.findAll({
        includeDeleted: true,
        offset: 0,
        limit: 10,
      });
      expect(results).toHaveLength(0);
    });
  });

  describe('countAll', () => {
    it('counts non-deleted documents', async () => {
      const doc1 = await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      await repo.create(makeDoc({ fileKey: 'users/1/b.pdf' }));
      await repo.softDelete(doc1.id);

      const count = await repo.countAll({ includeDeleted: false });
      expect(count).toBe(1);
    });

    it('counts all documents including deleted', async () => {
      const doc1 = await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      await repo.create(makeDoc({ fileKey: 'users/1/b.pdf' }));
      await repo.softDelete(doc1.id);

      const count = await repo.countAll({ includeDeleted: true });
      expect(count).toBe(2);
    });

    it('counts with search filter', async () => {
      await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      await repo.create(makeDoc({ userId: secondUserId, fileKey: 'users/2/b.pdf' }));

      const count = await repo.countAll({ search: 'Test Patient', includeDeleted: false });
      expect(count).toBe(1);
    });

    it('returns 0 when no documents match', async () => {
      const count = await repo.countAll({ includeDeleted: false });
      expect(count).toBe(0);
    });

    it('returns 0 when search matches no users', async () => {
      await repo.create(makeDoc());
      const count = await repo.countAll({ search: 'nonexistent', includeDeleted: false });
      expect(count).toBe(0);
    });
  });

  describe('restore', () => {
    it('clears deletedAt', async () => {
      const created = await repo.create(makeDoc());
      await repo.softDelete(created.id);

      const restored = await repo.restore(created.id);
      expect(restored.deletedAt).toBeNull();
    });

    it('makes document visible to findById again', async () => {
      const created = await repo.create(makeDoc());
      await repo.softDelete(created.id);
      expect(await repo.findById(created.id)).toBeNull();

      await repo.restore(created.id);
      const found = await repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });
  });

  describe('hardDelete', () => {
    it('permanently removes the document', async () => {
      const created = await repo.create(makeDoc());
      await repo.hardDelete(created.id);

      const found = await repo.findByIdIncludeDeleted(created.id);
      expect(found).toBeNull();
    });

    it('does not affect other documents', async () => {
      const doc1 = await repo.create(makeDoc({ fileKey: 'users/1/a.pdf' }));
      const doc2 = await repo.create(makeDoc({ fileKey: 'users/1/b.pdf' }));

      await repo.hardDelete(doc1.id);

      const found = await repo.findByIdIncludeDeleted(doc2.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(doc2.id);
    });
  });
});
