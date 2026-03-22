import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { applyMigration, db, resetDb } from '../../../test/db';
import {
  patientMedications,
  patientMedicationSchedules,
  patientMedicationIntakes,
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
  describe('createMedication', () => {
    it('creates a medication and returns it', async () => {
      const med = await repo.createMedication({
        patientId,
        medicationName: 'Doliprane',
        source: 'api-medicaments-fr',
        startDate: '2025-01-01',
        cis: '60234100',
        medicationForm: 'comprimé',
        activeSubstances: ['PARACÉTAMOL'],
        dosageLabel: '500mg',
      });

      expect(med.id).toBeDefined();
      expect(med.patientId).toBe(patientId);
      expect(med.medicationName).toBe('Doliprane');
      expect(med.cis).toBe('60234100');
      expect(med.activeSubstances).toEqual(['PARACÉTAMOL']);
      expect(med.isActive).toBe(true);
    });

    it('defaults nullable fields to null', async () => {
      const med = await repo.createMedication({
        patientId,
        medicationName: 'Test',
        source: 'manual',
        startDate: '2025-01-01',
      });

      expect(med.cis).toBeNull();
      expect(med.cip).toBeNull();
      expect(med.medicationForm).toBeNull();
      expect(med.dosageLabel).toBeNull();
      expect(med.endDate).toBeNull();
    });
  });

  describe('getById', () => {
    it('returns medication by id', async () => {
      const med = await seedMedication();
      const found = await repo.getById(med.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(med.id);
      expect(found!.medicationName).toBe('Doliprane 500mg');
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
      expect(detail!.medicationName).toBe('Doliprane 500mg');
      expect(detail!.schedules).toHaveLength(2);
      expect(detail!.schedules[0].intakeTime).toBe('08:00');
      expect(detail!.schedules[1].intakeTime).toBe('20:00');
    });

    it('returns null for non-existent id', async () => {
      const detail = await repo.getDetailById('00000000-0000-0000-0000-000000000000');
      expect(detail).toBeNull();
    });

    it('returns empty schedules if none exist', async () => {
      const med = await seedMedication();
      const detail = await repo.getDetailById(med.id);

      expect(detail!.schedules).toEqual([]);
    });
  });

  describe('listByPatient', () => {
    it('returns medications for a patient', async () => {
      await seedMedication();
      await seedMedication({ medicationName: 'Ibuprofène' });
      await seedMedication({ patientId: otherPatientId, medicationName: 'Other' });

      const list = await repo.listByPatient({ patientId, offset: 0, limit: 10 });

      expect(list).toHaveLength(2);
      expect(list.every((m) => m.patientId === patientId)).toBe(true);
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
      expect(updated!.dosageLabel).toBe('1000mg');
      expect(updated!.isActive).toBe(false);
      expect(updated!.updatedAt).not.toBeNull();
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
      expect(result!.id).toBe(med.id);

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
      expect(found!.intakeTime).toBe('08:00');
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
      expect(found.some((s) => s.intakeTime === '08:00')).toBe(true);
      expect(found.some((s) => s.intakeTime === '20:00')).toBe(true);
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

      expect(updated!.intakeTime).toBe('09:00');
      expect(updated!.quantity).toBe('3');
    });
  });

  describe('deleteSchedule', () => {
    it('deletes and returns id', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      const result = await repo.deleteSchedule(sched.id);
      expect(result!.id).toBe(sched.id);

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

  describe('createIntake', () => {
    it('creates a single intake', async () => {
      const med = await seedMedication();
      const sched = await seedSchedule(med.id);

      const intake = await repo.createIntake({
        patientMedicationId: med.id,
        scheduleId: sched.id,
        scheduledDate: '2025-06-15',
        scheduledTime: '08:00',
      });

      expect(intake.id).toBeDefined();
      expect(intake.status).toBe('PENDING');
      expect(intake.takenAt).toBeNull();
    });
  });

  describe('createManyIntakes', () => {
    it('creates multiple intakes', async () => {
      const med = await seedMedication();

      const intakes = await repo.createManyIntakes([
        { patientMedicationId: med.id, scheduledDate: '2025-06-15', scheduledTime: '08:00' },
        { patientMedicationId: med.id, scheduledDate: '2025-06-15', scheduledTime: '12:00' },
        { patientMedicationId: med.id, scheduledDate: '2025-06-15', scheduledTime: '20:00' },
      ]);

      expect(intakes).toHaveLength(3);
      expect(intakes.every((i) => i.status === 'PENDING')).toBe(true);
    });

    it('returns empty array for empty input', async () => {
      const result = await repo.createManyIntakes([]);
      expect(result).toEqual([]);
    });
  });

  describe('getIntakeById', () => {
    it('returns intake by id', async () => {
      const med = await seedMedication();
      const intake = await seedIntake(med.id, null);

      const found = await repo.getIntakeById(intake.id);
      expect(found).not.toBeNull();
      expect(found!.scheduledTime).toBe('08:00');
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

      expect(updated!.status).toBe('TAKEN');
      expect(updated!.takenAt).not.toBeNull();
      expect(updated!.notes).toBe('Pris avec repas');
    });

    it('marks intake as SKIPPED without timestamp', async () => {
      const med = await seedMedication();
      const intake = await seedIntake(med.id, null);

      const updated = await repo.updateIntakeStatus(intake.id, 'SKIPPED');

      expect(updated!.status).toBe('SKIPPED');
      expect(updated!.takenAt).toBeNull();
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

  describe('intakesExistForDate', () => {
    it('returns true when intakes exist', async () => {
      const med = await seedMedication();
      await seedIntake(med.id, null, { scheduledDate: '2025-06-15' });

      expect(await repo.intakesExistForDate(med.id, '2025-06-15')).toBe(true);
    });

    it('returns false when no intakes exist', async () => {
      const med = await seedMedication();

      expect(await repo.intakesExistForDate(med.id, '2025-06-15')).toBe(false);
    });

    it('returns false for different date', async () => {
      const med = await seedMedication();
      await seedIntake(med.id, null, { scheduledDate: '2025-06-15' });

      expect(await repo.intakesExistForDate(med.id, '2025-06-16')).toBe(false);
    });
  });

  // ─── Admin Queries ──────────────────────────────────────

  describe('listAllMedications', () => {
    it('returns medications across all patients with user info', async () => {
      await seedMedication({ medicationName: 'Doliprane' });
      await seedMedication({ patientId: otherPatientId, medicationName: 'Ibuprofène' });

      const list = await repo.listAllMedications({ offset: 0, limit: 10 });

      expect(list).toHaveLength(2);
      expect(list.some((m) => m.patientName === 'Jean Dupont')).toBe(true);
      expect(list.some((m) => m.patientName === 'Marie Martin')).toBe(true);
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
