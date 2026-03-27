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

    it('returns NOT_FOUND when doctor does not exist', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.doctorsService.updateProfile.mockRejectedValue(
        new Error('Doctor profile not found'),
      );

      await expect(
        caller.admin.updateDoctor({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          specialty: 'Oncology',
        }),
      ).rejects.toThrow('Doctor profile not found');
    });
  });

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

    it('returns NOT_FOUND when patient does not exist', async () => {
      const caller = createTestCaller({ customSession: fakeSession });

      mockServices.patientsService.updateProfile.mockRejectedValue(
        new Error('Patient profile not found'),
      );

      await expect(
        caller.admin.updatePatient({
          userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          phone: '+33612345678',
        }),
      ).rejects.toThrow('Patient profile not found');
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
