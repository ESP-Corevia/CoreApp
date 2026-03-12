'use client';

import { useMemo } from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import { CalendarClock, Clock, Text, User, Stethoscope, CircleDot } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { useDataTable } from '@/hooks/use-data-table';

import { AppointmentActionsMenu } from './appointment-actions-menu';

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  status: string;
  reason: string | null;
  createdAt: string;
  doctorName: string | null;
  patientName: string | null;
}

const STATUS_VARIANTS: Record<string, { className: string; label: string }> = {
  PENDING: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    label: 'Pending',
  },
  CONFIRMED: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Confirmed',
  },
  COMPLETED: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    label: 'Completed',
  },
  CANCELLED: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    label: 'Cancelled',
  },
};

function formatDate(input?: string) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString();
}

function formatDateTime(input?: string) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}

export default function AppointmentsTable({
  data,
  pageCount: providedPageCount,
  search,
  onSearchChange,
  isLoading,
  title,
}: {
  data: Appointment[];
  pageCount?: number;
  search?: string;
  // eslint-disable-next-line no-unused-vars
  onSearchChange?: (value: string) => void;
  isLoading: boolean;
  title: string;
}) {
  const appointments = useMemo(() => data, [data]);
  const pageCount = providedPageCount ?? Math.ceil((appointments.length || 1) / 10);

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        id: 'patientName',
        accessorKey: 'patientName',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Patient" />,
        cell: ({ cell }) => {
          const name = cell.getValue<Appointment['patientName']>();
          return (
            <div className="inline-flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{name ?? '—'}</span>
            </div>
          );
        },
        meta: {
          label: 'Patient',
          variant: 'text',
          icon: User,
        },
      },
      {
        id: 'doctorName',
        accessorKey: 'doctorName',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Doctor" />,
        cell: ({ cell }) => {
          const name = cell.getValue<Appointment['doctorName']>();
          return (
            <div className="inline-flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="font-medium">{name ?? '—'}</span>
            </div>
          );
        },
        meta: {
          label: 'Doctor',
          variant: 'text',
          icon: Stethoscope,
        },
      },
      {
        id: 'date',
        accessorKey: 'date',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Date" />,
        cell: ({ cell }) => {
          const date = cell.getValue<Appointment['date']>();
          return (
            <div className="text-muted-foreground inline-flex items-center gap-1 text-sm">
              <CalendarClock className="h-4 w-4" />
              {formatDate(date)}
            </div>
          );
        },
        meta: {
          label: 'Date',
          variant: 'dateRange',
          icon: CalendarClock,
          operator: 'isBetween',
        },
        enableColumnFilter: true,
      },
      {
        id: 'time',
        accessorKey: 'time',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Time" />,
        cell: ({ cell }) => {
          const time = cell.getValue<Appointment['time']>();
          return (
            <div className="text-muted-foreground inline-flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              {time}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
        cell: ({ cell }) => {
          const status = cell.getValue<Appointment['status']>();
          const variant = STATUS_VARIANTS[status] ?? {
            className: '',
            label: status,
          };
          return (
            <Badge
              variant="outline"
              className={`inline-flex items-center gap-1 border-0 ${variant.className}`}
            >
              <CircleDot className="h-3 w-3" />
              {variant.label}
            </Badge>
          );
        },
        meta: {
          label: 'Status',
          variant: 'multiSelect',
          options: [
            { label: 'Pending', value: 'PENDING', icon: CircleDot },
            { label: 'Confirmed', value: 'CONFIRMED', icon: CircleDot },
            { label: 'Completed', value: 'COMPLETED', icon: CircleDot },
            { label: 'Cancelled', value: 'CANCELLED', icon: CircleDot },
          ],
          operator: 'inArray',
        },
        enableColumnFilter: true,
      },
      {
        id: 'reason',
        accessorKey: 'reason',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Reason" />,
        cell: ({ cell }) => {
          const reason = cell.getValue<Appointment['reason']>();
          return (
            <span className="text-muted-foreground max-w-[200px] truncate text-sm">
              {reason ?? '—'}
            </span>
          );
        },
        meta: {
          label: 'Reason',
          variant: 'text',
          icon: Text,
        },
        enableSorting: false,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
        cell: ({ cell }) => {
          const created = cell.getValue<Appointment['createdAt']>();
          return (
            <div className="text-muted-foreground inline-flex items-center gap-1 text-sm">
              <CalendarClock className="h-4 w-4" />
              {formatDateTime(created)}
            </div>
          );
        },
        sortingFn: 'datetime',
      },
      {
        id: 'actions',
        cell: ({ row }) => <AppointmentActionsMenu appointment={row.original} />,
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const { table } = useDataTable<Appointment>({
    clearOnDefault: false,
    data: appointments,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: 'date', desc: true }],
      columnPinning: { right: ['actions'] },
      pagination: { pageIndex: 0, pageSize: 10 },
      globalFilter: search,
      columnVisibility: {
        reason: false,
      },
    },
    getRowId: row => row.id,
    onGlobalFilterChange: value => {
      onSearchChange?.(value ?? '');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} isLoading={isLoading} />
      </DataTable>
    </div>
  );
}
