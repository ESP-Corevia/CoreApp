import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it } from 'vitest';

import { createTestCaller, fakeDoctorSession, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

const UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PATIENT_ID = 'b1ffcd00-1a2b-4ef8-bb6d-6bb9bd380a22';

const fakeMedDetail = {
  id: UUID,
  patientId: PATIENT_ID,
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
  schedules: [],
};

beforeEach(() => {
  mockServices.appointmentsService.hasPatientRelationship.mockReset();
  mockServices.medicationsService.doctorListPatientPillbox.mockReset();
  mockServices.medicationsService.doctorViewPatientToday.mockReset();
  mockServices.medicationsService.doctorViewMedicationDetail.mockReset();
});

describe('doctor.pillbox', () => {
  it('rejects unauthenticated requests', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.doctor.pillbox.listByPatient({ patientId: PATIENT_ID })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('rejects patient role', async () => {
    const caller = createTestCaller({ customSession: fakeSession });
    await expect(caller.doctor.pillbox.listByPatient({ patientId: PATIENT_ID })).rejects.toThrow(
      'Doctor access required',
    );
  });

  describe('listByPatient', () => {
    it('returns patient medications when doctor has relationship', async () => {
      mockServices.appointmentsService.hasPatientRelationship.mockResolvedValue(true);
      mockServices.medicationsService.doctorListPatientPillbox.mockResolvedValue({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.pillbox.listByPatient({ patientId: PATIENT_ID });

      expect(result.items).toEqual([]);
      expect(mockServices.appointmentsService.hasPatientRelationship).toHaveBeenCalledWith(
        fakeDoctorSession.userId,
        PATIENT_ID,
      );
      expect(mockServices.medicationsService.doctorListPatientPillbox).toHaveBeenCalledWith(
        PATIENT_ID,
        expect.objectContaining({ patientId: PATIENT_ID }),
      );
    });

    it('rejects when doctor has no relationship with patient', async () => {
      mockServices.appointmentsService.hasPatientRelationship.mockResolvedValue(false);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.pillbox.listByPatient({ patientId: PATIENT_ID })).rejects.toThrow(
        'do not have access',
      );
    });

    it('rejects invalid patientId', async () => {
      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.pillbox.listByPatient({ patientId: 'bad-id' })).rejects.toThrow();
    });
  });

  describe('todayByPatient', () => {
    it('returns today pillbox when doctor has relationship', async () => {
      mockServices.appointmentsService.hasPatientRelationship.mockResolvedValue(true);
      mockServices.medicationsService.doctorViewPatientToday.mockResolvedValue({
        date: '2025-01-01',
        intakes: [],
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.pillbox.todayByPatient({ patientId: PATIENT_ID });

      expect(result.date).toBe('2025-01-01');
      expect(result.intakes).toEqual([]);
      expect(mockServices.medicationsService.doctorViewPatientToday).toHaveBeenCalledWith(
        PATIENT_ID,
      );
    });

    it('rejects when doctor has no relationship with patient', async () => {
      mockServices.appointmentsService.hasPatientRelationship.mockResolvedValue(false);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.pillbox.todayByPatient({ patientId: PATIENT_ID })).rejects.toThrow(
        'do not have access',
      );
    });
  });

  describe('medicationDetail', () => {
    it('returns medication detail when doctor has relationship', async () => {
      mockServices.medicationsService.doctorViewMedicationDetail.mockResolvedValue(fakeMedDetail);
      mockServices.appointmentsService.hasPatientRelationship.mockResolvedValue(true);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const result = await caller.doctor.pillbox.medicationDetail({ id: UUID });

      expect(result.medicationName).toBe('Doliprane');
      expect(mockServices.medicationsService.doctorViewMedicationDetail).toHaveBeenCalledWith(UUID);
      expect(mockServices.appointmentsService.hasPatientRelationship).toHaveBeenCalledWith(
        fakeDoctorSession.userId,
        PATIENT_ID,
      );
    });

    it('rejects when doctor has no relationship with medication patient', async () => {
      mockServices.medicationsService.doctorViewMedicationDetail.mockResolvedValue(fakeMedDetail);
      mockServices.appointmentsService.hasPatientRelationship.mockResolvedValue(false);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.pillbox.medicationDetail({ id: UUID })).rejects.toThrow(
        'do not have access',
      );
    });

    it('propagates NOT_FOUND when medication does not exist', async () => {
      mockServices.medicationsService.doctorViewMedicationDetail.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Medication not found' }),
      );

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.doctor.pillbox.medicationDetail({ id: UUID })).rejects.toThrow(
        'not found',
      );
    });
  });
});
