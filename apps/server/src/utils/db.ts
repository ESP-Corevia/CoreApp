import {
  sql,
  and,
  or,
  eq,
  ne,
  lt,
  lte,
  gt,
  gte,
  inArray,
  notInArray,
  isNull,
  not,
  ilike,
  notIlike,
  type Table,
  type InferSelectModel,
  type asc,
  type desc,
  type SQL,
} from 'drizzle-orm';
import { z } from 'zod';

export function toDate(value: any): Date {
  if (value instanceof Date) return value;

  // Detect number or numeric string
  if (typeof value === 'number') return new Date(value);

  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) {
      // numeric string → treat as timestamp
      return new Date(Number(value));
    }
    return new Date(value);
  }

  throw new Error(`Cannot convert ${typeof value} to Date`);
}
export function coerceValueForColumn(column: any, value: any) {
  const extractedValue = Array.isArray(value) ? value[0] : value;
  switch (column.columnType) {
    case 'boolean':
      if (extractedValue === true || extractedValue === 'true') return true;
      if (extractedValue === false || extractedValue === 'false') return false;
      return Boolean(extractedValue);

    case 'number':
      return Number(extractedValue);

    case 'date':
    case 'timestamp':
      return toDate(extractedValue);

    default:
      return extractedValue;
  }
}

export const operatorHandlers = {
  iLike: (column: any, value: string) => ilike(column, '%' + value + '%'),
  notILike: (column: any, value: string) => notIlike(column, '%' + value + '%'),

  eq: (column: any, value: any) => {
    const coercedValue = coerceValueForColumn(column, value);

    // For boolean columns, handle NULL values
    if (column.columnType === 'boolean') {
      return or(eq(column, coercedValue), coercedValue === false ? isNull(column) : sql`false`);
    }

    return eq(column, coercedValue);
  },
  ne: (column: any, value: any) => ne(column, coerceValueForColumn(column, value)),
  lt: (column: any, value: any) => lt(column, coerceValueForColumn(column, value)),
  lte: (column: any, value: any) => lte(column, coerceValueForColumn(column, value)),
  gt: (column: any, value: any) => gt(column, coerceValueForColumn(column, value)),
  gte: (column: any, value: any) => gte(column, coerceValueForColumn(column, value)),

  // array operators
  inArray: (column: any, value: any[]) => inArray(column, value),
  notInArray: (column: any, value: any[]) => notInArray(column, value),

  // empty
  isEmpty: (column: any) => or(isNull(column), eq(column, '')),
  isNotEmpty: (column: any) => and(not(isNull(column)), ne(column, '')),

  // ranges
  isBetween: (column: any, [from, to]: [any, any]) =>
    and(gte(column, toDate(from)), lte(column, toDate(to))),

  // special
  isRelativeToToday: (column: any, days: number) =>
    sql`${column} >= NOW() - INTERVAL '${days} day'`,
} as const;
export const OperatorSchema = z.enum([
  'iLike',
  'notILike',
  'eq',
  'ne',
  'lt',
  'lte',
  'gt',
  'gte',
  'inArray',
  'notInArray',
  'isBetween',
  'isEmpty',
  'isNotEmpty',
  'isRelativeToToday',
]);

export type Operator = z.infer<typeof OperatorSchema>;
export type ColumnValue<
  TTable extends Table,
  TColumn extends keyof InferSelectModel<TTable>,
> = InferSelectModel<TTable>[TColumn];
export type ColumnKey<TTable extends Table> = keyof InferSelectModel<TTable> & string;

export type TableFilter<TTable extends Table> = {
  id: ColumnKey<TTable>;
  operator: Operator;
  value?: unknown;
  variant: string;
  filterId: string;
};

export function buildWhereConditions<TTable extends Table>(
  table: TTable,
  filters: TableFilter<TTable>[],
) {
  return filters.map((filter) => {
    const column = table[filter.id as keyof TTable];

    if (!column) {
      throw new Error(`Unknown column: ${filter.id}`);
    }

    const handler = operatorHandlers[filter.operator];

    if (!handler) {
      throw new Error(`Unknown operator: ${filter.operator}`);
    }

    return handler(column, filter.value as any);
  });
}

type SortRule<TTable> = {
  id: keyof TTable;
  desc: boolean;
};

export function buildOrderBy<TTable extends Record<string, any>>(
  sortRules: SortRule<TTable> | undefined,
) {
  if (!sortRules) {
    return undefined;
  }

  return (table: TTable, operators: { asc: typeof asc; desc: typeof desc }) => {
    const column = table[sortRules.id as keyof TTable];
    if (!column) {
      throw new Error(`Unknown column: ${String(sortRules.id)}`);
    }
    return sortRules.desc ? operators.desc(column) : operators.asc(column);
  };
}
export interface QueryParams<TTable extends Table> {
  page?: number;
  perPage?: number;

  search?: string;
  searchInFields?: ColumnKey<TTable>[];

  sorting?: {
    id: ColumnKey<TTable>;
    desc: boolean;
  };

  filters?: TableFilter<TTable>[];
}

export interface QueryOptions {
  where?: SQL<unknown>;
  orderBy?:
    | ((
        table: Record<string, any>,
        operators: { asc: typeof asc; desc: typeof desc },
      ) => SQL<unknown>)
    | undefined;
  limit?: number;
  offset?: number;
}
export function buildQueryOptions<TTable extends Table>(
  table: TTable,
  params: QueryParams<TTable>,
): QueryOptions {
  const { page = 1, perPage = 10, search, searchInFields, sorting, filters } = params;

  // Pagination
  const limit = perPage;
  const offset = (page - 1) * perPage;

  const whereParts = [];

  // ----- Filters -----
  if (filters && filters.length > 0) {
    whereParts.push(and(...buildWhereConditions(table, filters)));
  }

  // ----- Search -----
  if (search && searchInFields && searchInFields.length > 0) {
    const searchConditions = searchInFields.map((field) =>
      ilike((table as Record<string, any>)[field], `%${search}%`),
    );

    whereParts.push(or(...searchConditions));
  }

  const where = whereParts.length === 0 ? undefined : and(...whereParts);

  // ----- Sorting -----
  const orderBy = sorting ? buildOrderBy({ id: sorting.id, desc: sorting.desc }) : undefined;

  return {
    where,
    orderBy,
    limit,
    offset,
  };
}
