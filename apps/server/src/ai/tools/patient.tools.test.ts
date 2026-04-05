import type { ToolExecutionOptions } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createPatientTools } from './patient.tools';

const execOpts = {} as ToolExecutionOptions;

describe('createPatientTools', () => {
  it('exposes the expected tools and maps appointment arguments with defaults', async () => {
    const listMine = vi.fn().mockResolvedValue({ items: [] });
    const today = vi.fn().mockResolvedValue({ medications: [] });

    const tools = createPatientTools({
      appointments: { listMine },
      pillbox: { today },
    } as never);

    expect(Object.keys(tools)).toEqual(['get_my_appointments', 'get_my_today_pillbox']);

    await expect(tools.get_my_appointments.execute?.({}, execOpts)).resolves.toEqual({
      items: [],
    });
    expect(listMine).toHaveBeenCalledWith({
      status: undefined,
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });

    await expect(
      tools.get_my_appointments.execute?.({ status: 'CONFIRMED' }, execOpts),
    ).resolves.toEqual({ items: [] });
    expect(listMine).toHaveBeenLastCalledWith({
      status: 'CONFIRMED',
      page: 1,
      limit: 10,
      sort: 'dateDesc',
    });

    await expect(tools.get_my_today_pillbox.execute?.({}, execOpts)).resolves.toEqual({
      medications: [],
    });
    expect(today).toHaveBeenCalledWith({});
  });
});
