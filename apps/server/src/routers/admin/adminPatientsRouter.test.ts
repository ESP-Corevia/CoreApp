/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { beforeEach, describe, expect, it } from 'vitest';

import { authMock, createTestCaller, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

describe('adminPatientsRouter', () => {
  describe('listPatients', () => {
    beforeEach(() => {
      mockServices.patientsService.listAllAdmin.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('returns paginated patients from the service', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockResponse = {
        patients: [
          {
            userId: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            emailVerified: true,
            image: null,
            role: 'patient',
            banned: false,
            createdAt: new Date('2099-01-01'),
            updatedAt: null,
            patientId: 'pat-1',
            dateOfBirth: '1990-05-20',
            gender: 'MALE',
            phone: null,
            patientAddress: null,
            bloodType: null,
            allergies: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
          },
        ],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        perPage: 10,
      };

      mockServices.patientsService.listAllAdmin.mockResolvedValue(mockResponse);

      const result = await caller.admin.listPatients({
        page: 1,
        perPage: 10,
        search: 'john',
      });

      expect(result).toEqual(mockResponse);
      expect(mockServices.patientsService.listAllAdmin).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        search: 'john',
        gender: undefined,
      });
    });

    it('works with minimal input', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const emptyResponse = {
        patients: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        perPage: 10,
      };

      mockServices.patientsService.listAllAdmin.mockResolvedValue(emptyResponse);

      const result = await caller.admin.listPatients({ page: 1, perPage: 10 });

      expect(result).toEqual(emptyResponse);
    });
  });

  describe('createPatient', () => {
    beforeEach(() => {
      mockServices.patientsService.createProfile.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('creates a patient profile and returns it', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockCreated = {
        id: 'pat-new',
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dateOfBirth: '1990-05-20',
        gender: 'MALE' as const,
        phone: null,
        address: null,
        bloodType: null,
        allergies: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
      };

      mockServices.patientsService.createProfile.mockResolvedValue(mockCreated);

      const result = await caller.admin.createPatient({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dateOfBirth: '1990-05-20',
        gender: 'MALE',
      });

      expect(result).toEqual(mockCreated);
      expect(mockServices.patientsService.createProfile).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        expect.objectContaining({ dateOfBirth: '1990-05-20', gender: 'MALE' }),
      );
    });

    it('propagates service errors', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      const { TRPCError } = await import('@trpc/server');

      mockServices.patientsService.createProfile.mockRejectedValue(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User role is "doctor", expected "patient"',
        }),
      );

      await expect(
        caller.admin.createPatient({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          dateOfBirth: '1990-05-20',
          gender: 'MALE',
        }),
      ).rejects.toThrow('User role is "doctor", expected "patient"');
    });
  });

  describe('updatePatient', () => {
    beforeEach(() => {
      mockServices.patientsService.updateProfile.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('updates a patient profile and returns it', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockUpdated = {
        id: 'pat-1',
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        dateOfBirth: '1990-05-20',
        gender: 'MALE' as const,
        phone: '+33612345678',
        address: null,
        bloodType: 'A+' as const,
        allergies: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
      };

      mockServices.patientsService.updateProfile.mockResolvedValue(mockUpdated);

      const result = await caller.admin.updatePatient({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        phone: '+33612345678',
        bloodType: 'A+',
      });

      expect(result).toEqual(mockUpdated);
      expect(mockServices.patientsService.updateProfile).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        { phone: '+33612345678', bloodType: 'A+' },
      );
    });

    it('returns NOT_FOUND when service returns null', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.patientsService.updateProfile.mockResolvedValue(null as any);

      await expect(
        caller.admin.updatePatient({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          phone: '+33612345678',
        }),
      ).rejects.toThrow('Patient profile not found');
    });

    it('re-throws TRPCError from service', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      const { TRPCError } = await import('@trpc/server');

      mockServices.patientsService.updateProfile.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' }),
      );

      await expect(
        caller.admin.updatePatient({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          phone: '+33612345678',
        }),
      ).rejects.toThrow('Patient profile not found');
    });

    it('returns INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.patientsService.updateProfile.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        caller.admin.updatePatient({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          phone: '+33612345678',
        }),
      ).rejects.toThrow('Failed to update patient profile');
    });
  });

  describe('deletePatient', () => {
    beforeEach(() => {
      mockServices.patientsService.deleteProfile.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('deletes a patient profile successfully', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.patientsService.deleteProfile.mockResolvedValue({ id: 'pat-1' });

      const result = await caller.admin.deletePatient({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      });

      expect(result).toEqual({ id: 'pat-1' });
      expect(mockServices.patientsService.deleteProfile).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      );
    });

    it('propagates service errors', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      const { TRPCError } = await import('@trpc/server');

      mockServices.patientsService.deleteProfile.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' }),
      );

      await expect(
        caller.admin.deletePatient({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        }),
      ).rejects.toThrow('Patient profile not found');
    });

    it('rejects non-uuid userId', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      await expect(caller.admin.deletePatient({ userId: 'not-a-uuid' })).rejects.toThrow();
    });
  });
});
