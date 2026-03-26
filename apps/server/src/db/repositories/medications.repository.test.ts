/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import {
  patientMedicationIntakes,
  patientMedicationSchedules,
  patientMedications,
  users,
} from '../schema';

import { createMedicationsRepo } from './medications.repository';

const repo = createMedicationsRepo(db as any);

let patientId: string;
let otherPatientId: string;

beforeAll(async () => {
  await applyMigration();
});

beforeEach(async () => {
  await resetDb();

  const [patient] = await db
    .insert(users)
    .values({
      name: 'Jean Dupont',
      email: 'jean@test.com',
      emailVerified: true,
      role: 'patient',
      createdAt: new Date(),
    })
    .returning({ id: users.id });
  patientId = patient.id;

  const [other] = await db
    .insert(users)
    .values({
      name: 'Marie Martin',
      email: 'marie@test.com',
      emailVerified: true,
      role: 'patient',
      createdAt: new Date(),
    })
    .returning({ id: users.id });
  otherPatientId = other.id;
});

// ─── Helper ─────────────────────────────────────────────────

async function seedMedication(overrides: Partial<typeof patientMedications.$inferInsert> = {}) {
  const [med] = await db
    .insert(patientMedications)
    .values({
      patientId,
      medicationName: 'Doliprane 500mg',
      source: 'api-medicaments-fr',
      medicationForm: 'comprimé',
      startDate: '2025-01-01',
      isActive: true,
      ...overrides,
    })
    .returning();
  return med;
}

async function seedSchedule(
  medId: string,
  overrides: Partial<typeof patientMedicationSchedules.$inferInsert> = {},
) {
  const [sched] = await db
    .insert(patientMedicationSchedules)
    .values({
      patientMedicationId: medId,
      intakeTime: '08:00',
      intakeMoment: 'MORNING',
      quantity: '1',
      ...overrides,
    })
    .returning();
  return sched;
}

async function seedIntake(
  medId: string,
  schedId: string | null,
  overrides: Partial<typeof patientMedicationIntakes.$inferInsert> = {},
) {
  const [intake] = await db
    .insert(patientMedicationIntakes)
    .values({
      patientMedicationId: medId,
      scheduleId: schedId,
      scheduledDate: '2025-06-15',
      scheduledTime: '08:00',
      ...overrides,
    })
    .returning();
  return intake;
}

// ─── Patient Medications ────────────────────────────────────

describe('medications.repository', () => {
  describe('createMedicationAtomic', () => {
    it('creates medication, schedules, and intakes in one transaction', async () => {
      const result = await repo.createMedicationAtomic(
        {
          patientId,
          medicationName: 'Doliprane',
          source: 'api-medicaments-fr',
          startDate: '2025-01-01',
        },
        [
          { patientMedicationId: '', intakeTime: '08:00', intakeMoment: 'MORNING', quantity: '1' },
          { patientMedicationId: '', intakeTime: '20:00', intakeMoment: 'EVENING', quantity: '2' },
        ],
        [
          { scheduleIndex: 0, scheduledDate: '2025-06-15', scheduledTime: '08:00' },
          { scheduleIndex: 1, scheduledDate: '2025-06-15', scheduledTime: '20:00' },
        ],
      );

      expect(result.id).toBeDefined();
      expect(result.patientId).toBe(patientId);
      expect(result.medicationName).toBe('Doliprane');
      expect(result.schedules).toHaveLength(2);
      expect(result.schedules[0].intakeTime).toBe('08:00');
      expect(result.schedules[1].intakeTime).toBe('20:00');

      // Verify intakes were created
      const intakes = await repo.listIntakesByDate(patientId, '2025-06-15');
      expect(intakes).toHaveLength(2);
      expect(intakes.some(i => i.scheduledTime === '08:00')).toBe(true);
      expect(intakes.some(i => i.scheduledTime === '20:00')).toBe(true);
    });

    it('creates medication and schedules without intakes', async () => {
      const result = await repo.createMedicationAtomic(
        {
          patientId,
          medicationName: 'Ibuprofène',
          source: 'manual',
          startDate: '2099-01-01',
        },
        [{ patientMedicationId: '', intakeTime: '12:00', intakeMoment: 'NOON', quantity: '1' }],
        [],
      );

      expect(result.id).toBeDefined();
      expect(result.schedules).toHaveLength(1);

      // No intakes should exist
      const found = await repo.getById(result.id);
      expect(found).not.toBeNull();
    });

    it('links intakes to the correct schedule via scheduleIndex', async () => {
      const result = await repo.createMedicationAtomic(
        {
          patientId,
          medicationName: 'Test',
          source: 'manual',
          startDate: '2025-01-01',
        },
        [
          { patientMedicationId: '', intakeTime: '08:00', intakeMoment: 'MORNING', quantity: '1' },
          { patientMedicationId: '', intakeTime: '20:00', intakeMoment: 'EVENING', quantity: '1' },
        ],
        [{ scheduleIndex: 1, scheduledDate: '2025-06-15', scheduledTime: '20:00' }],
      );

      const intakes = await repo.listIntakesByDate(patientId, '2025-06-15');
      expect(intakes).toHaveLength(1);
      expect(intakes[0].scheduleId).toBe(result.schedules[1].id);
    });

    it('rolls back all changes on failure', async () => {
      const countBefore = await repo.countByPatient({ patientId });

      await expect(
        repo.createMedicationAtomic(
          {
            patientId,
            medicationName: 'Will Fail',
            source: 'manual',
            startDate: '2025-01-01',
          },
          [
            {
              patientMedicationId: '',
              intakeTime: '08:00',
              intakeMoment: 'MORNING',
              quantity: '1',
            },
          ],
          // scheduleIndex out of bounds will cause a runtime error inside the transaction
          [{ scheduleIndex: 99, scheduledDate: '2025-06-15', scheduledTime: '08:00' }],
        ),
      ).rejects.toThrow();

      const countAfter = await repo.countByPatient({ patientId });
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('getById', () => {
    it('returns medication by id', async () => {
      const med = await seedMedication();
      const found = await repo.getById(med.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(med.id);
      expect(found?.medicationName).toBe('Doliprane 500mg');
    });

    it('returns null for non-existent id', async () => {
      const found = await repo.getById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('getDetailById', () => {
    it('returns medication with its schedules', async () => {
      const med = await seedMedication();
      await seedSchedule(med.id, { intakeTime: '08:00', intakeMoment: 'MORNING' });
      await seedSchedule(med.id, { intakeTime: '20:00', intakeMoment: 'EVENING' });

      const detail = await repo.getDetailById(med.id);

      expect(detail).not.toBeNull();
      expect(detail?.medicationName).toBe('Doliprane 500mg');
      expect(detail?.schedules).toHaveLength(2);
      expect(detail?.schedules[0].intakeTime).toBe('08:00');
      expect(detail?.schedules[1].intakeTime).toBe('20:00');
    });

    it('returns null for non-existent id', async () => {
      const detail = await repo.getDetailById('00000000-0000-0000-0000-000000000000');
      expect(detail).toBeNull();
    });

    it('returns empty schedules if none exist', async () => {
      const med = await seedMedication();
      const detail = await repo.getDetailById(med.id);

      expect(detail?.schedules).toEqual([]);
    });
  });

  describe('listByPatient', () => {
    it('returns medications for a patient', async () => {
      await seedMedication();
      await seedMedication({ medicationName: 'Ibuprofène' });
      await seedMedication({ patientId: otherPatientId, medicationName: 'Other' });

      const list = await repo.listByPatient({ patientId, offset: 0, limit: 10 });

      expect(list).toHaveLength(2);
      expect(list.every(m => m.patientId === patientId)).toBe(true);
    });

    it('filters by isActive', async () => {
      await seedMedication({ isActive: true });
      await seedMedication({ isActive: false, medicationName: 'Inactive' });

      const active = await repo.listByPatient({ patientId, isActive: true, offset: 0, limit: 10 });
      expect(active).toHaveLength(1);
      expect(active[0].isActive).toBe(true);

      const inactive = await repo.listByPatient({
        patientId,
        isActive: false,
        offset: 0,
        limit: 10,
      });
      expect(inactive).toHaveLength(1);
      expect(inactive[0].isActive).toBe(false);
    });

    it('respects offset and limit', async () => {
      await seedMedication({ medicationName: 'Med A' });
      await seedMedication({ medicationName: 'Med B' });
      await seedMedication({ medicationName: 'Med C' });

      const page = await repo.listByPatient({ patientId, offset: 1, limit: 1 });
      expect(page).toHaveLength(1);
    });
  });

  describe('countByPatient', () => {
    it('counts medications for a patient', async () => {
      await seedMedication();
      await seedMedication({ medicationName: 'Other' });
      await seedMedication({ patientId: otherPatientId });

      const count = await repo.countByPatient({ patientId });
      expect(count).toBe(2);
    });

    it('counts filtered by isActive', async () => {
      await seedMedication({ isActive: true });
      await seedMedication({ isActive: false });

      expect(await repo.countByPatient({ patientId, isActive: true })).toBe(1);
      expect(await repo.countByPatient({ patientId, isActive: false })).toBe(1);
    });
  });

  describe('updateMedication', () => {
    it('updates fields and returns updated row', async () => {
      const med = await seedMedication();
      const updated = await repo.updateMedication(med.id, {
        dosageLabel: '1000mg',
        isActive: false,
      });

      expect(updated).not.toBeNull();
      expect(updated?.dosageLabel).toBe('1000mg');
      expect(updated?.isActive).toBe(false);
      expect(updated?.updatedAt).not.toBeNull();
    });

    it('returns null for non-existent id', async () => {
      const result = await repo.updateMedication('00000000-0000-0000-0000-000000000000', {
        dosageLabel: 'test',
      });
      expect(result).toBeNull();
    });
  });

  describe('deleteMedication', () => {
    it('deletes and returns id', async () => {
      const med = await seedMedication();
      const result = await repo.deleteMedication(med.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(med.id);

      const found = await repo.getById(med.id);
      expect(found).toBeNull();
    });

    it('cascades to schedules and intakes', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);
      await seedIntake(med.id, sched.id);

      await repo.deleteMedication(med.id);

      expect(await repo.getScheduleById(sched.id)).toBeNull();
    });
  });

  // ─── Schedules ──────────────────────────────────────────

  describe('createSchedule', () => {
    it('creates a schedule', async () => {
      const med = await seedMedication();
      const sched = await repo.createSchedule({
        patientMedicationId: med.id,
        intakeTime: '12:00',
        intakeMoment: 'NOON',
        quantity: '2',
        unit: 'ml',
      });

      expect(sched.id).toBeDefined();
      expect(sched.intakeTime).toBe('12:00');
      expect(sched.intakeMoment).toBe('NOON');
      expect(sched.quantity).toBe('2');
      expect(sched.unit).toBe('ml');
    });
  });

  describe('getScheduleById', () => {
    it('returns schedule by id', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      const found = await repo.getScheduleById(sched.id);
      expect(found).not.toBeNull();
      expect(found?.intakeTime).toBe('08:00');
    });

    it('returns null for non-existent id', async () => {
      expect(await repo.getScheduleById('00000000-0000-0000-0000-000000000000')).toBeNull();
    });
  });
  describe('getSchedulesByIds', () => {
    it('returns multiple schedules by ids', async () => {
      const med = await seedMedication();
      const sched1 = await seedSchedule(med.id, { intakeTime: '08:00' });
      const sched2 = await seedSchedule(med.id, { intakeTime: '20:00' });

      const found = await repo.getSchedulesByIds([sched1.id, sched2.id]);
      expect(found).toHaveLength(2);
      expect(found.some(s => s.intakeTime === '08:00')).toBe(true);
      expect(found.some(s => s.intakeTime === '20:00')).toBe(true);
    });

    it('returns empty array for empty input', async () => {
      const result = await repo.getSchedulesByIds([]);
      expect(result).toEqual([]);
    });

    it('ignores non-existent ids', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      const found = await repo.getSchedulesByIds([
        sched.id,
        '00000000-0000-0000-0000-000000000000',
      ]);
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(sched.id);
    });
  });

  describe('updateSchedule', () => {
    it('updates and returns schedule', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      const updated = await repo.updateSchedule(sched.id, {
        intakeTime: '09:00',
        quantity: '3',
      });

      expect(updated?.intakeTime).toBe('09:00');
      expect(updated?.quantity).toBe('3');
    });
  });

  describe('deleteSchedule', () => {
    it('deletes and returns id', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      const result = await repo.deleteSchedule(sched.id);
      expect(result?.id).toBe(sched.id);

      expect(await repo.getScheduleById(sched.id)).toBeNull();
    });
  });

  describe('listSchedulesByMedication', () => {
    it('returns schedules ordered by time', async () => {
      const med = await seedMedication();
      await seedSchedule(med.id, { intakeTime: '20:00', intakeMoment: 'EVENING' });
      await seedSchedule(med.id, { intakeTime: '08:00', intakeMoment: 'MORNING' });
      await seedSchedule(med.id, { intakeTime: '12:00', intakeMoment: 'NOON' });

      const schedules = await repo.listSchedulesByMedication(med.id);

      expect(schedules).toHaveLength(3);
      expect(schedules[0].intakeTime).toBe('08:00');
      expect(schedules[1].intakeTime).toBe('12:00');
      expect(schedules[2].intakeTime).toBe('20:00');
    });
  });

  // ─── Intakes ────────────────────────────────────────────

  describe('ensureIntakesForSchedules', () => {
    it('creates intakes that do not exist yet', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      const result = await repo.ensureIntakesForSchedules([
        {
          patientMedicationId: med.id,
          scheduleId: sched.id,
          scheduledDate: '2025-06-15',
          scheduledTime: '08:00',
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('PENDING');
      expect(result[0].scheduleId).toBe(sched.id);
    });

    it('silently skips duplicates (idempotent)', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      // First call creates
      await repo.ensureIntakesForSchedules([
        {
          patientMedicationId: med.id,
          scheduleId: sched.id,
          scheduledDate: '2025-06-15',
          scheduledTime: '08:00',
        },
      ]);

      // Second call with same key → no error, no duplicate
      const result = await repo.ensureIntakesForSchedules([
        {
          patientMedicationId: med.id,
          scheduleId: sched.id,
          scheduledDate: '2025-06-15',
          scheduledTime: '08:00',
        },
      ]);

      expect(result).toHaveLength(0); // ON CONFLICT DO NOTHING → nothing returned

      // Only one intake exists
      const intakes = await repo.listIntakesByDate(patientId, '2025-06-15');
      expect(intakes).toHaveLength(1);
    });

    it('creates only missing intakes when some already exist', async () => {
      const med = await seedMedication();
      const sched1 = await seedSchedule(med.id, { intakeTime: '08:00' });
      const sched2 = await seedSchedule(med.id, { intakeTime: '20:00' });

      // Create intake for sched1 only
      await repo.ensureIntakesForSchedules([
        {
          patientMedicationId: med.id,
          scheduleId: sched1.id,
          scheduledDate: '2025-06-15',
          scheduledTime: '08:00',
        },
      ]);

      // Now ensure both → only sched2 intake is new
      const result = await repo.ensureIntakesForSchedules([
        {
          patientMedicationId: med.id,
          scheduleId: sched1.id,
          scheduledDate: '2025-06-15',
          scheduledTime: '08:00',
        },
        {
          patientMedicationId: med.id,
          scheduleId: sched2.id,
          scheduledDate: '2025-06-15',
          scheduledTime: '20:00',
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].scheduleId).toBe(sched2.id);

      const intakes = await repo.listIntakesByDate(patientId, '2025-06-15');
      expect(intakes).toHaveLength(2);
    });

    it('allows same schedule on different dates', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      await repo.ensureIntakesForSchedules([
        {
          patientMedicationId: med.id,
          scheduleId: sched.id,
          scheduledDate: '2025-06-15',
          scheduledTime: '08:00',
        },
        {
          patientMedicationId: med.id,
          scheduleId: sched.id,
          scheduledDate: '2025-06-16',
          scheduledTime: '08:00',
        },
      ]);

      const day1 = await repo.listIntakesByDate(patientId, '2025-06-15');
      const day2 = await repo.listIntakesByDate(patientId, '2025-06-16');
      expect(day1).toHaveLength(1);
      expect(day2).toHaveLength(1);
    });

    it('returns empty array for empty input', async () => {
      const result = await repo.ensureIntakesForSchedules([]);
      expect(result).toEqual([]);
    });
  });

  describe('getIntakeById', () => {
    it('returns intake by id', async () => {
      const med = await seedMedication();
      const intake = await seedIntake(med.id, null);

      const found = await repo.getIntakeById(intake.id);
      expect(found).not.toBeNull();
      expect(found?.scheduledTime).toBe('08:00');
    });

    it('returns null for non-existent id', async () => {
      expect(await repo.getIntakeById('00000000-0000-0000-0000-000000000000')).toBeNull();
    });
  });

  describe('updateIntakeStatus', () => {
    it('marks intake as TAKEN with timestamp', async () => {
      const med = await seedMedication();
      const intake = await seedIntake(med.id, null);

      const updated = await repo.updateIntakeStatus(intake.id, 'TAKEN', 'Pris avec repas');

      expect(updated?.status).toBe('TAKEN');
      expect(updated?.takenAt).not.toBeNull();
      expect(updated?.notes).toBe('Pris avec repas');
    });

    it('marks intake as SKIPPED without timestamp', async () => {
      const med = await seedMedication();
      const intake = await seedIntake(med.id, null);

      const updated = await repo.updateIntakeStatus(intake.id, 'SKIPPED');

      expect(updated?.status).toBe('SKIPPED');
      expect(updated?.takenAt).toBeNull();
    });
  });

  describe('listIntakesByDate', () => {
    it('returns intakes for a patient on a specific date with medication info', async () => {
      const med = await seedMedication();
      await seedIntake(med.id, null, { scheduledDate: '2025-06-15', scheduledTime: '08:00' });
      await seedIntake(med.id, null, { scheduledDate: '2025-06-15', scheduledTime: '20:00' });
      await seedIntake(med.id, null, { scheduledDate: '2025-06-16', scheduledTime: '08:00' }); // different date

      const intakes = await repo.listIntakesByDate(patientId, '2025-06-15');

      expect(intakes).toHaveLength(2);
      expect(intakes[0].scheduledTime).toBe('08:00');
      expect(intakes[1].scheduledTime).toBe('20:00');
      expect(intakes[0].medicationName).toBe('Doliprane 500mg');
    });

    it('excludes inactive medications', async () => {
      const med = await seedMedication({ isActive: false });
      await seedIntake(med.id, null, { scheduledDate: '2025-06-15' });

      const intakes = await repo.listIntakesByDate(patientId, '2025-06-15');
      expect(intakes).toHaveLength(0);
    });

    it('excludes other patients intakes', async () => {
      const otherMed = await seedMedication({ patientId: otherPatientId });
      await seedIntake(otherMed.id, null, { scheduledDate: '2025-06-15' });

      const intakes = await repo.listIntakesByDate(patientId, '2025-06-15');
      expect(intakes).toHaveLength(0);
    });
  });

  // ─── Admin Queries ──────────────────────────────────────

  describe('listAllMedications', () => {
    it('returns medications across all patients with user info', async () => {
      await seedMedication({ medicationName: 'Doliprane' });
      await seedMedication({ patientId: otherPatientId, medicationName: 'Ibuprofène' });

      const list = await repo.listAllMedications({ offset: 0, limit: 10 });

      expect(list).toHaveLength(2);
      expect(list.some(m => m.patientName === 'Jean Dupont')).toBe(true);
      expect(list.some(m => m.patientName === 'Marie Martin')).toBe(true);
    });

    it('filters by patientId', async () => {
      await seedMedication();
      await seedMedication({ patientId: otherPatientId });

      const list = await repo.listAllMedications({ patientId, offset: 0, limit: 10 });

      expect(list).toHaveLength(1);
      expect(list[0].patientId).toBe(patientId);
    });

    it('filters by search (medication name)', async () => {
      await seedMedication({ medicationName: 'Doliprane 500mg' });
      await seedMedication({ medicationName: 'Ibuprofène 200mg' });

      const list = await repo.listAllMedications({ search: 'dolip', offset: 0, limit: 10 });

      expect(list).toHaveLength(1);
      expect(list[0].medicationName).toBe('Doliprane 500mg');
    });

    it('filters by isActive', async () => {
      await seedMedication({ isActive: true });
      await seedMedication({ isActive: false });

      const active = await repo.listAllMedications({ isActive: true, offset: 0, limit: 10 });
      expect(active).toHaveLength(1);
      expect(active[0].isActive).toBe(true);
    });
  });

  describe('countAllMedications', () => {
    it('counts all medications', async () => {
      await seedMedication();
      await seedMedication({ patientId: otherPatientId });

      expect(await repo.countAllMedications({})).toBe(2);
    });

    it('counts with filters', async () => {
      await seedMedication({ isActive: true });
      await seedMedication({ isActive: false });

      expect(await repo.countAllMedications({ isActive: true })).toBe(1);
      expect(await repo.countAllMedications({ search: 'Doliprane' })).toBe(2);
    });
  });
});
