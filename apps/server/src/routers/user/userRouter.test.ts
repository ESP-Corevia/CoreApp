import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authMock,
  createTestCaller,
  fakeAdminSession,
  fakeDoctorSession,
  fakeSession,
} from '../../../test/caller';
import { mockServices } from '../../../test/services';

const BASE_USER = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  createdAt: faker.date.past(),
  updatedAt: null,
  image: null,
  lastLoginMethod: null,
  emailVerified: true,
  role: null,
};

const fakePatientUser = { ...BASE_USER, role: 'patient' };
const fakeDoctorUser = { ...BASE_USER, role: 'doctor' };
const fakeAdminUser = { ...BASE_USER, role: 'admin' };

const fakeDoctorProfile = {
  // id: faker.string.uuid(),
  // userId: faker.string.uuid(),
  specialty: 'Cardiology',
  address: '10 Rue de Rivoli',
  city: 'Paris',
  verified: true,
};

const fakePatientProfile = {
  // id: faker.string.uuid(),
  dateOfBirth: '1990-05-20',
  gender: 'MALE' as const,
  phone: null,
  address: null,
  bloodType: null,
  allergies: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
};

beforeEach(() => vi.clearAllMocks());

describe('userRouter', () => {
  describe('setInitialRole', () => {
    it('updates the role from patient to doctor', async () => {
      authMock.api.getUser.mockResolvedValue({ ...fakePatientUser, role: 'patient' } as never);
      authMock.api.adminUpdateUser.mockResolvedValue({} as never);

      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      const res = await caller.user.setInitialRole({ role: 'doctor' });

      expect(res).toEqual({ success: true });
      // Regression: getUser must be called with { id }, not { userId }
      expect(authMock.api.getUser).toHaveBeenCalledWith({
        query: { id: fakePatientUser.id },
      });
      expect(authMock.api.adminUpdateUser).toHaveBeenCalledWith({
        body: { userId: fakePatientUser.id, data: { role: 'doctor' } },
      });
    });

    it('updates the role from patient to patient (idempotent default role)', async () => {
      authMock.api.getUser.mockResolvedValue({ ...fakePatientUser, role: 'patient' } as never);
      authMock.api.adminUpdateUser.mockResolvedValue({} as never);

      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      await expect(caller.user.setInitialRole({ role: 'patient' })).resolves.toEqual({
        success: true,
      });
      expect(authMock.api.adminUpdateUser).toHaveBeenCalledWith({
        body: { userId: fakePatientUser.id, data: { role: 'patient' } },
      });
    });

    it('throws NOT_FOUND when the user cannot be fetched', async () => {
      authMock.api.getUser.mockResolvedValue(null as never);

      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      await expect(caller.user.setInitialRole({ role: 'doctor' })).rejects.toThrow(
        'User not found',
      );
      expect(authMock.api.adminUpdateUser).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when current role is doctor', async () => {
      authMock.api.getUser.mockResolvedValue({ ...fakeDoctorUser, role: 'doctor' } as never);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await expect(caller.user.setInitialRole({ role: 'patient' })).rejects.toThrow(
        'already been set',
      );
      expect(authMock.api.adminUpdateUser).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when current role is admin', async () => {
      authMock.api.getUser.mockResolvedValue({ ...fakeAdminUser, role: 'admin' } as never);

      const caller = createTestCaller({ customSession: fakeAdminSession });
      await expect(caller.user.setInitialRole({ role: 'doctor' })).rejects.toThrow(
        'already been set',
      );
      expect(authMock.api.adminUpdateUser).not.toHaveBeenCalled();
    });

    it('rejects admin as a target role (zod input validation)', async () => {
      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      await expect(caller.user.setInitialRole({ role: 'admin' as never })).rejects.toThrow();
      expect(authMock.api.getUser).not.toHaveBeenCalled();
    });

    it('throws when session is not authenticated', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.user.setInitialRole({ role: 'doctor' })).rejects.toThrow(
        'Authentication required',
      );
      expect(authMock.api.getUser).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('returns base user + null profiles when patient has no profile yet', async () => {
      mockServices.usersService.getMe.mockResolvedValue(fakePatientUser);
      mockServices.patientsService.getByUserId.mockResolvedValue(null);

      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      const res = await caller.user.getMe({});

      expect(res.user).toMatchObject({
        ...fakePatientUser,
        patientProfile: null,
        doctorProfile: null,
      });
      expect(mockServices.patientsService.getByUserId).toHaveBeenCalledWith(fakePatientUser.id);
      expect(mockServices.doctorsService.getByUserId).not.toHaveBeenCalled();
    });

    it('returns patient profile when role is patient and profile exists', async () => {
      mockServices.usersService.getMe.mockResolvedValue(fakePatientUser);
      mockServices.patientsService.getByUserId.mockResolvedValue(fakePatientProfile);

      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      const res = await caller.user.getMe({});

      expect(res.user.patientProfile).toEqual(fakePatientProfile);
      expect(res.user.doctorProfile).toBeNull();
    });

    it('returns doctor profile when role is doctor', async () => {
      mockServices.usersService.getMe.mockResolvedValue(fakeDoctorUser);
      mockServices.doctorsService.getByUserId.mockResolvedValue(fakeDoctorProfile);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const res = await caller.user.getMe({});

      expect(res.user.doctorProfile).toEqual(fakeDoctorProfile);
      expect(res.user.patientProfile).toBeNull();
      expect(mockServices.doctorsService.getByUserId).toHaveBeenCalledWith(
        fakeDoctorSession.userId,
      );
      expect(mockServices.patientsService.getByUserId).not.toHaveBeenCalled();
    });

    it('returns only base user for admin role', async () => {
      mockServices.usersService.getMe.mockResolvedValue(fakeAdminUser);

      const caller = createTestCaller({ customSession: fakeAdminSession });
      const res = await caller.user.getMe({});

      expect(res.user.doctorProfile).toBeNull();
      expect(res.user.patientProfile).toBeNull();
      expect(mockServices.doctorsService.getByUserId).not.toHaveBeenCalled();
      expect(mockServices.patientsService.getByUserId).not.toHaveBeenCalled();
    });

    it('throws when session is not authenticated', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.user.getMe({})).rejects.toThrow('Authentication required');
    });
  });

  describe('updateProfile', () => {
    it('updates base user name for any role', async () => {
      mockServices.usersService.getMe
        .mockResolvedValueOnce(fakePatientUser)
        .mockResolvedValueOnce({ ...fakePatientUser, name: 'New Name' });
      mockServices.usersService.updateMe.mockResolvedValue({
        ...BASE_USER,
        name: 'New Name',
        banned: false,
        banReason: null,
        banExpires: null,
        seeded: null,
      });
      mockServices.patientsService.getByUserId.mockResolvedValue(null);

      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      const res = await caller.user.updateProfile({ name: 'New Name' });

      expect(mockServices.usersService.updateMe).toHaveBeenCalledWith(fakePatientUser.id, {
        name: 'New Name',
      });
      expect(res.user.name).toBe('New Name');
    });

    it('updates doctor profile fields when role is doctor', async () => {
      const updatedDoctor = { ...fakeDoctorProfile, city: 'Lyon' };
      mockServices.usersService.getMe
        .mockResolvedValueOnce(fakeDoctorUser)
        .mockResolvedValueOnce(fakeDoctorUser);
      mockServices.doctorsService.updateProfile.mockResolvedValue({
        ...updatedDoctor,
        userId: fakeDoctorUser.id,
        id: faker.string.uuid(),
      });

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      const res = await caller.user.updateProfile({ doctorProfile: { city: 'Lyon' } });

      expect(mockServices.doctorsService.updateProfile).toHaveBeenCalledWith(
        fakeDoctorSession.userId,
        { city: 'Lyon' },
      );
      expect(res.user.doctorProfile).toEqual(updatedDoctor);
    });

    it('upserts patient profile fields when role is patient', async () => {
      const input = { dateOfBirth: '1990-01-01', gender: 'FEMALE' as const };
      const upserted = {
        ...fakePatientProfile,
        ...input,
        userId: fakePatientUser.id,
        id: faker.string.uuid(),
      };
      mockServices.usersService.getMe
        .mockResolvedValueOnce(fakePatientUser)
        .mockResolvedValueOnce(fakePatientUser);
      mockServices.patientsService.upsert.mockResolvedValue(upserted);

      const caller = createTestCaller({
        customSession: { ...fakeSession, userId: fakePatientUser.id },
      });
      const res = await caller.user.updateProfile({ patientProfile: input });

      expect(mockServices.patientsService.upsert).toHaveBeenCalledWith(fakePatientUser.id, input);
      // eslint-disable-next-line ts/no-unused-vars
      const { id, userId, ...expected } = upserted;
      expect(res.user.patientProfile).toEqual(expected);
    });

    it('fetches existing doctor profile when no doctor fields provided', async () => {
      mockServices.usersService.getMe
        .mockResolvedValueOnce(fakeDoctorUser)
        .mockResolvedValueOnce(fakeDoctorUser);
      mockServices.doctorsService.getByUserId.mockResolvedValue(fakeDoctorProfile);

      const caller = createTestCaller({ customSession: fakeDoctorSession });
      await caller.user.updateProfile({ name: 'New Name' });

      expect(mockServices.doctorsService.updateProfile).not.toHaveBeenCalled();
      expect(mockServices.doctorsService.getByUserId).toHaveBeenCalledWith(
        fakeDoctorSession.userId,
      );
    });

    it('throws BAD_REQUEST when admin sends doctor profile fields', async () => {
      mockServices.usersService.getMe.mockResolvedValue(fakeAdminUser);

      const caller = createTestCaller({ customSession: fakeAdminSession });
      await expect(
        caller.user.updateProfile({ doctorProfile: { specialty: 'Cardiology' } }),
      ).rejects.toThrow();
    });

    it('throws when session is not authenticated', async () => {
      const caller = createTestCaller({ customSession: null });
      await expect(caller.user.updateProfile({ name: 'Test' })).rejects.toThrow(
        'Authentication required',
      );
    });
  });
});
