import type { ToolExecutionOptions } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createAdminTools } from './admin.tools';

const execOpts = {} as ToolExecutionOptions;

describe('createAdminTools', () => {
  it('exposes all admin tools and forwards arguments to the right caller/auth method', async () => {
    const caller = {
      admin: {
        listUsers: vi.fn().mockResolvedValue({ ok: 'listUsers' }),
        listAppointments: vi.fn().mockResolvedValue({ ok: 'listAppointments' }),
        listDoctors: vi.fn().mockResolvedValue({ ok: 'listDoctors' }),
        listPatients: vi.fn().mockResolvedValue({ ok: 'listPatients' }),
        adminListPillbox: vi.fn().mockResolvedValue({ ok: 'adminListPillbox' }),
        adminTodayByPatient: vi.fn().mockResolvedValue({ ok: 'adminTodayByPatient' }),
        createAppointment: vi.fn().mockResolvedValue({ ok: 'createAppointment' }),
        updateAppointment: vi.fn().mockResolvedValue({ ok: 'updateAppointment' }),
        deleteAppointment: vi.fn().mockResolvedValue({ ok: 'deleteAppointment' }),
        updateAppointmentStatus: vi.fn().mockResolvedValue({ ok: 'updateAppointmentStatus' }),
        createDoctor: vi.fn().mockResolvedValue({ ok: 'createDoctor' }),
        updateDoctor: vi.fn().mockResolvedValue({ ok: 'updateDoctor' }),
        createPatient: vi.fn().mockResolvedValue({ ok: 'createPatient' }),
        updatePatient: vi.fn().mockResolvedValue({ ok: 'updatePatient' }),
        deletePatient: vi.fn().mockResolvedValue({ ok: 'deletePatient' }),
      },
    };
    const auth = {
      api: {
        adminUpdateUser: vi.fn().mockResolvedValue({ ok: 'adminUpdateUser' }),
        banUser: vi.fn().mockResolvedValue({ ok: 'banUser' }),
        unbanUser: vi.fn().mockResolvedValue({ ok: 'unbanUser' }),
        removeUser: vi.fn().mockResolvedValue({ ok: 'removeUser' }),
        setUserPassword: vi.fn().mockResolvedValue({ ok: 'setUserPassword' }),
        userHasPermission: vi.fn().mockResolvedValue({ ok: 'userHasPermission' }),
      },
    };
    const headers = new Headers([['x-test', '1']]);

    const tools = createAdminTools({ caller, auth, headers } as never);

    expect(Object.keys(tools)).toEqual([
      'list_users',
      'list_appointments',
      'list_doctors',
      'list_patients',
      'list_medications',
      'get_patient_today_pillbox',
      'check_user_permission',
      'create_appointment',
      'update_appointment',
      'delete_appointment',
      'update_appointment_status',
      'create_doctor',
      'update_doctor',
      'create_patient',
      'update_patient',
      'delete_patient',
      'update_user',
      'ban_user',
      'unban_user',
      'remove_user',
      'set_user_password',
    ]);

    await expect(tools.list_users.execute?.({}, execOpts)).resolves.toEqual({ ok: 'listUsers' });
    expect(caller.admin.listUsers).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      search: undefined,
    });

    await expect(
      tools.list_appointments.execute?.(
        {
          page: 2,
          perPage: 5,
          search: 'alice',
          status: ['CONFIRMED'],
          from: '2026-01-01',
          to: '2026-01-31',
          doctorId: 'doctor-1',
          sort: 'dateAsc',
        },
        execOpts,
      ),
    ).resolves.toEqual({ ok: 'listAppointments' });
    expect(caller.admin.listAppointments).toHaveBeenCalledWith({
      page: 2,
      perPage: 5,
      search: 'alice',
      status: ['CONFIRMED'],
      from: '2026-01-01',
      to: '2026-01-31',
      doctorId: 'doctor-1',
      sort: 'dateAsc',
    });

    await expect(tools.list_doctors.execute?.({}, execOpts)).resolves.toEqual({
      ok: 'listDoctors',
    });
    expect(caller.admin.listDoctors).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      search: undefined,
      specialty: undefined,
      city: undefined,
    });

    await expect(
      tools.list_patients.execute?.({ search: 'bob', gender: 'MALE' }, execOpts),
    ).resolves.toEqual({ ok: 'listPatients' });
    expect(caller.admin.listPatients).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      search: 'bob',
      gender: 'MALE',
    });

    await expect(
      tools.list_medications.execute?.(
        { patientId: 'patient-1', search: 'ibuprofen', isActive: true },
        execOpts,
      ),
    ).resolves.toEqual({ ok: 'adminListPillbox' });
    expect(caller.admin.adminListPillbox).toHaveBeenCalledWith({
      patientId: 'patient-1',
      search: 'ibuprofen',
      isActive: true,
      page: 1,
      limit: 20,
    });

    await expect(
      tools.get_patient_today_pillbox.execute?.({ patientId: 'patient-1' }, execOpts),
    ).resolves.toEqual({ ok: 'adminTodayByPatient' });
    expect(caller.admin.adminTodayByPatient).toHaveBeenCalledWith({
      patientId: 'patient-1',
    });

    await expect(
      tools.check_user_permission.execute?.(
        { userId: 'user-1', permissions: { panel: ['access'] } },
        execOpts,
      ),
    ).resolves.toEqual({ ok: 'userHasPermission' });
    expect(auth.api.userHasPermission).toHaveBeenCalledWith({
      body: { userId: 'user-1', permissions: { panel: ['access'] } },
      headers,
    });

    await expect(
      tools.create_appointment.execute?.(
        { doctorId: 'doctor-1', patientId: 'patient-1', date: '2026-05-05', time: '09:30' },
        execOpts,
      ),
    ).resolves.toEqual({ ok: 'createAppointment' });
    expect(caller.admin.createAppointment).toHaveBeenCalledWith({
      doctorId: 'doctor-1',
      patientId: 'patient-1',
      date: '2026-05-05',
      time: '09:30',
      reason: undefined,
    });

    await expect(
      tools.update_appointment.execute?.({ id: 'appt-1', time: '10:00' }, execOpts),
    ).resolves.toEqual({ ok: 'updateAppointment' });
    expect(caller.admin.updateAppointment).toHaveBeenCalledWith({
      id: 'appt-1',
      date: undefined,
      time: '10:00',
      reason: undefined,
      doctorId: undefined,
      patientId: undefined,
    });

    await expect(tools.delete_appointment.execute?.({ id: 'appt-1' }, execOpts)).resolves.toEqual({
      ok: 'deleteAppointment',
    });
    expect(caller.admin.deleteAppointment).toHaveBeenCalledWith({ id: 'appt-1' });

    await expect(
      tools.update_appointment_status.execute?.({ id: 'appt-1', status: 'CANCELLED' }, execOpts),
    ).resolves.toEqual({ ok: 'updateAppointmentStatus' });
    expect(caller.admin.updateAppointmentStatus).toHaveBeenCalledWith({
      id: 'appt-1',
      status: 'CANCELLED',
    });

    const createDoctorInput = {
      userId: 'doctor-1',
      specialty: 'Cardiology',
      address: '1 Main St',
      city: 'Paris',
    };
    await expect(tools.create_doctor.execute?.(createDoctorInput, execOpts)).resolves.toEqual({
      ok: 'createDoctor',
    });
    expect(caller.admin.createDoctor).toHaveBeenCalledWith(createDoctorInput);

    await expect(
      tools.update_doctor.execute?.({ userId: 'doctor-1', city: 'Lyon' }, execOpts),
    ).resolves.toEqual({ ok: 'updateDoctor' });
    expect(caller.admin.updateDoctor).toHaveBeenCalledWith({
      userId: 'doctor-1',
      specialty: undefined,
      address: undefined,
      city: 'Lyon',
    });

    const createPatientInput = {
      userId: 'patient-1',
      dateOfBirth: '1990-02-03',
      gender: 'FEMALE' as const,
      phone: '123',
      address: '2 Main St',
      bloodType: 'A+' as const,
      allergies: 'Peanuts',
      emergencyContactName: 'Jane',
      emergencyContactPhone: '456',
    };
    await expect(tools.create_patient.execute?.(createPatientInput, execOpts)).resolves.toEqual({
      ok: 'createPatient',
    });
    expect(caller.admin.createPatient).toHaveBeenCalledWith(createPatientInput);

    await expect(
      tools.update_patient.execute?.({ userId: 'patient-1', allergies: 'Pollen' }, execOpts),
    ).resolves.toEqual({ ok: 'updatePatient' });
    expect(caller.admin.updatePatient).toHaveBeenCalledWith({
      userId: 'patient-1',
      dateOfBirth: undefined,
      gender: undefined,
      phone: undefined,
      address: undefined,
      bloodType: undefined,
      allergies: 'Pollen',
      emergencyContactName: undefined,
      emergencyContactPhone: undefined,
    });

    await expect(
      tools.delete_patient.execute?.({ userId: 'patient-1' }, execOpts),
    ).resolves.toEqual({ ok: 'deletePatient' });
    expect(caller.admin.deletePatient).toHaveBeenCalledWith({ userId: 'patient-1' });

    await expect(
      tools.update_user.execute?.({ userId: 'user-1', data: { role: 'doctor' } }, execOpts),
    ).resolves.toEqual({ ok: 'adminUpdateUser' });
    expect(auth.api.adminUpdateUser).toHaveBeenCalledWith({
      body: { userId: 'user-1', data: { role: 'doctor' } },
      headers,
    });

    await expect(
      tools.ban_user.execute?.(
        { userId: 'user-2', banReason: 'abuse', banExpiresIn: 3600 },
        execOpts,
      ),
    ).resolves.toEqual({ ok: 'banUser' });
    expect(auth.api.banUser).toHaveBeenCalledWith({
      body: { userId: 'user-2', banReason: 'abuse', banExpiresIn: 3600 },
      headers,
    });

    await expect(tools.unban_user.execute?.({ userId: 'user-2' }, execOpts)).resolves.toEqual({
      ok: 'unbanUser',
    });
    expect(auth.api.unbanUser).toHaveBeenCalledWith({
      body: { userId: 'user-2' },
      headers,
    });

    await expect(tools.remove_user.execute?.({ userId: 'user-3' }, execOpts)).resolves.toEqual({
      ok: 'removeUser',
    });
    expect(auth.api.removeUser).toHaveBeenCalledWith({
      body: { userId: 'user-3' },
      headers,
    });

    await expect(
      tools.set_user_password.execute?.({ userId: 'user-4', newPassword: 'secret' }, execOpts),
    ).resolves.toEqual({ ok: 'setUserPassword' });
    expect(auth.api.setUserPassword).toHaveBeenCalledWith({
      body: { userId: 'user-4', newPassword: 'secret' },
      headers,
    });
  });
});
