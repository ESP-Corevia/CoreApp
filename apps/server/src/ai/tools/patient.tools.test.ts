import { describe, expect, it, vi } from 'vitest';
import { createPatientTools } from './patient.tools';

function mapTools<T extends { name: string }>(tools: T[]) {
  return Object.fromEntries(tools.map(tool => [tool.name, tool]));
}

describe('createPatientTools', () => {
  it('exposes the expected tools and maps appointment arguments with defaults', async () => {
    const listMine = vi.fn().mockResolvedValue({ items: [] });
    const today = vi.fn().mockResolvedValue({ medications: [] });

    const tools = mapTools(
      createPatientTools({
        appointments: { listMine },
        pillbox: { today },
      } as never),
    );

    expect(Object.keys(tools)).toEqual(['get_my_appointments', 'get_my_today_pillbox']);

    await expect(tools.get_my_appointments.execute?.({})).resolves.toEqual({ items: [] });
    expect(listMine).toHaveBeenCalledWith({
      status: undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });

    await expect(
      tools.get_my_appointments.execute?.({
        status: 'CONFIRMED',
      }),
    ).resolves.toEqual({ items: [] });
    expect(listMine).toHaveBeenLastCalledWith({
      status: 'CONFIRMED',
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });

    await expect(tools.get_my_today_pillbox.execute?.({})).resolves.toEqual({
      medications: [],
    });
    expect(today).toHaveBeenCalledWith({});
  });
});
