import { describe, expect, it, vi } from 'vitest';
import { createDoctorTools } from './doctor.tools';

function mapTools<T extends { name: string }>(tools: T[]) {
  return Object.fromEntries(tools.map(tool => [tool.name, tool]));
}

describe('createDoctorTools', () => {
  it('exposes the expected tools and dispatches to the doctor caller', async () => {
    const listMine = vi.fn().mockResolvedValue({ items: [] });
    const detail = vi.fn().mockResolvedValue({ id: 'appt-1' });
    const updateStatus = vi.fn().mockResolvedValue({ success: true });

    const tools = mapTools(
      createDoctorTools({
        doctor: {
          appointments: {
            listMine,
            detail,
            updateStatus,
          },
        },
      } as never),
    );

    expect(Object.keys(tools)).toEqual([
      'get_my_appointments',
      'get_appointment_detail',
      'update_appointment_status',
    ]);

    await expect(tools.get_my_appointments.execute?.({})).resolves.toEqual({ items: [] });
    expect(listMine).toHaveBeenCalledWith({
      status: undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });

    await expect(
      tools.get_appointment_detail.execute?.({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).resolves.toEqual({ id: 'appt-1' });
    expect(detail).toHaveBeenCalledWith({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });

    await expect(
      tools.update_appointment_status.execute?.({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'COMPLETED',
      }),
    ).resolves.toEqual({ success: true });
    expect(updateStatus).toHaveBeenCalledWith({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'COMPLETED',
    });
  });
});
