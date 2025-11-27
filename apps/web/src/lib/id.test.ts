import { describe, it, expect } from 'vitest';

import { generateId, prefixes } from '@/lib/id';

describe('generateId', () => {
  it('generates an ID with default length', () => {
    const id = generateId();
    expect(id.length).toBe(12);
  });

  it('generates an ID with custom length', () => {
    const id = generateId({ length: 8 });
    expect(id.length).toBe(8);
  });

  it('does not prepend prefix if prefix not in prefixes', () => {
    const id = generateId('unknown');
    expect(id.startsWith('unknown')).toBe(false);
  });

  it('prepends prefix when prefix exists', () => {
    prefixes.user = 'USR';

    const id = generateId('user', { length: 6 });

    const [prefix, rest] = id.split('_');

    expect(prefix).toBe('USR');
    expect(rest.length).toBe(6);
  });

  it('supports custom separator', () => {
    prefixes.test = 'T';

    const id = generateId('test', { length: 4, separator: '-' });
    expect(id.startsWith('T-')).toBe(true);
    expect(id.split('-')[1].length).toBe(4);
  });
});
