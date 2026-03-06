import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import type { createAvailabilityRepo } from '../repositories/availability.repository';

const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 18;
const SLOT_INTERVAL_MINUTES = 30;
const BREAK_START = '12:00';
const BREAK_END = '13:30';

function generateBaseSlots(): string[] {
  const slots: string[] = [];
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL_MINUTES) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (time >= BREAK_START && time < BREAK_END) continue;
      slots.push(time);
    }
  }
  return slots;
}

export const BASE_SLOTS = generateBaseSlots();

function getParisToday(): string {
  const now = new Date();
  const parisStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  return parisStr;
}

export const AvailableSlotsOutputSchema = z.object({
  doctorId: z.string(),
  date: z.string(),
  slots: z.array(z.string()),
});

export const createAvailabilityService = (repo: ReturnType<typeof createAvailabilityRepo>) => ({
  getAvailableSlots: async (doctorId: string, date: string) => {
    const today = getParisToday();
    if (date < today) {
      throw new TRPCError({
        code: 'UNPROCESSABLE_CONTENT',
        message: 'Cannot query slots for a past date',
      });
    }

    const exists = await repo.doctorExists(doctorId);
    if (!exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Doctor not found',
      });
    }

    const [reserved, blocked] = await Promise.all([
      repo.getReservedSlots(doctorId, date),
      repo.getBlockedSlots(doctorId, date),
    ]);

    const unavailable = new Set([...reserved, ...blocked]);
    const slots = BASE_SLOTS.filter((s) => !unavailable.has(s));

    return { doctorId, date, slots };
  },
});
