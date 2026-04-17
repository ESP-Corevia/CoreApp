import type { ToolExecutionOptions } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createDoctorTools } from './doctor.tools';

const execOpts = {} as ToolExecutionOptions;

const mockCaller = {
  doctor: {
    appointments: {
      listMine: vi.fn().mockResolvedValue({ items: [] }),
      detail: vi.fn().mockResolvedValue({ id: 'a1' }),
      updateStatus: vi.fn().mockResolvedValue({ success: true }),
    },
    pillbox: {
      listByPatient: vi.fn().mockResolvedValue({ items: [] }),
      todayByPatient: vi.fn().mockResolvedValue({ date: '2025-06-15', intakes: [] }),
      intakeHistory: vi.fn().mockResolvedValue({ days: [] }),
      medicationDetail: vi.fn().mockResolvedValue({ id: 'm1' }),
    },
    medications: {
      search: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
      getByCode: vi.fn().mockResolvedValue({ cis: '123', name: 'Foo' }),
    },
  },
};

const caller = mockCaller as never;

describe('createDoctorTools', () => {
  it('exposes all expected tools', () => {
    const tools = createDoctorTools(caller);

    expect(Object.keys(tools)).toEqual([
      'get_my_appointments',
      'get_appointment_detail',
      'update_appointment_status',
      'list_patient_medications',
      'get_patient_today_pillbox',
      'get_patient_intake_history',
      'get_patient_medication_detail',
      'search_medications',
      'get_medication_by_code',
    ]);
  });

  it('get_my_appointments maps arguments with defaults', async () => {
    const tools = createDoctorTools(caller);

    await tools.get_my_appointments.execute?.({}, execOpts);
    expect(mockCaller.doctor.appointments.listMine).toHaveBeenCalledWith({
      status: undefined,
      from: undefined,
      to: undefined,
      sort: 'dateDesc',
      page: 1,
      limit: 20,
    });

    await tools.get_my_appointments.execute?.(
      { status: 'PENDING', from: '2025-06-01', to: '2025-06-30', sort: 'dateAsc' },
      execOpts,
    );
    expect(mockCaller.doctor.appointments.listMine).toHaveBeenLastCalledWith({
      status: 'PENDING',
      from: '2025-06-01',
      to: '2025-06-30',
      sort: 'dateAsc',
      page: 1,
      limit: 20,
    });
  });

  it('get_appointment_detail calls detail with id', async () => {
    const tools = createDoctorTools(caller);
    await tools.get_appointment_detail.execute?.(
      { id: '550e8400-e29b-41d4-a716-446655440000' },
      execOpts,
    );
    expect(mockCaller.doctor.appointments.detail).toHaveBeenCalledWith({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('update_appointment_status forwards id and status', async () => {
    const tools = createDoctorTools(caller);
    await tools.update_appointment_status.execute?.({ id: 'a1', status: 'COMPLETED' }, execOpts);
    expect(mockCaller.doctor.appointments.updateStatus).toHaveBeenCalledWith({
      id: 'a1',
      status: 'COMPLETED',
    });
  });

  it('update_appointment_status requires approval', () => {
    const tools = createDoctorTools(caller);
    expect(tools.update_appointment_status.needsApproval).toBe(true);
  });

  it('list_patient_medications forwards patientId and filter', async () => {
    const tools = createDoctorTools(caller);

    await tools.list_patient_medications.execute?.({ patientId: 'p1' }, execOpts);
    expect(mockCaller.doctor.pillbox.listByPatient).toHaveBeenCalledWith({
      patientId: 'p1',
      isActive: undefined,
      page: 1,
      limit: 50,
    });

    await tools.list_patient_medications.execute?.({ patientId: 'p1', isActive: true }, execOpts);
    expect(mockCaller.doctor.pillbox.listByPatient).toHaveBeenLastCalledWith({
      patientId: 'p1',
      isActive: true,
      page: 1,
      limit: 50,
    });
  });

  it('get_patient_today_pillbox calls todayByPatient with patientId', async () => {
    const tools = createDoctorTools(caller);
    await tools.get_patient_today_pillbox.execute?.({ patientId: 'p1' }, execOpts);
    expect(mockCaller.doctor.pillbox.todayByPatient).toHaveBeenCalledWith({
      patientId: 'p1',
    });
  });

  it('get_patient_intake_history forwards patientId and date range', async () => {
    const tools = createDoctorTools(caller);
    await tools.get_patient_intake_history.execute?.(
      { patientId: 'p1', from: '2025-06-01', to: '2025-06-15' },
      execOpts,
    );
    expect(mockCaller.doctor.pillbox.intakeHistory).toHaveBeenCalledWith({
      patientId: 'p1',
      from: '2025-06-01',
      to: '2025-06-15',
    });
  });

  it('get_patient_medication_detail calls medicationDetail with id', async () => {
    const tools = createDoctorTools(caller);
    await tools.get_patient_medication_detail.execute?.({ id: 'm1' }, execOpts);
    expect(mockCaller.doctor.pillbox.medicationDetail).toHaveBeenCalledWith({
      id: 'm1',
    });
  });

  it('search_medications forwards query with defaults', async () => {
    const tools = createDoctorTools(caller);
    await tools.search_medications.execute?.({ query: 'paracetamol' }, execOpts);
    expect(mockCaller.doctor.medications.search).toHaveBeenCalledWith({
      query: 'paracetamol',
      page: 1,
      limit: 20,
    });
  });

  it('get_medication_by_code forwards code lookups', async () => {
    const tools = createDoctorTools(caller);

    await tools.get_medication_by_code.execute?.({ cis: '12345' }, execOpts);
    expect(mockCaller.doctor.medications.getByCode).toHaveBeenCalledWith({
      cis: '12345',
    });

    await tools.get_medication_by_code.execute?.({ cip: '67890', externalId: 'ext-1' }, execOpts);
    expect(mockCaller.doctor.medications.getByCode).toHaveBeenLastCalledWith({
      cip: '67890',
      externalId: 'ext-1',
    });
  });
});
