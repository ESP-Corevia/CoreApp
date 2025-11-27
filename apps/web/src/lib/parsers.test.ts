import { describe, it, expect } from 'vitest';

import type { ExtendedColumnSort, ExtendedColumnFilter } from '@/types/data-table';

import { getSortingStateParser, getFiltersStateParser } from './parsers';

describe('getSortingStateParser', () => {
  it('parses valid sorting JSON', () => {
    const parser = getSortingStateParser(['name', 'age']);

    const input = JSON.stringify([
      { id: 'name', desc: false },
      { id: 'age', desc: true },
    ]);

    expect(parser.parse(input)).toEqual([
      { id: 'name', desc: false },
      { id: 'age', desc: true },
    ]);
  });

  it('returns null for invalid JSON', () => {
    const parser = getSortingStateParser();
    expect(parser.parse('not-json')).toBeNull();
  });

  it('returns null for invalid schema', () => {
    const parser = getSortingStateParser();

    const input = JSON.stringify([{ id: 123, desc: 'nope' }]);
    expect(parser.parse(input)).toBeNull();
  });

  it('rejects sorting keys not in validKeys', () => {
    const parser = getSortingStateParser(['name']);

    const input = JSON.stringify([{ id: 'age', desc: true }]);
    expect(parser.parse(input)).toBeNull();
  });

  it('serializes correctly', () => {
    const parser = getSortingStateParser();

    const value = [{ id: 'name', desc: false }] as ExtendedColumnSort<unknown>[];
    expect(parser.serialize(value)).toBe(JSON.stringify(value));
  });

  it('eq returns true for identical arrays', () => {
    const parser = getSortingStateParser();

    const a = [{ id: 'name', desc: true }] as ExtendedColumnSort<unknown>[];
    const b = [{ id: 'name', desc: true }] as ExtendedColumnSort<unknown>[];

    expect(parser.eq(a, b)).toBe(true);
  });

  it('eq returns false for different arrays', () => {
    const parser = getSortingStateParser();

    const a = [{ id: 'name', desc: true }] as ExtendedColumnSort<unknown>[];
    const b = [{ id: 'name', desc: false }] as ExtendedColumnSort<unknown>[];

    expect(parser.eq(a, b)).toBe(false);
  });
});

describe('getFiltersStateParser', () => {
  it('parses valid filter JSON', () => {
    const parser = getFiltersStateParser(['role']);

    const input = JSON.stringify([
      {
        id: 'role',
        value: 'admin',
        variant: 'text',
        operator: 'eq',
        filterId: 'role-eq',
      },
    ]);

    expect(parser.parse(input)).toEqual([
      {
        id: 'role',
        value: 'admin',
        variant: 'text',
        operator: 'eq',
        filterId: 'role-eq',
      },
    ]);
  });

  it('rejects invalid JSON', () => {
    const parser = getFiltersStateParser();
    expect(parser.parse('nope')).toBeNull();
  });

  it('rejects invalid filter schema', () => {
    const parser = getFiltersStateParser();

    const input = JSON.stringify([{ id: 'role', value: 123 }]);
    expect(parser.parse(input)).toBeNull();
  });

  it('rejects filters with invalid keys', () => {
    const parser = getFiltersStateParser(['role']);

    const input = JSON.stringify([
      {
        id: 'age',
        value: '20',
        variant: 'text',
        operator: 'eq',
        filterId: 'age-eq',
      },
    ]);

    expect(parser.parse(input)).toBeNull();
  });

  it('serializes correctly', () => {
    const parser = getFiltersStateParser();
    const val = [
      {
        id: 'role',
        value: 'admin',
        variant: 'text',
        operator: 'eq',
        filterId: 'role-eq',
      },
    ] as ExtendedColumnFilter<unknown>[];

    expect(parser.serialize(val)).toBe(JSON.stringify(val));
  });

  it('eq returns true for identical filters', () => {
    const parser = getFiltersStateParser();

    const a = [
      {
        id: 'role',
        value: 'admin',
        variant: 'text',
        operator: 'eq',
        filterId: 'role-eq',
      },
    ] as ExtendedColumnFilter<unknown>[];
    const b = [...a];

    expect(parser.eq(a, b)).toBe(true);
  });

  it('eq returns false for different filters', () => {
    const parser = getFiltersStateParser();

    const a = [
      {
        id: 'role',
        value: 'admin',
        variant: 'text',
        operator: 'eq',
        filterId: 'role-eq',
      },
    ] as ExtendedColumnFilter<unknown>[];
    const b = [
      {
        id: 'role',
        value: 'user',
        variant: 'text',
        operator: 'eq',
        filterId: 'role-eq',
      },
    ] as ExtendedColumnFilter<unknown>[];

    expect(parser.eq(a, b)).toBe(false);
  });
});
