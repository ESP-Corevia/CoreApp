/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { beforeEach, describe, expect, it } from 'vitest';

import { authMock, createTestCaller, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

describe('adminDoctorsRouter', () => {
  describe('listDoctors', () => {
    beforeEach(() => {
      mockServices.doctorsService.listAllAdmin.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('returns paginated doctors from the service', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockResponse = {
        doctors: [
          {
            id: 'doc-1',
            userId: 'user-1',
            specialty: 'Cardiology',
            address: '10 Rue de Rivoli',
            city: 'Paris',
            name: 'Dr. Smith',
            email: 'smith@example.com',
            image: null,
          },
        ],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        perPage: 10,
      };

      mockServices.doctorsService.listAllAdmin.mockResolvedValue(mockResponse);

      const result = await caller.admin.listDoctors({
        page: 1,
        perPage: 10,
        search: 'smith',
        specialty: 'Cardiology',
        city: 'Paris',
      });

      expect(result).toEqual(mockResponse);
      expect(mockServices.doctorsService.listAllAdmin).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        search: 'smith',
        specialty: 'Cardiology',
        city: 'Paris',
      });
    });

    it('works with minimal input', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const emptyResponse = {
        doctors: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        perPage: 10,
      };

      mockServices.doctorsService.listAllAdmin.mockResolvedValue(emptyResponse);

      const result = await caller.admin.listDoctors({ page: 1, perPage: 10 });

      expect(result).toEqual(emptyResponse);
    });
  });

  describe('createDoctor', () => {
    beforeEach(() => {
      mockServices.doctorsService.createProfile.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('creates a doctor profile and returns it', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockCreated = {
        id: 'doc-new',
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        specialty: 'Cardiology',
        address: '10 Rue Test',
        city: 'Paris',
      };

      mockServices.doctorsService.createProfile.mockResolvedValue(mockCreated);

      const result = await caller.admin.createDoctor({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        specialty: 'Cardiology',
        address: '10 Rue Test',
        city: 'Paris',
      });

      expect(result).toEqual(mockCreated);
      expect(mockServices.doctorsService.createProfile).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        { specialty: 'Cardiology', address: '10 Rue Test', city: 'Paris' },
      );
    });

    it('propagates service errors', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      const { TRPCError } = await import('@trpc/server');

      mockServices.doctorsService.createProfile.mockRejectedValue(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User role is "patient", expected "doctor"',
        }),
      );

      await expect(
        caller.admin.createDoctor({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          specialty: 'Cardiology',
          address: '10 Rue Test',
          city: 'Paris',
        }),
      ).rejects.toThrow('User role is "patient", expected "doctor"');
    });
  });

  describe('updateDoctor', () => {
    beforeEach(() => {
      mockServices.doctorsService.updateProfile.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('updates a doctor profile and returns it', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockUpdated = {
        id: 'doc-1',
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        specialty: 'Oncology',
        address: '10 Rue Test',
        city: 'Lyon',
      };

      mockServices.doctorsService.updateProfile.mockResolvedValue(mockUpdated);

      const result = await caller.admin.updateDoctor({
        userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        specialty: 'Oncology',
        city: 'Lyon',
      });

      expect(result).toEqual(mockUpdated);
      expect(mockServices.doctorsService.updateProfile).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        { specialty: 'Oncology', city: 'Lyon' },
      );
    });

    it('returns NOT_FOUND when service returns null', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.doctorsService.updateProfile.mockResolvedValue(null as any);

      await expect(
        caller.admin.updateDoctor({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          specialty: 'Oncology',
        }),
      ).rejects.toThrow('Doctor profile not found');
    });

    it('re-throws TRPCError from service', async () => {
      const caller = createTestCaller({ customSession: fakeSession });
      const { TRPCError } = await import('@trpc/server');

      mockServices.doctorsService.updateProfile.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Doctor profile not found' }),
      );

      await expect(
        caller.admin.updateDoctor({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          specialty: 'Oncology',
        }),
      ).rejects.toThrow('Doctor profile not found');
    });

    it('returns INTERNAL_SERVER_ERROR for unexpected errors', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.doctorsService.updateProfile.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        caller.admin.updateDoctor({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          specialty: 'Oncology',
        }),
      ).rejects.toThrow('Failed to update doctor profile');
    });
  });
});
