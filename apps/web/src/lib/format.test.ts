import { describe, it, expect } from 'vitest';

import { formatDate } from './format';

describe('formatDate', () => {
  it('returns empty string when date is undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('formats a Date object correctly (default)', () => {
    const d = new Date('2024-01-15');
    const result = formatDate(d);

    // US format: "January 15, 2024"
    expect(result).toBe('January 15, 2024');
  });

  it('formats a date string correctly', () => {
    const result = formatDate('2024-05-10');
    expect(result).toBe('May 10, 2024');
  });

  it('formats a timestamp (number) correctly', () => {
    const timestamp = new Date('2023-12-25').getTime();
    const result = formatDate(timestamp);
    expect(result).toBe('December 25, 2023');
  });

  it('returns empty string for invalid date string', () => {
    expect(formatDate('not a real date')).toBe('');
  });

  it('allows overriding month/day/year via options', () => {
    const result = formatDate('2024-02-01', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
    expect(result).toBe('02/01/24');
  });

  it('merges custom options with defaults', () => {
    const result = formatDate('2024-03-15', {
      month: 'short', // override only month
    });
    // "Mar 15, 2024"
    expect(result).toBe('Mar 15, 2024');
  });

  it('handles options that remove parts', () => {
    const result = formatDate('2024-03-15', {
      year: undefined,
    });

    // Default month & day still apply
    // But year is omitted because `year: undefined` is respected via merging rules
    // So Intl omits the year entirely
    expect(result).toBe('March 15');
  });
});
