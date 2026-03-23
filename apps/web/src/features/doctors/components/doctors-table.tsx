'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Mail, MapPin, Stethoscope, Text } from 'lucide-react';
import { useMemo } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDataTable } from '@/hooks/use-data-table';

export interface Doctor {
  id: string;
  userId: string | null;
  specialty: string;
  address: string;
  city: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export default function DoctorsTable({
  data,
  pageCount: providedPageCount,
  search,
  onSearchChange,
  isLoading,
  title,
}: {
  data: Doctor[];
  pageCount?: number;
  search?: string;
  // eslint-disable-next-line no-unused-vars
  onSearchChange?: (value: string) => void;
  isLoading: boolean;
  title: string;
}) {
  const doctors = useMemo(() => data, [data]);
  const pageCount = providedPageCount ?? Math.ceil((doctors.length || 1) / 10);

  const columns = useMemo<ColumnDef<Doctor>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.image ?? undefined} />
              <AvatarFallback>{(row.original.name ?? 'D').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.name ?? '—'}</span>
          </div>
        ),
        meta: {
          label: 'Name',
          variant: 'text',
          icon: Text,
        },
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Email" />,
        cell: ({ cell }) => {
          const email = cell.getValue<Doctor['email']>();
          return (
            <div className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-muted-foreground text-sm">{email ?? '—'}</span>
            </div>
          );
        },
        meta: {
          label: 'Email',
          variant: 'text',
          icon: Mail,
        },
      },
      {
        id: 'specialty',
        accessorKey: 'specialty',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Specialty" />,
        cell: ({ cell }) => {
          const specialty = cell.getValue<Doctor['specialty']>();
          return (
            <Badge variant="outline" className="inline-flex items-center gap-1">
              <Stethoscope className="h-3.5 w-3.5" />
              {specialty}
            </Badge>
          );
        },
        meta: {
          label: 'Specialty',
          variant: 'text',
          icon: Stethoscope,
        },
      },
      {
        id: 'city',
        accessorKey: 'city',
        header: ({ column }) => <DataTableColumnHeader column={column} label="City" />,
        cell: ({ cell }) => {
          const city = cell.getValue<Doctor['city']>();
          return (
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              {city}
            </div>
          );
        },
        meta: {
          label: 'City',
          variant: 'text',
          icon: MapPin,
        },
      },
      {
        id: 'address',
        accessorKey: 'address',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Address" />,
        cell: ({ cell }) => {
          const address = cell.getValue<Doctor['address']>();
          return <span className="text-muted-foreground text-sm">{address}</span>;
        },
        enableSorting: false,
      },
    ],
    [],
  );

  const { table } = useDataTable<Doctor>({
    clearOnDefault: false,
    data: doctors,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageIndex: 0, pageSize: 10 },
      globalFilter: search,
    },
    getRowId: row => row.id,
    onGlobalFilterChange: value => {
      onSearchChange?.(value ?? '');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{title}</h1>
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} isLoading={isLoading} />
      </DataTable>
    </div>
  );
}
