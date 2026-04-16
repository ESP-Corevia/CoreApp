import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeAdminSession, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

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
  mockServices.medicationsService.listMine.mockReset();
  mockServices.medicationsService.detail.mockReset();
  mockServices.medicationsService.createMedication.mockReset();
  mockServices.medicationsService.updateMedication.mockReset();
  mockServices.medicationsService.deleteMedication.mockReset();
  mockServices.medicationsService.addSchedule.mockReset();
  mockServices.medicationsService.updateSchedule.mockReset();
  mockServices.medicationsService.deleteSchedule.mockReset();
  mockServices.medicationsService.today.mockReset();
  mockServices.medicationsService.intakeHistory.mockReset();
  mockServices.medicationsService.markIntakeTaken.mockReset();
  mockServices.medicationsService.markIntakeSkipped.mockReset();
});

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

describe('pillbox.intakeHistory', () => {
  it('rejects unauthenticated', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(
      caller.pillbox.intakeHistory({ from: '2025-06-15', to: '2025-06-20' }),
    ).rejects.toThrow('Authentication required');
  });

  it('calls service with session userId and date range', async () => {
    mockServices.medicationsService.intakeHistory.mockResolvedValue({
      days: [
        { date: '2025-06-15', allTaken: true },
        { date: '2025-06-16', allTaken: null },
      ],
    });

    const caller = createTestCaller({ customSession: fakeSession });
    const result = await caller.pillbox.intakeHistory({
      from: '2025-06-15',
      to: '2025-06-16',
    });

    expect(mockServices.medicationsService.intakeHistory).toHaveBeenCalledWith(
      'u_1',
      '2025-06-15',
      '2025-06-16',
    );
    expect(result.days).toHaveLength(2);
    expect(result.days[0].allTaken).toBe(true);
    expect(result.days[1].allTaken).toBeNull();
  });

  it('rejects invalid date format', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(
      caller.pillbox.intakeHistory({ from: 'not-a-date', to: '2025-06-20' }),
    ).rejects.toThrow();
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
