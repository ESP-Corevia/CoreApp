import type { ToolExecutionOptions } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createPatientTools } from './patient.tools';

const execOpts = {} as ToolExecutionOptions;

const mockCaller = {
  appointments: {
    listMine: vi.fn().mockResolvedValue({ items: [] }),
    detail: vi.fn().mockResolvedValue({ id: 'a1' }),
    create: vi.fn().mockResolvedValue({ id: 'a2' }),
  },
  doctors: {
    list: vi.fn().mockResolvedValue({ items: [] }),
    availableSlots: vi.fn().mockResolvedValue({ slots: [] }),
  },
  medications: {
    search: vi.fn().mockResolvedValue({ items: [] }),
  },
  pillbox: {
    today: vi.fn().mockResolvedValue({ medications: [] }),
    listMine: vi.fn().mockResolvedValue({ items: [] }),
    detail: vi.fn().mockResolvedValue({ id: 'm1' }),
    markIntakeTaken: vi.fn().mockResolvedValue({ id: 'i1', status: 'TAKEN' }),
    markIntakeSkipped: vi.fn().mockResolvedValue({ id: 'i2', status: 'SKIPPED' }),
  },
};

const caller = mockCaller as never;

describe('createPatientTools', () => {
  it('exposes all expected tools', () => {
    const tools = createPatientTools(caller);

    expect(Object.keys(tools)).toEqual([
      'get_my_appointments',
      'get_appointment_detail',
      'create_appointment',
      'list_doctors',
      'get_available_slots',
      'search_medications',
      'get_my_today_pillbox',
      'list_my_medications',
      'get_medication_detail',
      'mark_intake_taken',
      'mark_intake_skipped',
    ]);
  });

  it('get_my_appointments maps arguments with defaults', async () => {
    const tools = createPatientTools(caller);

    await tools.get_my_appointments.execute?.({}, execOpts);
    expect(mockCaller.appointments.listMine).toHaveBeenCalledWith({
      status: undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });

    await tools.get_my_appointments.execute?.({ status: 'CONFIRMED' }, execOpts);
    expect(mockCaller.appointments.listMine).toHaveBeenLastCalledWith({
      status: 'CONFIRMED',
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });
  });

  it('get_appointment_detail calls detail with id', async () => {
    const tools = createPatientTools(caller);
    await tools.get_appointment_detail.execute?.({ id: 'a1' }, execOpts);
    expect(mockCaller.appointments.detail).toHaveBeenCalledWith({ id: 'a1' });
  });

  it('create_appointment forwards all fields', async () => {
    const tools = createPatientTools(caller);
    await tools.create_appointment.execute?.(
      { doctorId: 'd1', date: '2025-06-15', time: '10:00', reason: 'Checkup' },
      execOpts,
    );
    expect(mockCaller.appointments.create).toHaveBeenCalledWith({
      doctorId: 'd1',
      date: '2025-06-15',
      time: '10:00',
      reason: 'Checkup',
    });
  });

  it('list_doctors forwards filters', async () => {
    const tools = createPatientTools(caller);
    await tools.list_doctors.execute?.({ specialty: 'Cardiology' }, execOpts);
    expect(mockCaller.doctors.list).toHaveBeenCalledWith({
      specialty: 'Cardiology',
      city: undefined,
      search: undefined,
      page: 1,
      limit: 10,
    });
  });

  it('get_available_slots forwards doctorId and date', async () => {
    const tools = createPatientTools(caller);
    await tools.get_available_slots.execute?.({ doctorId: 'd1', date: '2025-06-15' }, execOpts);
    expect(mockCaller.doctors.availableSlots).toHaveBeenCalledWith({
      doctorId: 'd1',
      date: '2025-06-15',
    });
  });

  it('search_medications forwards query', async () => {
    const tools = createPatientTools(caller);
    await tools.search_medications.execute?.({ query: 'paracetamol' }, execOpts);
    expect(mockCaller.medications.search).toHaveBeenCalledWith({
      query: 'paracetamol',
    });
  });

  it('get_my_today_pillbox calls today', async () => {
    const tools = createPatientTools(caller);
    await tools.get_my_today_pillbox.execute?.({}, execOpts);
    expect(mockCaller.pillbox.today).toHaveBeenCalledWith({});
  });

  it('list_my_medications forwards active filter', async () => {
    const tools = createPatientTools(caller);
    await tools.list_my_medications.execute?.({ isActive: true }, execOpts);
    expect(mockCaller.pillbox.listMine).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      isActive: true,
    });
  });

  it('get_medication_detail calls detail with id', async () => {
    const tools = createPatientTools(caller);
    await tools.get_medication_detail.execute?.({ id: 'm1' }, execOpts);
    expect(mockCaller.pillbox.detail).toHaveBeenCalledWith({ id: 'm1' });
  });

  it('mark_intake_taken forwards id and notes', async () => {
    const tools = createPatientTools(caller);
    await tools.mark_intake_taken.execute?.({ id: 'i1', notes: 'Took with food' }, execOpts);
    expect(mockCaller.pillbox.markIntakeTaken).toHaveBeenCalledWith({
      id: 'i1',
      notes: 'Took with food',
    });
  });

  it('mark_intake_skipped forwards id and notes', async () => {
    const tools = createPatientTools(caller);
    await tools.mark_intake_skipped.execute?.({ id: 'i2', notes: 'Felt nauseous' }, execOpts);
    expect(mockCaller.pillbox.markIntakeSkipped).toHaveBeenCalledWith({
      id: 'i2',
      notes: 'Felt nauseous',
    });
  });
});
