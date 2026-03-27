/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { beforeEach, describe, expect, it } from 'vitest';

import { authMock, createTestCaller, fakeSession } from '../../../test/caller';
import { mockServices } from '../../../test/services';

describe('adminRouter', () => {
  describe('isAdmin', () => {
    it('returns true when user is admin', async () => {
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
      const caller = createTestCaller({
        customSession: fakeSession,
      });
      const res = await caller.admin.isAdmin({});
      expect(res).toEqual(true);
    });
  });

  it('returns Not authenticated error when session is not authenticated', async () => {
    const caller = createTestCaller({ customSession: null });
    await expect(caller.admin.isAdmin({})).rejects.toThrow('Authentication required');
  });
  it('returns Not authorized error when user is not admin', async () => {
    authMock.api.userHasPermission.mockResolvedValue({
      success: false,
      error: null,
    });
    const caller = createTestCaller({
      customSession: fakeSession,
    });
    await expect(caller.admin.isAdmin({})).rejects.toThrow(
      'You must be an admin to access this resource',
    );
  });
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

  describe('listAppointments', () => {
    beforeEach(() => {
      mockServices.appointmentsService.listAllAppointments.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('returns paginated appointments from the service', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockResponse = {
        appointments: [
          {
            id: 'appt-1',
            doctorId: 'doc-1',
            patientId: 'pat-1',
            date: '2099-06-15',
            time: '10:00',
            status: 'PENDING' as const,
            reason: 'Checkup',
            createdAt: new Date('2099-06-01'),
            doctorName: 'Dr. Smith',
            patientName: 'John Doe',
          },
        ],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        perPage: 10,
      };

      mockServices.appointmentsService.listAllAppointments.mockResolvedValue(mockResponse);

      const result = await caller.admin.listAppointments({
        page: 1,
        perPage: 10,
        status: ['PENDING'],
        from: '2099-01-01',
        to: '2099-12-31',
        sort: 'dateDesc',
      });

      expect(result).toEqual(mockResponse);
      expect(mockServices.appointmentsService.listAllAppointments).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
        search: undefined,
        status: ['PENDING'],
        from: '2099-01-01',
        to: '2099-12-31',
        doctorId: undefined,
        sort: 'dateDesc',
      });
    });

    it('works with minimal input', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const emptyResponse = {
        appointments: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        perPage: 10,
      };

      mockServices.appointmentsService.listAllAppointments.mockResolvedValue(emptyResponse);

      const result = await caller.admin.listAppointments({ page: 1, perPage: 10 });

      expect(result).toEqual(emptyResponse);
    });
  });

  describe('updateAppointmentStatus', () => {
    beforeEach(() => {
      mockServices.appointmentsService.updateAppointmentStatus.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('updates appointment status successfully', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockUpdated = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: '2099-06-15',
        time: '10:00',
        status: 'CONFIRMED' as const,
      };

      mockServices.appointmentsService.updateAppointmentStatus.mockResolvedValue(mockUpdated);

      const result = await caller.admin.updateAppointmentStatus({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        status: 'CONFIRMED',
      });

      expect(result).toEqual(mockUpdated);
      expect(mockServices.appointmentsService.updateAppointmentStatus).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'CONFIRMED',
      );
    });

    it('propagates service errors', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.appointmentsService.updateAppointmentStatus.mockRejectedValue(
        new Error('Cannot transition from COMPLETED to CONFIRMED'),
      );

      await expect(
        caller.admin.updateAppointmentStatus({
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          status: 'CONFIRMED',
        }),
      ).rejects.toThrow('Cannot transition from COMPLETED to CONFIRMED');
    });

    it('rejects invalid status values', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      await expect(
        caller.admin.updateAppointmentStatus({
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          status: 'INVALID' as any,
        }),
      ).rejects.toThrow();
    });

    it('rejects non-uuid id', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      await expect(
        caller.admin.updateAppointmentStatus({
          id: 'not-a-uuid',
          status: 'CONFIRMED',
        }),
      ).rejects.toThrow();
    });
  });

  describe('createAppointment', () => {
    beforeEach(() => {
      mockServices.appointmentsService.adminCreateAppointment.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('creates an appointment successfully', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockCreated = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        date: '2099-06-15',
        time: '10:00',
        status: 'PENDING' as const,
      };

      mockServices.appointmentsService.adminCreateAppointment.mockResolvedValue(mockCreated);

      const result = await caller.admin.createAppointment({
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        date: '2099-06-15',
        time: '10:00',
        reason: 'Checkup',
      });

      expect(result).toEqual(mockCreated);
      expect(mockServices.appointmentsService.adminCreateAppointment).toHaveBeenCalledWith({
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        date: '2099-06-15',
        time: '10:00',
        reason: 'Checkup',
      });
    });

    it('rejects invalid date format', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      await expect(
        caller.admin.createAppointment({
          doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
          date: 'not-a-date',
          time: '10:00',
        }),
      ).rejects.toThrow();
    });

    it('rejects non-uuid doctorId', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      await expect(
        caller.admin.createAppointment({
          doctorId: 'not-uuid',
          patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
          date: '2099-06-15',
          time: '10:00',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateAppointment', () => {
    beforeEach(() => {
      mockServices.appointmentsService.adminUpdateAppointment.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('updates an appointment successfully', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockUpdated = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        doctorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        date: '2099-07-01',
        time: '14:00',
        status: 'PENDING' as const,
        reason: 'Updated reason',
      };

      mockServices.appointmentsService.adminUpdateAppointment.mockResolvedValue(mockUpdated);

      const result = await caller.admin.updateAppointment({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        date: '2099-07-01',
        time: '14:00',
        reason: 'Updated reason',
      });

      expect(result).toEqual(mockUpdated);
      expect(mockServices.appointmentsService.adminUpdateAppointment).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        { date: '2099-07-01', time: '14:00', reason: 'Updated reason' },
      );
    });

    it('rejects non-uuid id', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      await expect(
        caller.admin.updateAppointment({
          id: 'not-a-uuid',
          date: '2099-07-01',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteAppointment', () => {
    beforeEach(() => {
      mockServices.appointmentsService.adminDeleteAppointment.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });

    it('deletes an appointment successfully', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      const mockDeleted = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: '2099-06-15',
        time: '10:00',
        status: 'PENDING' as const,
      };

      mockServices.appointmentsService.adminDeleteAppointment.mockResolvedValue(mockDeleted);

      const result = await caller.admin.deleteAppointment({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      });

      expect(result).toEqual(mockDeleted);
      expect(mockServices.appointmentsService.adminDeleteAppointment).toHaveBeenCalledWith(
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      );
    });

    it('propagates service errors', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.appointmentsService.adminDeleteAppointment.mockRejectedValue(
        new Error('Appointment not found'),
      );

      await expect(
        caller.admin.deleteAppointment({
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        }),
      ).rejects.toThrow('Appointment not found');
    });

    it('rejects non-uuid id', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      await expect(
        caller.admin.deleteAppointment({
          id: 'not-a-uuid',
        }),
      ).rejects.toThrow();
    });
  });

  describe('listUsers', () => {
    beforeEach(() => {
      mockServices.usersService.listUsers.mockReset();
      authMock.api.userHasPermission.mockResolvedValue({
        success: true,
        error: null,
      });
    });
    it('returns paginated users from the service with parsed filters & sorting', async () => {
      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: 'test-user-123' },
      });

      const mockResponse = {
        users: [
          {
            id: 'u1',
            email: 'john@example.com',
            name: 'John Doe',
            role: 'user',
            createdAt: new Date('2024-01-01'),
            updatedAt: null,
            emailVerified: true,
            image: null,
            banned: false,
            banReason: null,
            banExpires: null,
            lastLoginMethod: 'google',
          },
        ],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        perPage: 10,
      };

      mockServices.usersService.listUsers.mockResolvedValue({
        ...mockResponse,
        users: mockResponse.users.map(u => ({
          ...u,
          seeded: false,
        })),
      });

      const result = await caller.admin.listUsers({
        page: 1,
        perPage: 10,
        search: 'john',
        searchInFields: ['email', 'name'],
        sorting: JSON.stringify({ id: 'email', desc: true }),
        filters: JSON.stringify([
          {
            id: 'emailVerified',
            operator: 'eq',
            value: true,
            variant: 'boolean',
            filterId: 'flt-1',
          },
        ]),
      });

      expect(result).toEqual(mockResponse);

      expect(mockServices.usersService.listUsers).toHaveBeenCalledWith({
        params: {
          page: 1,
          perPage: 10,
          search: 'john',
          searchInFields: ['email', 'name'],
          sorting: { id: 'email', desc: true },
          filters: [
            {
              id: 'emailVerified',
              operator: 'eq',
              value: true,
              variant: 'boolean',
              filterId: 'flt-1',
            },
          ],
        },
        userId: 'test-user-123',
      });
    });

    it('works with minimal input', async () => {
      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: 'admin-user' },
      });

      const emptyResponse = {
        users: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        perPage: 10,
      };

      mockServices.usersService.listUsers.mockResolvedValue(emptyResponse);

      const result = await caller.admin.listUsers({
        page: 1,
        perPage: 10,
      });

      expect(result).toEqual(emptyResponse);

      expect(mockServices.usersService.listUsers).toHaveBeenCalledWith({
        params: {
          page: 1,
          perPage: 10,
          search: undefined,
          searchInFields: ['email', 'name'], // default
          sorting: undefined,
          filters: undefined,
        },
        userId: 'admin-user',
      });
    });
  });
});
