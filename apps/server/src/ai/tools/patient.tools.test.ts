import type { ToolExecutionOptions } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPatientTools } from './patient.tools';

const execOpts = {} as ToolExecutionOptions;

const DOCTOR_ROW = {
  id: 'profile-1',
  userId: 'user-1',
  name: 'Dr. House',
  specialty: 'Cardiology',
  address: '1 Main St',
  city: 'Lyon',
  verified: true,
};

const mockCaller = {
  appointments: {
    listMine: vi.fn(),
    detail: vi.fn(),
    create: vi.fn(),
  },
  doctors: {
    list: vi.fn(),
    availableSlots: vi.fn(),
  },
  medications: {
    search: vi.fn(),
  },
  pillbox: {
    today: vi.fn(),
    listMine: vi.fn(),
    detail: vi.fn(),
    markIntakeTaken: vi.fn(),
    markIntakeSkipped: vi.fn(),
  },
};

beforeEach(() => {
  mockCaller.appointments.listMine.mockResolvedValue({ items: [] });
  mockCaller.appointments.detail.mockResolvedValue({ id: 'a1' });
  mockCaller.appointments.create.mockResolvedValue({ id: 'a2' });
  mockCaller.doctors.list.mockResolvedValue({
    items: [DOCTOR_ROW],
    page: 1,
    limit: 10,
    total: 1,
  });
  mockCaller.doctors.availableSlots.mockResolvedValue({ slots: [] });
  mockCaller.medications.search.mockResolvedValue({ items: [] });
  mockCaller.pillbox.today.mockResolvedValue({ medications: [] });
  mockCaller.pillbox.listMine.mockResolvedValue({ items: [] });
  mockCaller.pillbox.detail.mockResolvedValue({ id: 'm1' });
  mockCaller.pillbox.markIntakeTaken.mockResolvedValue({ id: 'i1', status: 'TAKEN' });
  mockCaller.pillbox.markIntakeSkipped.mockResolvedValue({ id: 'i2', status: 'SKIPPED' });
});

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

  it('list_doctors remaps items to a single doctorId (from userId) and drops the profile id', async () => {
    const tools = createPatientTools(caller);
    const result = (await tools.list_doctors.execute?.({}, execOpts)) as {
      items: Array<Record<string, unknown>>;
    };
    expect(result.items).toEqual([
      {
        doctorId: 'user-1',
        name: 'Dr. House',
        specialty: 'Cardiology',
        address: '1 Main St',
        city: 'Lyon',
        verified: true,
      },
    ]);
    // The internal profile id must NOT be exposed to the model
    expect(result.items[0]).not.toHaveProperty('id');
    expect(result.items[0]).not.toHaveProperty('userId');
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
