import { describe, it, expect } from 'vitest';

import {
  toDate,
  operatorHandlers,
  buildWhereConditions,
  buildQueryOptions,
  buildOrderBy,
  coerceValueForColumn,
  type TableFilter,
} from './db';

const users = {
  id: { name: 'id', columnType: 'text' },
  createdAt: { name: 'createdAt', columnType: 'date' },
  email: { name: 'email', columnType: 'text' },
  banned: { name: 'banned', columnType: 'boolean' },
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

    expect(opts.where).toBeDefined();

    expect(opts.orderBy).toBeUndefined();
  });
});
describe('coerceValueForColumn()', () => {
  it('coerces boolean values', () => {
    expect(coerceValueForColumn(users.banned, 'true')).toBe(true);
    expect(coerceValueForColumn(users.banned, 'false')).toBe(false);
    expect(coerceValueForColumn(users.banned, true)).toBe(true);
    expect(coerceValueForColumn(users.banned, false)).toBe(false);
    expect(coerceValueForColumn(users.banned, [true])).toBe(true);
    expect(coerceValueForColumn(users.banned, ['false'])).toBe(false);
  });

  it('coerces number values', () => {
    expect(coerceValueForColumn({ columnType: 'number' }, '42')).toBe(42);
    expect(coerceValueForColumn({ columnType: 'number' }, 3.14)).toBe(3.14);
    expect(coerceValueForColumn({ columnType: 'number' }, ['7'])).toBe(7);
  });

  it('coerces date values', () => {
    const date1 = coerceValueForColumn(users.createdAt, '1700000000000');
    expect(date1).toBeInstanceOf(Date);

    const date2 = coerceValueForColumn(users.createdAt, 1700000000000);
    expect(date2).toBeInstanceOf(Date);
  });
});
describe('buildOrderBy()', () => {
  it('builds orderBy function', () => {
    const sortRule = { id: 'createdAt', desc: true };
    const orderByFn = buildOrderBy<any>(sortRule);
    expect(orderByFn).toBeInstanceOf(Function);
  });

  it('returns undefined when no sort rule is provided', () => {
    const orderByFn = buildOrderBy<any>(undefined);
    expect(orderByFn).toBeUndefined();
  });
});
