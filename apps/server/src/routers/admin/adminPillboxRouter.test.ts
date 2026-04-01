import { beforeEach, describe, expect, it } from 'vitest';

import { authMock, createTestCaller, fakeAdminSession, fakeSession } from '../../../test/caller';
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

beforeEach(() => {
  mockServices.medicationsService.adminListAll.mockReset();
  mockServices.medicationsService.adminCreateMedication.mockReset();
  mockServices.medicationsService.adminUpdateMedication.mockReset();
  mockServices.medicationsService.adminDeleteMedication.mockReset();
  mockServices.medicationsService.adminTodayByPatient.mockReset();
  authMock.api.userHasPermission.mockReset();
});

describe('admin.adminListPillbox', () => {
  it('rejects non-admin', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.admin.adminListPillbox({})).rejects.toThrow(
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
    const result = await caller.admin.adminListPillbox({});

    expect(result.items).toEqual([]);
  });
});

describe('admin.adminCreateMedication', () => {
  it('calls service with patientId and input', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminCreateMedication.mockResolvedValue(fakeMedDetail);

    const caller = createTestCaller({ customSession: fakeAdminSession });
    await caller.admin.adminCreateMedication({
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

describe('admin.adminUpdateMedication', () => {
  it('calls service with input', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminUpdateMedication.mockResolvedValue(fakeMed);

    const caller = createTestCaller({ customSession: fakeAdminSession });
    await caller.admin.adminUpdateMedication({ id: UUID, dosageLabel: '1000mg' });

    expect(mockServices.medicationsService.adminUpdateMedication).toHaveBeenCalledWith(
      expect.objectContaining({ id: UUID, dosageLabel: '1000mg' }),
    );
  });
});

describe('admin.adminDeleteMedication', () => {
  it('rejects non-admin', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: false, error: null });
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.admin.adminDeleteMedication({ id: UUID })).rejects.toThrow(
      'You must be an admin to access this resource',
    );
  });

  it('allows admin to delete', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminDeleteMedication.mockResolvedValue({ id: UUID });

    const caller = createTestCaller({ customSession: fakeAdminSession });
    const result = await caller.admin.adminDeleteMedication({ id: UUID });

    expect(result.id).toBe(UUID);
  });
});

describe('admin.adminTodayByPatient', () => {
  it('calls service with patientId', async () => {
    authMock.api.userHasPermission.mockResolvedValue({ success: true, error: null });
    mockServices.medicationsService.adminTodayByPatient.mockResolvedValue({
      date: '2025-01-01',
      intakes: [],
    });

    const caller = createTestCaller({ customSession: fakeAdminSession });
    await caller.admin.adminTodayByPatient({ patientId: UUID2 });

    expect(mockServices.medicationsService.adminTodayByPatient).toHaveBeenCalledWith(UUID2);
  });
});
