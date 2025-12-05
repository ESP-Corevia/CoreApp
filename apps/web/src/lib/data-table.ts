import type { Column, ColumnFiltersState } from '@tanstack/react-table';

import { dataTableConfig } from '@/config/data-table';
import { generateId } from '@/lib/id';
import type { ExtendedColumnFilter, FilterOperator, FilterVariant } from '@/types/data-table';

export function getCommonPinningStyles<TData>({
  column,
  withBorder = false,
}: {
  column: Column<TData>;
  withBorder?: boolean;
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? '-4px 0 4px -4px var(--border) inset'
        : isFirstRightPinnedColumn
          ? '4px 0 4px -4px var(--border) inset'
          : undefined
      : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? 'sticky' : 'relative',
    background: isPinned ? 'var(--background)' : 'var(--background)',
    width: column.getSize(),
    zIndex: isPinned ? 1 : undefined,
  };
}

export function getFilterOperators(filterVariant: FilterVariant) {
  const operatorMap: Record<FilterVariant, { label: string; value: FilterOperator }[]> = {
    text: dataTableConfig.textOperators,
    number: dataTableConfig.numericOperators,
    range: dataTableConfig.numericOperators,
    date: dataTableConfig.dateOperators,
    dateRange: dataTableConfig.dateOperators,
    boolean: dataTableConfig.booleanOperators,
    select: dataTableConfig.selectOperators,
    multiSelect: dataTableConfig.multiSelectOperators,
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant, operator?: FilterOperator) {
  const operators = getFilterOperators(filterVariant);
  if (operator) {
    const isValid = operators.some(op => op.value === operator);
    if (isValid) {
      return operator;
    }
  }
  return operators[0]?.value ?? (filterVariant === 'text' ? 'iLike' : 'eq');
}

// eslint-disable-next-line no-unused-vars
function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[]
): ExtendedColumnFilter<TData>[] {
  return filters.filter(
    filter =>
      filter.operator === 'isEmpty' ||
      filter.operator === 'isNotEmpty' ||
      (Array.isArray(filter.value)
        ? filter.value.length > 0
        : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          filter.value !== '' && filter.value !== null && filter.value !== undefined)
  );
}
export function convertToExtendedFilters<TData>(
  columnFilters: ColumnFiltersState,
  columns: Column<TData>[]
): ExtendedColumnFilter<TData>[] {
  return columnFilters.map(filter => {
    const column = columns.find(col => col.id === filter.id);
    const variant = column?.columnDef.meta?.variant ?? 'text';
    const operator = getDefaultFilterOperator(variant, column?.columnDef.meta?.operator);

    return {
      id: filter.id as Extract<keyof TData, string>,
      value: Array.isArray(filter.value)
        ? filter.value
        : typeof filter.value === 'string'
          ? filter.value
          : String(filter.value ?? ''),
      variant,
      operator,
      filterId: generateId({ length: 8 }),
    };
  });
}
