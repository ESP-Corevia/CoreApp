import { describe, it, expect } from 'vitest';

import {
  toDate,
  operatorHandlers,
  buildWhereConditions,
  buildQueryOptions,
  type TableFilter,
} from './db';

// Fake drizzle table
const users = {
  id: { name: 'id', columnType: 'text' },
  createdAt: { name: 'createdAt', columnType: 'date' },
  email: { name: 'email', columnType: 'text' },
} as any;
describe('toDate()', () => {
  it('converts timestamp number', () => {
    const d = toDate(1700000000000);
    expect(d).toBeInstanceOf(Date);
  });

  it('converts timestamp string', () => {
    const d = toDate('1700000000000');
    expect(d).toBeInstanceOf(Date);
  });

  it('converts ISO string', () => {
    const d = toDate('2024-01-01T00:00:00Z');
    expect(d).toBeInstanceOf(Date);
  });

  it('throws on invalid type', () => {
    expect(() => toDate({})).toThrow();
  });
});
describe('operatorHandlers', () => {
  it('handles eq with timestamps', () => {
    const cond = operatorHandlers.eq(users.createdAt, '1700000000000');
    expect(cond).toBeDefined();
  });

  it('handles iLike', () => {
    const cond = operatorHandlers.iLike(users.email, 'john');
    expect(cond.getSQL().queryChunks).toContain('%john%');
  });
  it('handles notILike', () => {
    const cond = operatorHandlers.notILike(users.email, 'john');
    expect(cond.getSQL().queryChunks).toContain('%john%');
  });

  it('handles isBetween', () => {
    const cond = operatorHandlers.isBetween(users.createdAt, ['1700000000000', '1700100000000']);
    expect(cond).toBeDefined();
  });
  it('handles isEmpty', () => {
    const cond = operatorHandlers.isEmpty(users.email);
    expect(cond).toBeDefined();
  });
  it('handles isNotEmpty', () => {
    const cond = operatorHandlers.isNotEmpty(users.email);
    expect(cond).toBeDefined();
  });
  it('handles isRelativeToToday', () => {
    const cond = operatorHandlers.isRelativeToToday(users.createdAt, 7);
    expect(cond).toBeDefined();
  });
  it('throws on unknown operator', () => {
    expect(() => {
      // @ts-expect-error testing unknown operator
      operatorHandlers.unknownOp(users.email, 'value');
    }).toThrow();
  });
  it('handles eq', () => {
    const cond = operatorHandlers.eq(users.email, 'john');
    expect(cond).toBeDefined();
  });
  it('handles ne', () => {
    const cond = operatorHandlers.ne(users.email, 'john');
    expect(cond).toBeDefined();
  });
  it('handles lt', () => {
    const cond = operatorHandlers.lt(users.createdAt, '1700000000000');
    expect(cond).toBeDefined();
  });
  it('handles lte', () => {
    const cond = operatorHandlers.lte(users.createdAt, '1700000000000');
    expect(cond).toBeDefined();
  });
  it('handles gt', () => {
    const cond = operatorHandlers.gt(users.createdAt, '1700000000000');
    expect(cond).toBeDefined();
  });
  it('handles gte', () => {
    const cond = operatorHandlers.gte(users.createdAt, '1700000000000');
    expect(cond).toBeDefined();
  });
  it('handles inArray', () => {
    const cond = operatorHandlers.inArray(users.email, ['john']);
    expect(cond).toBeDefined();
  });
  it('handles notInArray', () => {
    const cond = operatorHandlers.notInArray(users.email, ['john']);
    expect(cond).toBeDefined();
  });
});
describe('buildWhereConditions()', () => {
  it('builds array of where conditions', () => {
    const filters: TableFilter<any>[] = [
      {
        id: 'createdAt',
        operator: 'eq',
        value: '1700000000000',
        variant: 'date',
        filterId: 'x1',
      },
    ];

    const result = buildWhereConditions(users, filters);
    expect(result.length).toBe(1);
  });

  it('throws on unknown column', () => {
    const filters: TableFilter<any>[] = [
      {
        id: 'unknownColumn',
        operator: 'eq',
        value: 1,
        variant: 'date',
        filterId: 'x1',
      },
    ];

    expect(() => buildWhereConditions(users, filters)).toThrow();
  });
});
describe('buildQueryOptions()', () => {
  it('builds correct query options', () => {
    const opts = buildQueryOptions(users, {
      page: 2,
      perPage: 10,
      search: 'john',
      searchInFields: ['email'],
      filters: [
        {
          id: 'createdAt',
          operator: 'gte',
          value: '1700000000000',
          variant: 'date',
          filterId: 'f1',
        },
      ],
    });

    // pagination
    expect(opts.limit).toBe(10);
    expect(opts.offset).toBe(10); // (page - 1) * perPage

    // where should be a combined drizzle expression
    expect(opts.where).toBeDefined();

    // orderBy is undefined because we didn't pass sorting
    expect(opts.orderBy).toBeUndefined();
  });
});
