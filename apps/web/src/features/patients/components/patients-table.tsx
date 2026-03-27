'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  CalendarDays,
  ClipboardCopy,
  Heart,
  Mail,
  MapPin,
  Phone,
  Text,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDataTable } from '@/hooks/use-data-table';

import { PatientActionsMenu } from './patient-actions-menu';

export interface Patient {
  userId: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean;
  createdAt: string;
  updatedAt: string | null;
  patientId: string;
  dateOfBirth: string;
  gender: string;
  phone: string | null;
  patientAddress: string | null;
  bloodType: string | null;
  allergies: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export default function PatientsTable({
  data,
  pageCount: providedPageCount,
  search,
  onSearchChange,
  onGenderChange,
  isLoading,
  title,
}: {
  data: Patient[];
  pageCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  onGenderChange?: (gender: string | null) => void;
  isLoading: boolean;
  title: string;
}) {
  const patients = useMemo(() => data, [data]);
  const pageCount = providedPageCount ?? Math.ceil((patients.length || 1) / 10);
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        id: 'userId',
        accessorKey: 'userId',
        header: ({ column }) => <DataTableColumnHeader column={column} label="ID" />,
        cell: ({ cell }) => {
          const id = cell.getValue<string>();
          return (
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1 font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
              title={id}
              onClick={() => {
                navigator.clipboard.writeText(id);
                toast.success(t('users.idCopied', 'User ID copied to clipboard'));
              }}
            >
              <ClipboardCopy className="h-3 w-3" />
              {id.slice(0, 8)}...
            </button>
          );
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.image ?? undefined} />
              <AvatarFallback>{row.original.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.name}</span>
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
        cell: ({ cell }) => (
          <div className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="text-muted-foreground text-sm">{cell.getValue<string>()}</span>
          </div>
        ),
        meta: {
          label: 'Email',
          variant: 'text',
          icon: Mail,
        },
      },
      {
        id: 'gender',
        accessorKey: 'gender',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Gender" />,
        cell: ({ cell }) => {
          const gender = cell.getValue<string>();
          return (
            <Badge variant="outline" className="inline-flex items-center gap-1 capitalize">
              <UserRound className="h-3.5 w-3.5" />
              {gender.toLowerCase()}
            </Badge>
          );
        },
        meta: {
          label: 'Gender',
          variant: 'multiSelect',
          options: [
            { label: 'Male', value: 'MALE', icon: UserRound },
            { label: 'Female', value: 'FEMALE', icon: UserRound },
          ],
          operator: 'inArray',
        },
        enableColumnFilter: true,
      },
      {
        id: 'dateOfBirth',
        accessorKey: 'dateOfBirth',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Date of Birth" />,
        cell: ({ cell }) => (
          <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
            <CalendarDays className="h-4 w-4" />
            {cell.getValue<string>()}
          </div>
        ),
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Phone" />,
        cell: ({ cell }) => {
          const phone = cell.getValue<string | null>();
          return (
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
              <Phone className="h-4 w-4" />
              {phone ?? '—'}
            </div>
          );
        },
      },
      {
        id: 'bloodType',
        accessorKey: 'bloodType',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Blood Type" />,
        cell: ({ cell }) => {
          const bt = cell.getValue<string | null>();
          return bt ? (
            <Badge variant="secondary" className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {bt}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
        enableHiding: true,
      },
      {
        id: 'patientAddress',
        accessorKey: 'patientAddress',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Address" />,
        cell: ({ cell }) => {
          const addr = cell.getValue<string | null>();
          return (
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              {addr ?? '—'}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: 'allergies',
        accessorKey: 'allergies',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Allergies" />,
        cell: ({ cell }) => {
          const allergies = cell.getValue<string | null>();
          return <span className="text-muted-foreground text-sm">{allergies ?? '—'}</span>;
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: 'actions',
        cell: ({ row }) => <PatientActionsMenu patient={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t],
  );

  const { table } = useDataTable<Patient>({
    clearOnDefault: false,
    data: patients,
    columns,
    pageCount,
    initialState: {
      columnPinning: { right: ['actions'] },
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageIndex: 0, pageSize: 10 },
      globalFilter: search,
      columnVisibility: {
        userId: false,
        patientAddress: false,
        allergies: false,
      },
    },
    getRowId: row => row.patientId,
    onGlobalFilterChange: value => {
      onSearchChange?.(value ?? '');
    },
  });

  const columnFilters = table.getState().columnFilters;
  // biome-ignore lint/correctness/useExhaustiveDependencies: columnFilters triggers re-evaluation when filter changes
  useEffect(() => {
    const genderFilter = table.getColumn('gender')?.getFilterValue() as string[] | undefined;
    const value = genderFilter?.length === 1 ? genderFilter[0] : null;
    onGenderChange?.(value);
  }, [columnFilters, onGenderChange, table]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{title}</h1>
      </div>
      <DataTable table={table}>
        <DataTableToolbar
          table={table}
          isLoading={isLoading}
          searchPlaceholder={t('patients.searchPlaceholder', 'Search by name or email…')}
        />
      </DataTable>
    </div>
  );
}
