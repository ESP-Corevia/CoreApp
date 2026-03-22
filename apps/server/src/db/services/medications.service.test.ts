import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';

import { createMedicationsService } from './medications.service';

import type { MedicationsProvider } from '../../lib/medications/api-medicaments-fr.client';
import type { MedicationsRepo } from '../repositories/medications.repository';

let repo: DeepMockProxy<MedicationsRepo>;
let provider: DeepMockProxy<MedicationsProvider>;
let service: ReturnType<typeof createMedicationsService>;

beforeEach(() => {
  repo = mockDeep<MedicationsRepo>();
  provider = mockDeep<MedicationsProvider>();
  service = createMedicationsService(repo, provider);
  vi.clearAllMocks();
});

// ─── Search ─────────────────────────────────────────────────

describe('search', () => {
  it('delegates to provider', async () => {
    const expected = { items: [], total: 0, page: 1, limit: 20 };
    provider.search.mockResolvedValue(expected);

    const result = await service.search({ query: 'paracetamol', page: 1, limit: 20 });

    expect(result).toEqual(expected);
    expect(provider.search).toHaveBeenCalledWith('paracetamol', 1, 20);
  });

  it('wraps provider errors in TRPCError', async () => {
    provider.search.mockRejectedValue(new Error('API timeout'));

    await expect(service.search({ query: 'test', page: 1, limit: 20 })).rejects.toThrow(TRPCError);
  });

  it('wraps non-Error thrown values', async () => {
    provider.search.mockRejectedValue('unexpected');

    await expect(service.search({ query: 'test', page: 1, limit: 20 })).rejects.toMatchObject({
      message: 'Failed to search medications',
    });
  });
});

describe('getByCode', () => {
  it('delegates to provider', async () => {
    provider.getByCode.mockResolvedValue(null);

    const result = await service.getByCode({ cis: '12345' });

    expect(result).toBeNull();
    expect(provider.getByCode).toHaveBeenCalledWith({ cis: '12345' });
  });

  it('wraps provider errors in TRPCError', async () => {
    provider.getByCode.mockRejectedValue(new Error('API down'));

    await expect(service.getByCode({ cis: '12345' })).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'API down',
    });
  });

  it('wraps non-Error thrown values', async () => {
    provider.getByCode.mockRejectedValue(42);

    await expect(service.getByCode({ cis: '12345' })).rejects.toMatchObject({
      message: 'Failed to fetch medication',
    });
  });
});

// ─── Pillbox CRUD ───────────────────────────────────────────

describe('listMine', () => {
  it('returns paginated results', async () => {
    const items = [{ id: 'med_1', patientId: 'u_1', medicationName: 'Test' }];
    repo.listByPatient.mockResolvedValue(items as any);
    repo.countByPatient.mockResolvedValue(1);

    const result = await service.listMine('u_1', { page: 1, limit: 20 });

    expect(result.items).toEqual(items);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(repo.listByPatient).toHaveBeenCalledWith({
      patientId: 'u_1',
      isActive: undefined,
      offset: 0,
      limit: 20,
    });
  });
});

describe('detail', () => {
  it('returns medication with schedules', async () => {
    const med = { id: 'med_1', patientId: 'u_1', schedules: [] };
    repo.getDetailById.mockResolvedValue(med as any);

    const result = await service.detail('u_1', 'med_1', false);

    expect(result).toEqual(med);
  });

  it('throws NOT_FOUND if medication does not exist', async () => {
    repo.getDetailById.mockResolvedValue(null);

    await expect(service.detail('u_1', 'med_1', false)).rejects.toThrow(TRPCError);
    await expect(service.detail('u_1', 'med_1', false)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN if patient does not own medication', async () => {
    const med = { id: 'med_1', patientId: 'u_other', schedules: [] };
    repo.getDetailById.mockResolvedValue(med as any);

    await expect(service.detail('u_1', 'med_1', false)).rejects.toThrow(TRPCError);
    await expect(service.detail('u_1', 'med_1', false)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('allows admin to view any medication', async () => {
    const med = { id: 'med_1', patientId: 'u_other', schedules: [] };
    repo.getDetailById.mockResolvedValue(med as any);

    const result = await service.detail('admin_1', 'med_1', true);

    expect(result).toEqual(med);
  });
});

describe('createMedication', () => {
  const input = {
    medicationName: 'Doliprane',
    source: 'api-medicaments-fr',
    startDate: '2099-01-01',
    schedules: [{ intakeTime: '08:00', intakeMoment: 'MORNING' as const, quantity: '1' }],
  };

  it('creates medication and schedules', async () => {
    const createdMed = { id: 'med_1', patientId: 'u_1', startDate: '2099-01-01', endDate: null };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);
    repo.createManyIntakes.mockResolvedValue([]);

    const result = await service.createMedication('u_1', input);

    expect(result.id).toBe('med_1');
    expect(repo.createMedication).toHaveBeenCalledTimes(1);
    expect(repo.createSchedule).toHaveBeenCalledTimes(1);
  });

  it('rejects if endDate before startDate', async () => {
    await expect(
      service.createMedication('u_1', { ...input, endDate: '2098-12-31' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('generates intakes when medication starts today or earlier', async () => {
    const createdMed = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);
    repo.createManyIntakes.mockResolvedValue([]);

    await service.createMedication('u_1', { ...input, startDate: '2020-01-01' });

    expect(repo.createManyIntakes).toHaveBeenCalledTimes(1);
  });

  it('generates intakes when endDate is in the future', async () => {
    const createdMed = {
      id: 'med_1',
      patientId: 'u_1',
      startDate: '2020-01-01',
      endDate: '2099-12-31',
    };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);
    repo.createManyIntakes.mockResolvedValue([]);

    await service.createMedication('u_1', {
      ...input,
      startDate: '2020-01-01',
      endDate: '2099-12-31',
    });

    expect(repo.createManyIntakes).toHaveBeenCalledTimes(1);
  });

  it('skips intake generation when endDate is in the past', async () => {
    const createdMed = {
      id: 'med_1',
      patientId: 'u_1',
      startDate: '2020-01-01',
      endDate: '2020-06-01',
    };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);

    await service.createMedication('u_1', {
      ...input,
      startDate: '2020-01-01',
      endDate: '2020-06-01',
    });

    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });

  it('skips intake generation when schedule weekday does not match today', async () => {
    const createdMed = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: 99,
      intakeTime: '08:00',
    } as any);

    await service.createMedication('u_1', { ...input, startDate: '2020-01-01' });

    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });
});

describe('updateMedication', () => {
  it('updates medication owned by user', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);
    repo.updateMedication.mockResolvedValue({ id: 'med_1' } as any);

    const result = await service.updateMedication('u_1', { id: 'med_1', dosageLabel: '500mg' });

    expect(result).toEqual({ id: 'med_1' });
  });

  it('rejects if not owner', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);

    await expect(
      service.updateMedication('u_1', { id: 'med_1', dosageLabel: '500mg' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('rejects if not found', async () => {
    repo.getById.mockResolvedValue(null);

    await expect(
      service.updateMedication('u_1', { id: 'med_1', dosageLabel: '500mg' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('deleteMedication', () => {
  it('deletes medication owned by user', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);
    repo.deleteMedication.mockResolvedValue({ id: 'med_1' } as any);

    await service.deleteMedication('u_1', 'med_1');

    expect(repo.deleteMedication).toHaveBeenCalledWith('med_1');
  });

  it('rejects if not owner', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);

    await expect(service.deleteMedication('u_1', 'med_1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('throws NOT_FOUND if medication does not exist', async () => {
    repo.getById.mockResolvedValue(null);

    await expect(service.deleteMedication('u_1', 'med_1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

// ─── Schedules ──────────────────────────────────────────────

describe('addSchedule', () => {
  it('adds schedule to owned medication', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);
    repo.createSchedule.mockResolvedValue({ id: 'sched_1' } as any);

    const result = await service.addSchedule(
      'u_1',
      {
        patientMedicationId: 'med_1',
        intakeTime: '08:00',
        intakeMoment: 'MORNING',
        quantity: '1',
      },
      false,
    );

    expect(result.id).toBe('sched_1');
  });

  it('rejects if medication not owned', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);

    await expect(
      service.addSchedule(
        'u_1',
        {
          patientMedicationId: 'med_1',
          intakeTime: '08:00',
          intakeMoment: 'MORNING',
          quantity: '1',
        },
        false,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('allows admin to add schedule to any medication', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);
    repo.createSchedule.mockResolvedValue({ id: 'sched_1' } as any);

    const result = await service.addSchedule(
      'admin_1',
      {
        patientMedicationId: 'med_1',
        intakeTime: '08:00',
        intakeMoment: 'MORNING',
        quantity: '1',
      },
      true,
    );

    expect(result.id).toBe('sched_1');
  });

  it('throws NOT_FOUND if medication does not exist', async () => {
    repo.getById.mockResolvedValue(null);

    await expect(
      service.addSchedule(
        'u_1',
        {
          patientMedicationId: 'med_1',
          intakeTime: '08:00',
          intakeMoment: 'MORNING',
          quantity: '1',
        },
        false,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('updateSchedule', () => {
  it('updates schedule on owned medication', async () => {
    repo.getScheduleById.mockResolvedValue({ id: 'sched_1', patientMedicationId: 'med_1' } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);
    repo.updateSchedule.mockResolvedValue({ id: 'sched_1', intakeTime: '09:00' } as any);

    const result = await service.updateSchedule(
      'u_1',
      { id: 'sched_1', intakeTime: '09:00' },
      false,
    );

    expect(result.intakeTime).toBe('09:00');
  });

  it('allows admin to update any schedule', async () => {
    repo.getScheduleById.mockResolvedValue({ id: 'sched_1', patientMedicationId: 'med_1' } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);
    repo.updateSchedule.mockResolvedValue({ id: 'sched_1', intakeTime: '09:00' } as any);

    const result = await service.updateSchedule(
      'admin_1',
      { id: 'sched_1', intakeTime: '09:00' },
      true,
    );

    expect(result.intakeTime).toBe('09:00');
  });

  it('throws NOT_FOUND if schedule does not exist', async () => {
    repo.getScheduleById.mockResolvedValue(null);

    await expect(
      service.updateSchedule('u_1', { id: 'sched_1', intakeTime: '09:00' }, false),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN if not owner', async () => {
    repo.getScheduleById.mockResolvedValue({ id: 'sched_1', patientMedicationId: 'med_1' } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);

    await expect(
      service.updateSchedule('u_1', { id: 'sched_1', intakeTime: '09:00' }, false),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('deleteSchedule', () => {
  it('deletes schedule from owned medication', async () => {
    repo.getScheduleById.mockResolvedValue({ id: 'sched_1', patientMedicationId: 'med_1' } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);
    repo.deleteSchedule.mockResolvedValue({ id: 'sched_1' } as any);

    await service.deleteSchedule('u_1', 'sched_1', false);

    expect(repo.deleteSchedule).toHaveBeenCalledWith('sched_1');
  });

  it('throws NOT_FOUND if schedule does not exist', async () => {
    repo.getScheduleById.mockResolvedValue(null);

    await expect(service.deleteSchedule('u_1', 'sched_1', false)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws FORBIDDEN if not owner', async () => {
    repo.getScheduleById.mockResolvedValue({ id: 'sched_1', patientMedicationId: 'med_1' } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);

    await expect(service.deleteSchedule('u_1', 'sched_1', false)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});

// ─── Intakes ────────────────────────────────────────────────

describe('markIntakeTaken', () => {
  it('marks pending intake as taken', async () => {
    repo.getIntakeById.mockResolvedValue({
      id: 'int_1',
      patientMedicationId: 'med_1',
      status: 'PENDING',
    } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);
    repo.updateIntakeStatus.mockResolvedValue({ id: 'int_1', status: 'TAKEN' } as any);

    const result = await service.markIntakeTaken('u_1', 'int_1');

    expect(result.status).toBe('TAKEN');
    expect(repo.updateIntakeStatus).toHaveBeenCalledWith('int_1', 'TAKEN', undefined);
  });

  it('rejects if intake not PENDING', async () => {
    repo.getIntakeById.mockResolvedValue({
      id: 'int_1',
      patientMedicationId: 'med_1',
      status: 'TAKEN',
    } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);

    await expect(service.markIntakeTaken('u_1', 'int_1')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('rejects if not owner', async () => {
    repo.getIntakeById.mockResolvedValue({
      id: 'int_1',
      patientMedicationId: 'med_1',
      status: 'PENDING',
    } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);

    await expect(service.markIntakeTaken('u_1', 'int_1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('throws NOT_FOUND if intake does not exist', async () => {
    repo.getIntakeById.mockResolvedValue(null);

    await expect(service.markIntakeTaken('u_1', 'int_1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('markIntakeSkipped', () => {
  it('marks pending intake as skipped', async () => {
    repo.getIntakeById.mockResolvedValue({
      id: 'int_1',
      patientMedicationId: 'med_1',
      status: 'PENDING',
    } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);
    repo.updateIntakeStatus.mockResolvedValue({ id: 'int_1', status: 'SKIPPED' } as any);

    const result = await service.markIntakeSkipped('u_1', 'int_1');

    expect(result.status).toBe('SKIPPED');
  });

  it('throws NOT_FOUND if intake does not exist', async () => {
    repo.getIntakeById.mockResolvedValue(null);

    await expect(service.markIntakeSkipped('u_1', 'int_1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects if not owner', async () => {
    repo.getIntakeById.mockResolvedValue({
      id: 'int_1',
      patientMedicationId: 'med_1',
      status: 'PENDING',
    } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_other' } as any);

    await expect(service.markIntakeSkipped('u_1', 'int_1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('rejects if intake not PENDING', async () => {
    repo.getIntakeById.mockResolvedValue({
      id: 'int_1',
      patientMedicationId: 'med_1',
      status: 'TAKEN',
    } as any);
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_1' } as any);

    await expect(service.markIntakeSkipped('u_1', 'int_1')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });
});

// ─── Admin ──────────────────────────────────────────────────

describe('adminListAll', () => {
  it('returns paginated list across all patients', async () => {
    repo.listAllMedications.mockResolvedValue([{ id: 'med_1' }] as any);
    repo.countAllMedications.mockResolvedValue(1);

    const result = await service.adminListAll({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe('today', () => {
  it('returns intakes for today and generates missing ones', async () => {
    const med = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.listByPatient.mockResolvedValue([med] as any);
    repo.intakesExistForDate.mockResolvedValue(false);
    repo.listSchedulesByMedication.mockResolvedValue([
      { id: 'sched_1', weekday: null, intakeTime: '08:00' },
    ] as any);
    repo.createManyIntakes.mockResolvedValue([]);
    repo.listIntakesByDate.mockResolvedValue([
      {
        id: 'int_1',
        patientMedicationId: 'med_1',
        scheduleId: 'sched_1',
        scheduledDate: '2026-03-22',
        scheduledTime: '08:00',
        status: 'PENDING',
        takenAt: null,
        notes: null,
        createdAt: new Date(),
        medicationName: 'Doliprane',
        medicationForm: 'comprimé',
        dosageLabel: '500mg',
      },
    ] as any);
    repo.getSchedulesByIds.mockResolvedValue([
      { id: 'sched_1', intakeMoment: 'MORNING', quantity: '1', unit: null },
    ] as any);

    const result = await service.today('u_1');

    expect(result.intakes).toHaveLength(1);
    expect(result.intakes[0].intakeMoment).toBe('MORNING');
    expect(repo.createManyIntakes).toHaveBeenCalledTimes(1);
  });

  it('skips intake generation if already exist for today', async () => {
    const med = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.listByPatient.mockResolvedValue([med] as any);
    repo.intakesExistForDate.mockResolvedValue(true);
    repo.listIntakesByDate.mockResolvedValue([]);

    const result = await service.today('u_1');

    expect(result.intakes).toEqual([]);
    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });

  it('skips medications outside date range', async () => {
    const futureMed = { id: 'med_1', patientId: 'u_1', startDate: '2099-01-01', endDate: null };
    repo.listByPatient.mockResolvedValue([futureMed] as any);
    repo.listIntakesByDate.mockResolvedValue([]);

    const result = await service.today('u_1');

    expect(result.intakes).toEqual([]);
    expect(repo.intakesExistForDate).not.toHaveBeenCalled();
  });

  it('skips medications with past endDate', async () => {
    const expiredMed = {
      id: 'med_1',
      patientId: 'u_1',
      startDate: '2020-01-01',
      endDate: '2020-12-31',
    };
    repo.listByPatient.mockResolvedValue([expiredMed] as any);
    repo.listIntakesByDate.mockResolvedValue([]);

    const result = await service.today('u_1');

    expect(result.intakes).toEqual([]);
    expect(repo.intakesExistForDate).not.toHaveBeenCalled();
  });

  it('handles intakes without scheduleId', async () => {
    repo.listByPatient.mockResolvedValue([]);
    repo.listIntakesByDate.mockResolvedValue([
      {
        id: 'int_1',
        patientMedicationId: 'med_1',
        scheduleId: null,
        scheduledDate: '2026-03-22',
        scheduledTime: '08:00',
        status: 'PENDING',
        takenAt: null,
        notes: null,
        createdAt: new Date(),
        medicationName: 'Doliprane',
        medicationForm: null,
        dosageLabel: null,
      },
    ] as any);

    const result = await service.today('u_1');

    expect(result.intakes[0].intakeMoment).toBeNull();
    expect(result.intakes[0].quantity).toBeNull();
  });

  it('handles intake with deleted schedule', async () => {
    repo.listByPatient.mockResolvedValue([]);
    repo.listIntakesByDate.mockResolvedValue([
      {
        id: 'int_1',
        patientMedicationId: 'med_1',
        scheduleId: 'sched_deleted',
        scheduledDate: '2026-03-22',
        scheduledTime: '08:00',
        status: 'PENDING',
        takenAt: null,
        notes: null,
        createdAt: new Date(),
        medicationName: 'Doliprane',
        medicationForm: null,
        dosageLabel: null,
      },
    ] as any);
    repo.getSchedulesByIds.mockResolvedValue([]);

    const result = await service.today('u_1');

    expect(result.intakes[0].intakeMoment).toBeNull();
  });

  it('filters schedules by weekday when generating intakes', async () => {
    const med = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.listByPatient.mockResolvedValue([med] as any);
    repo.intakesExistForDate.mockResolvedValue(false);
    repo.listSchedulesByMedication.mockResolvedValue([
      { id: 'sched_1', weekday: 99, intakeTime: '08:00' },
    ] as any);
    repo.listIntakesByDate.mockResolvedValue([]);

    await service.today('u_1');

    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });
});

describe('adminCreateMedication', () => {
  const input = {
    medicationName: 'Doliprane',
    source: 'api-medicaments-fr',
    startDate: '2099-01-01',
    schedules: [{ intakeTime: '08:00', intakeMoment: 'MORNING' as const, quantity: '1' }],
  };

  it('creates medication for any patient', async () => {
    const createdMed = { id: 'med_1', patientId: 'u_1', startDate: '2099-01-01', endDate: null };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);

    const result = await service.adminCreateMedication('u_1', input);

    expect(result.id).toBe('med_1');
    expect(repo.createMedication).toHaveBeenCalledTimes(1);
    expect(repo.createSchedule).toHaveBeenCalledTimes(1);
  });

  it('rejects if endDate before startDate', async () => {
    await expect(
      service.adminCreateMedication('u_1', { ...input, endDate: '2098-12-31' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('generates intakes if medication starts today or earlier', async () => {
    const createdMed = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);
    repo.createManyIntakes.mockResolvedValue([]);

    await service.adminCreateMedication('u_1', { ...input, startDate: '2020-01-01' });

    expect(repo.createManyIntakes).toHaveBeenCalledTimes(1);
  });

  it('generates intakes when endDate is in the future', async () => {
    const createdMed = {
      id: 'med_1',
      patientId: 'u_1',
      startDate: '2020-01-01',
      endDate: '2099-12-31',
    };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);
    repo.createManyIntakes.mockResolvedValue([]);

    await service.adminCreateMedication('u_1', {
      ...input,
      startDate: '2020-01-01',
      endDate: '2099-12-31',
    });

    expect(repo.createManyIntakes).toHaveBeenCalledTimes(1);
  });

  it('filters schedules by weekday', async () => {
    const createdMed = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.createMedication.mockResolvedValue(createdMed as any);
    // Schedule with a specific weekday that won't match today
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: 99, // impossible weekday, won't match
      intakeTime: '08:00',
    } as any);

    await service.adminCreateMedication('u_1', { ...input, startDate: '2020-01-01' });

    // No intakes generated because weekday doesn't match
    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });

  it('skips intake generation when endDate is in the past', async () => {
    const createdMed = {
      id: 'med_1',
      patientId: 'u_1',
      startDate: '2020-01-01',
      endDate: '2020-06-01',
    };
    repo.createMedication.mockResolvedValue(createdMed as any);
    repo.createSchedule.mockResolvedValue({
      id: 'sched_1',
      weekday: null,
      intakeTime: '08:00',
    } as any);

    await service.adminCreateMedication('u_1', {
      ...input,
      startDate: '2020-01-01',
      endDate: '2020-06-01',
    });

    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });
});

describe('adminUpdateMedication', () => {
  it('updates any medication without ownership check', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_any' } as any);
    repo.updateMedication.mockResolvedValue({ id: 'med_1', dosageLabel: '1000mg' } as any);

    const result = await service.adminUpdateMedication({ id: 'med_1', dosageLabel: '1000mg' });

    expect(result.dosageLabel).toBe('1000mg');
    expect(repo.updateMedication).toHaveBeenCalledWith('med_1', { dosageLabel: '1000mg' });
  });

  it('throws NOT_FOUND if medication does not exist', async () => {
    repo.getById.mockResolvedValue(null);

    await expect(
      service.adminUpdateMedication({ id: 'med_1', dosageLabel: '500mg' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('adminTodayByPatient', () => {
  it('generates and returns intakes for a patient', async () => {
    const med = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.listByPatient.mockResolvedValue([med] as any);
    repo.intakesExistForDate.mockResolvedValue(false);
    repo.listSchedulesByMedication.mockResolvedValue([
      { id: 'sched_1', weekday: null, intakeTime: '08:00' },
    ] as any);
    repo.createManyIntakes.mockResolvedValue([]);
    repo.listIntakesByDate.mockResolvedValue([]);

    const result = await service.adminTodayByPatient('u_1');

    expect(result.date).toBeDefined();
    expect(result.intakes).toEqual([]);
    expect(repo.createManyIntakes).toHaveBeenCalledTimes(1);
  });

  it('enriches intakes with schedule info', async () => {
    repo.listByPatient.mockResolvedValue([]);
    repo.listIntakesByDate.mockResolvedValue([
      {
        id: 'int_1',
        patientMedicationId: 'med_1',
        scheduleId: 'sched_1',
        scheduledDate: '2026-03-22',
        scheduledTime: '08:00',
        status: 'PENDING',
        takenAt: null,
        notes: null,
        createdAt: new Date(),
        medicationName: 'Doliprane',
        medicationForm: null,
        dosageLabel: null,
      },
    ] as any);
    repo.getSchedulesByIds.mockResolvedValue([
      { id: 'sched_1', intakeMoment: 'EVENING', quantity: '2', unit: 'ml' },
    ] as any);

    const result = await service.adminTodayByPatient('u_1');

    expect(result.intakes[0].intakeMoment).toBe('EVENING');
    expect(result.intakes[0].quantity).toBe('2');
    expect(result.intakes[0].unit).toBe('ml');
  });

  it('skips expired medications', async () => {
    const expiredMed = {
      id: 'med_1',
      patientId: 'u_1',
      startDate: '2020-01-01',
      endDate: '2020-12-31',
    };
    repo.listByPatient.mockResolvedValue([expiredMed] as any);
    repo.listIntakesByDate.mockResolvedValue([]);

    await service.adminTodayByPatient('u_1');

    expect(repo.intakesExistForDate).not.toHaveBeenCalled();
  });

  it('skips intake generation if already exist for today', async () => {
    const med = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.listByPatient.mockResolvedValue([med] as any);
    repo.intakesExistForDate.mockResolvedValue(true);
    repo.listIntakesByDate.mockResolvedValue([]);

    await service.adminTodayByPatient('u_1');

    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });

  it('handles intakes without scheduleId', async () => {
    repo.listByPatient.mockResolvedValue([]);
    repo.listIntakesByDate.mockResolvedValue([
      {
        id: 'int_1',
        patientMedicationId: 'med_1',
        scheduleId: null,
        scheduledDate: '2026-03-22',
        scheduledTime: '08:00',
        status: 'PENDING',
        takenAt: null,
        notes: null,
        createdAt: new Date(),
        medicationName: 'Test',
        medicationForm: null,
        dosageLabel: null,
      },
    ] as any);

    const result = await service.adminTodayByPatient('u_1');

    expect(result.intakes[0].intakeMoment).toBeNull();
    expect(result.intakes[0].quantity).toBeNull();
  });

  it('handles intake with deleted schedule', async () => {
    repo.listByPatient.mockResolvedValue([]);
    repo.listIntakesByDate.mockResolvedValue([
      {
        id: 'int_1',
        patientMedicationId: 'med_1',
        scheduleId: 'sched_deleted',
        scheduledDate: '2026-03-22',
        scheduledTime: '08:00',
        status: 'PENDING',
        takenAt: null,
        notes: null,
        createdAt: new Date(),
        medicationName: 'Test',
        medicationForm: null,
        dosageLabel: null,
      },
    ] as any);
    repo.getSchedulesByIds.mockResolvedValue([]);

    const result = await service.adminTodayByPatient('u_1');

    expect(result.intakes[0].intakeMoment).toBeNull();
  });

  it('filters schedules by weekday when generating intakes', async () => {
    const med = { id: 'med_1', patientId: 'u_1', startDate: '2020-01-01', endDate: null };
    repo.listByPatient.mockResolvedValue([med] as any);
    repo.intakesExistForDate.mockResolvedValue(false);
    repo.listSchedulesByMedication.mockResolvedValue([
      { id: 'sched_1', weekday: 99, intakeTime: '08:00' },
    ] as any);
    repo.listIntakesByDate.mockResolvedValue([]);

    await service.adminTodayByPatient('u_1');

    expect(repo.createManyIntakes).not.toHaveBeenCalled();
  });
});

describe('adminDeleteMedication', () => {
  it('deletes any medication without ownership check', async () => {
    repo.getById.mockResolvedValue({ id: 'med_1', patientId: 'u_any' } as any);
    repo.deleteMedication.mockResolvedValue({ id: 'med_1' } as any);

    await service.adminDeleteMedication('med_1');

    expect(repo.deleteMedication).toHaveBeenCalledWith('med_1');
  });

  it('throws NOT_FOUND if medication does not exist', async () => {
    repo.getById.mockResolvedValue(null);

    await expect(service.adminDeleteMedication('med_1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
