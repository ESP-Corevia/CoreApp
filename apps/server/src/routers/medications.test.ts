import { beforeEach, describe, expect, it } from 'vitest';

import {
  authMock,
  createTestCaller,
  fakeAdminSession,
  fakeDoctorSession,
  fakeSession,
} from '../../test/caller';
import { mockServices } from '../../test/services';

const UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const UUID2 = 'b1ffcd00-1a2b-4ef8-bb6d-6bb9bd380a22';

const fakeMed = {
  id: UUID,
  patientId: UUID2,
  medicationExternalId: null,
  source: 'api-medicaments-fr',
  cis: null,
  cip: null,
  medicationName: 'Doliprane',
  medicationForm: 'comprimé',
  activeSubstances: null,
  dosageLabel: '500mg',
  instructions: null,
  startDate: '2025-01-01',
  endDate: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: null,
  patientName: 'John Doe',
  patientEmail: 'john.doe@example.com',
};

const fakeMedDetail = { ...fakeMed, schedules: [] };

const fakeSchedule = {
  id: UUID,
  patientMedicationId: UUID,
  weekday: null,
  intakeTime: '08:00',
  intakeMoment: 'MORNING' as const,
  quantity: '1',
  unit: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: null,
};

const fakeIntake = {
  id: UUID,
  patientMedicationId: UUID,
  scheduleId: null,
  scheduledDate: '2025-01-01',
  scheduledTime: '08:00',
  status: 'TAKEN' as const,
  takenAt: new Date(),
  notes: null,
  createdAt: new Date(),
};

beforeEach(() => {
  mockServices.medicationsService.search.mockReset();
  mockServices.medicationsService.getByCode.mockReset();
  mockServices.medicationsService.listMine.mockReset();
  mockServices.medicationsService.detail.mockReset();
  mockServices.medicationsService.createMedication.mockReset();
  mockServices.medicationsService.updateMedication.mockReset();
  mockServices.medicationsService.deleteMedication.mockReset();
  mockServices.medicationsService.addSchedule.mockReset();
  mockServices.medicationsService.updateSchedule.mockReset();
  mockServices.medicationsService.deleteSchedule.mockReset();
  mockServices.medicationsService.today.mockReset();
  mockServices.medicationsService.markIntakeTaken.mockReset();
  mockServices.medicationsService.markIntakeSkipped.mockReset();
  mockServices.medicationsService.adminListAll.mockReset();
  mockServices.medicationsService.adminCreateMedication.mockReset();
  mockServices.medicationsService.adminUpdateMedication.mockReset();
  mockServices.medicationsService.adminDeleteMedication.mockReset();
  mockServices.medicationsService.adminTodayByPatient.mockReset();
  authMock.api.userHasPermission.mockReset();
});

// ─── Authentication ─────────────────────────────────────────

describe('medications router - auth', () => {
  it('rejects unauthenticated search', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.medications.search({ query: 'test', page: 1, limit: 20 })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('rejects doctor role for search', async () => {
    const caller = createTestCaller({ customSession: fakeDoctorSession });
    await expect(caller.medications.search({ query: 'test', page: 1, limit: 20 })).rejects.toThrow(
      'Patient access required',
    );
  });

  it('allows patient to search', async () => {
    mockServices.medicationsService.search.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.medications.search({ query: 'test', page: 1, limit: 20 });

    expect(result.items).toEqual([]);
  });
});

// ─── Medications Search ─────────────────────────────────────

describe('medications.search', () => {
  it('validates minimum query length', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.medications.search({ query: 'ab', page: 1, limit: 20 })).rejects.toThrow();
  });

  it('passes params to service', async () => {
    mockServices.medicationsService.search.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      limit: 10,
    });

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.medications.search({ query: 'doliprane', page: 2, limit: 10 });

    expect(mockServices.medicationsService.search).toHaveBeenCalledWith({
      query: 'doliprane',
      page: 2,
      limit: 10,
    });
  });
});

// ─── Medications - getByCode ────────────────────────────────

describe('medications.getByCode', () => {
  it('passes params to service', async () => {
    mockServices.medicationsService.getByCode.mockResolvedValue(null);

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.medications.getByCode({ cis: '60234100' });

    expect(mockServices.medicationsService.getByCode).toHaveBeenCalledWith({ cis: '60234100' });
    expect(result).toBeNull();
  });
});

// ─── Pillbox - Patient ──────────────────────────────────────

describe('pillbox.listMine', () => {
  it('rejects unauthenticated', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.pillbox.listMine({})).rejects.toThrow('Authentication required');
  });

  it('calls service with session userId', async () => {
    mockServices.medicationsService.listMine.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.listMine({ page: 1, limit: 20 });

    expect(mockServices.medicationsService.listMine).toHaveBeenCalledWith(
      'u_1',
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });
});

describe('pillbox.detail', () => {
  it('passes isAdmin=false for patient', async () => {
    mockServices.medicationsService.detail.mockResolvedValue(fakeMedDetail);

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.detail({ id: UUID });

    expect(mockServices.medicationsService.detail).toHaveBeenCalledWith('u_1', UUID, false);
  });

  it('passes isAdmin=true for admin', async () => {
    mockServices.medicationsService.detail.mockResolvedValue(fakeMedDetail);

    const caller = createTestCaller({ customSession: fakeAdminSession });
    await caller.pillbox.detail({ id: UUID });

    expect(mockServices.medicationsService.detail).toHaveBeenCalledWith('admin_1', UUID, true);
  });
});

describe('pillbox.createMedication', () => {
  it('calls service with userId and input', async () => {
    mockServices.medicationsService.createMedication.mockResolvedValue(fakeMedDetail);

    const caller = createTestCaller({ customSession: fakeSession });
    const input = {
      medicationName: 'Doliprane',
      source: 'api-medicaments-fr',
      startDate: '2025-01-01',
      schedules: [{ intakeTime: '08:00', intakeMoment: 'MORNING' as const, quantity: '1' }],
    };
    await caller.pillbox.createMedication(input);

    expect(mockServices.medicationsService.createMedication).toHaveBeenCalledWith(
      'u_1',
      expect.objectContaining({ medicationName: 'Doliprane' }),
    );
  });
});

describe('pillbox.updateMedication', () => {
  it('calls service with userId and input', async () => {
    mockServices.medicationsService.updateMedication.mockResolvedValue(fakeMed);

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.updateMedication({ id: UUID, dosageLabel: '1000mg' });

    expect(mockServices.medicationsService.updateMedication).toHaveBeenCalledWith(
      'u_1',
      expect.objectContaining({ id: UUID, dosageLabel: '1000mg' }),
    );
  });
});

describe('pillbox.deleteMedication', () => {
  it('calls service with userId and id', async () => {
    mockServices.medicationsService.deleteMedication.mockResolvedValue({ id: UUID });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.pillbox.deleteMedication({ id: UUID });

    expect(mockServices.medicationsService.deleteMedication).toHaveBeenCalledWith('u_1', UUID);
    expect(result.id).toBe(UUID);
  });
});

describe('pillbox.addSchedule', () => {
  it('calls service with userId and input', async () => {
    mockServices.medicationsService.addSchedule.mockResolvedValue(fakeSchedule);

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.addSchedule({
      patientMedicationId: UUID,
      intakeTime: '08:00',
      intakeMoment: 'MORNING',
      quantity: '1',
    });

    expect(mockServices.medicationsService.addSchedule).toHaveBeenCalledWith(
      'u_1',
      expect.objectContaining({ patientMedicationId: UUID, intakeTime: '08:00' }),
      false,
    );
  });
});

describe('pillbox.updateSchedule', () => {
  it('calls service with userId and input', async () => {
    mockServices.medicationsService.updateSchedule.mockResolvedValue(fakeSchedule);

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.updateSchedule({ id: UUID, intakeTime: '09:00' });

    expect(mockServices.medicationsService.updateSchedule).toHaveBeenCalledWith(
      'u_1',
      expect.objectContaining({ id: UUID, intakeTime: '09:00' }),
      false,
    );
  });
});

describe('pillbox.deleteSchedule', () => {
  it('calls service with userId and id', async () => {
    mockServices.medicationsService.deleteSchedule.mockResolvedValue({ id: UUID });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.pillbox.deleteSchedule({ id: UUID });

    expect(mockServices.medicationsService.deleteSchedule).toHaveBeenCalledWith('u_1', UUID, false);
    expect(result.id).toBe(UUID);
  });
});

describe('pillbox.today', () => {
  it('calls service with session userId', async () => {
    mockServices.medicationsService.today.mockResolvedValue({
      date: '2025-01-01',
      intakes: [],
    });

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.today({});

    expect(mockServices.medicationsService.today).toHaveBeenCalledWith('u_1');
  });
});

describe('pillbox.markIntakeTaken', () => {
  it('calls service with userId and intakeId', async () => {
    mockServices.medicationsService.markIntakeTaken.mockResolvedValue(fakeIntake);

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.markIntakeTaken({ id: UUID });

    expect(mockServices.medicationsService.markIntakeTaken).toHaveBeenCalledWith(
      'u_1',
      UUID,
      undefined,
    );
  });
});

describe('pillbox.markIntakeSkipped', () => {
  it('calls service with userId and intakeId', async () => {
    mockServices.medicationsService.markIntakeSkipped.mockResolvedValue({
      ...fakeIntake,
      status: 'SKIPPED',
      takenAt: null,
    });

    const caller = createTestCaller({ customSession: fakeSession });
    await caller.pillbox.markIntakeSkipped({ id: UUID, notes: 'Nausée' });

    expect(mockServices.medicationsService.markIntakeSkipped).toHaveBeenCalledWith(
      'u_1',
      UUID,
      'Nausée',
    );
  });
});

// ─── Pillbox - Admin ────────────────────────────────────────

describe('pillbox.adminListAll', () => {
  it('rejects non-admin', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.pillbox.adminListAll({})).rejects.toThrow(
      'You must be an admin to access this resource',
    );
  });

  it('allows admin', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminListAll.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    const caller = createTestCaller({ customSession: fakeAdminSession });
    const result = await caller.pillbox.adminListAll({});

    expect(result.items).toEqual([]);
  });
});

describe('pillbox.adminCreateMedication', () => {
  it('calls service with patientId and input', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminCreateMedication.mockResolvedValue(fakeMedDetail);

    const caller = createTestCaller({ customSession: fakeAdminSession });
    await caller.pillbox.adminCreateMedication({
      patientId: UUID2,
      medicationName: 'Doliprane',
      source: 'api-medicaments-fr',
      startDate: '2025-01-01',
      schedules: [{ intakeTime: '08:00', intakeMoment: 'MORNING' as const, quantity: '1' }],
    });

    expect(mockServices.medicationsService.adminCreateMedication).toHaveBeenCalledWith(
      UUID2,
      expect.objectContaining({ medicationName: 'Doliprane' }),
    );
  });
});

describe('pillbox.adminUpdateMedication', () => {
  it('calls service with input', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminUpdateMedication.mockResolvedValue(fakeMed);

    const caller = createTestCaller({ customSession: fakeAdminSession });
    await caller.pillbox.adminUpdateMedication({ id: UUID, dosageLabel: '1000mg' });

    expect(mockServices.medicationsService.adminUpdateMedication).toHaveBeenCalledWith(
      expect.objectContaining({ id: UUID, dosageLabel: '1000mg' }),
    );
  });
});

describe('pillbox.adminDeleteMedication', () => {
  it('rejects non-admin', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.pillbox.adminDeleteMedication({ id: UUID })).rejects.toThrow(
      'You must be an admin to access this resource',
    );
  });

  it('allows admin to delete', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminDeleteMedication.mockResolvedValue({ id: UUID });

    const caller = createTestCaller({ customSession: fakeAdminSession });
    const result = await caller.pillbox.adminDeleteMedication({ id: UUID });

    expect(result.id).toBe(UUID);
  });
});

describe('pillbox.adminTodayByPatient', () => {
  it('calls service with patientId', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminTodayByPatient.mockResolvedValue({
      date: '2025-01-01',
      intakes: [],
    });

    const caller = createTestCaller({ customSession: fakeAdminSession });
    await caller.pillbox.adminTodayByPatient({ patientId: UUID2 });

    expect(mockServices.medicationsService.adminTodayByPatient).toHaveBeenCalledWith(UUID2);
  });
});
