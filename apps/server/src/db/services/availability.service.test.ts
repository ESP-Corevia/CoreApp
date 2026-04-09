/** biome-ignore-all lint/suspicious/noExplicitAny: pass */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockAvailabilityRepo, mockDoctorsRepo } from '../../../test/repositories';

import { BASE_SLOTS, createAvailabilityService } from './availability.service';

const service = createAvailabilityService(mockAvailabilityRepo, mockDoctorsRepo);

const DOCTOR_ID = '00000000-0000-0000-0000-000000000001';
const FUTURE_DATE = '2099-01-15';

beforeEach(() => {
  vi.resetAllMocks();
  // Default: doctor exists
  mockDoctorsRepo.getByUserId.mockResolvedValue({
    specialty: 'Cardiology',
    address: '1 Rue de Test',
    city: 'Paris',
    verified: true,
  });
  mockAvailabilityRepo.getReservedSlots.mockResolvedValue([]);
  mockAvailabilityRepo.getBlockedSlots.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('availabilityService', () => {
  describe('getAvailableSlots', () => {
    it('throws UNPROCESSABLE_CONTENT for a past date', async () => {
      await expect(service.getAvailableSlots(DOCTOR_ID, '2020-01-01')).rejects.toThrow(
        expect.objectContaining({
          code: 'UNPROCESSABLE_CONTENT',
        }),
      );
      expect(mockDoctorsRepo.getByUserId).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when doctor does not exist', async () => {
      mockDoctorsRepo.getByUserId.mockResolvedValue(null as any);

      await expect(service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE)).rejects.toThrow(
        expect.objectContaining({
          code: 'NOT_FOUND',
        }),
      );
    });

    it('returns all base slots when nothing is reserved or blocked', async () => {
      const result = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(result).toEqual({
        doctorId: DOCTOR_ID,
        date: FUTURE_DATE,
        slots: BASE_SLOTS,
      });
    });

    it('excludes reserved and blocked slots', async () => {
      mockAvailabilityRepo.getReservedSlots.mockResolvedValue(['10:00']);
      mockAvailabilityRepo.getBlockedSlots.mockResolvedValue(['11:30']);

      const result = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(result.slots).not.toContain('10:00');
      expect(result.slots).not.toContain('11:30');
      expect(result.slots).toContain('10:30');
      expect(result.slots).toContain('11:00');
    });

    it('excludes break slots (12:00-13:00)', () => {
      expect(BASE_SLOTS).not.toContain('12:00');
      expect(BASE_SLOTS).not.toContain('12:30');
      expect(BASE_SLOTS).not.toContain('13:00');
      expect(BASE_SLOTS).toContain('13:30');
    });

    it('fetches reserved and blocked slots with doctorId', async () => {
      await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(mockDoctorsRepo.getByUserId).toHaveBeenCalledWith(DOCTOR_ID);
      expect(mockAvailabilityRepo.getReservedSlots).toHaveBeenCalledWith(DOCTOR_ID, FUTURE_DATE);
      expect(mockAvailabilityRepo.getBlockedSlots).toHaveBeenCalledWith(DOCTOR_ID, FUTURE_DATE);
    });
  });
});
