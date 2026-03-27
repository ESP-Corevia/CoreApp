'use client';

import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons';

import type { ColumnDef } from '@tanstack/react-table';
import { Ban, CalendarClock, ClipboardCopy, History, Mail, Shield, Text } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDataTable } from '@/hooks/use-data-table';
import { convertToExtendedFilters } from '@/lib/data-table';
import type { ExtendedColumnFilter, ExtendedColumnSort, User } from '@/types/data-table';

import { CreateUserDialog } from './modals/userCreateDialog';
import { UserActionsMenu } from './userActionsMenu';

function formatDate(input?: string) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}

export default function DataTableUsers({
  data,
  pageCount: providedPageCount,
  search,
  onSearchChange,
  isLoading,
  onFiltersChange,
  onSortingChange,
  title,
}: {
  data: User[];
  pageCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  onFiltersChange?: (filters: ExtendedColumnFilter<User>[]) => void;
  onSortingChange?: (sorting: ExtendedColumnSort<User>) => void;
  isLoading: boolean;
  title: string;
}) {
  const users = useMemo(() => data, [data]);
  const pageCount = providedPageCount ?? Math.ceil((users.length || 1) / 10);

  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'id',
        accessorKey: 'id',
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
      // {
      //   id: 'select',
      //   header: ({ table }) => (
      //     <Checkbox
      //       checked={
      //         table.getIsAllPageRowsSelected() ||
      //         (table.getIsSomePageRowsSelected() && 'indeterminate')
      //       }
      //       onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
      //       aria-label="Select all"
      //     />
      //   ),
      //   cell: ({ row }) => (
      //     <Checkbox
      //       checked={row.getIsSelected()}
      //       onCheckedChange={value => row.toggleSelected(!!value)}
      //       aria-label="Select row"
      //     />
      //   ),
      //   size: 32,
      //   enableSorting: false,
      //   enableHiding: false,
      // },
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
        // enableColumnFilter: true,
        // enableSorting: false,
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Email" />,
        cell: ({ cell }) => {
          const email = cell.getValue<User['email']>();
          return (
            <div className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-muted-foreground text-sm">{email}</span>
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
        id: 'role',
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Role" />,
        cell: ({ cell }) => {
          const role = cell.getValue<User['role']>() ?? 'patient';
          return (
            <Badge variant="outline" className="inline-flex items-center gap-1 capitalize">
              <Shield className="h-3.5 w-3.5" />
              {role}
            </Badge>
          );
        },
        meta: {
          label: 'Role',
          variant: 'multiSelect',
          options: [
            { label: 'Patient', value: 'patient', icon: Shield },
            { label: 'Doctor', value: 'doctor', icon: Shield },
            { label: 'Admin', value: 'admin', icon: Shield },
          ],
          operator: 'inArray',
        },
        enableColumnFilter: true,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
        cell: ({ cell }) => {
          const created = cell.getValue<User['createdAt']>();
          return (
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
              <CalendarClock className="h-4 w-4" />
              {formatDate(created)}
            </div>
          );
        },
        sortingFn: 'datetime',
        enableColumnFilter: true,
        meta: {
          label: 'Created At',
          variant: 'dateRange',
          icon: CalendarClock,
          operator: 'isBetween',
        },
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Updated At" />,
        cell: ({ cell }) => {
          const updated = cell.getValue<User['updatedAt']>();
          return (
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
              <CalendarClock className="h-4 w-4" />
              {formatDate(updated ?? undefined)}
            </div>
          );
        },
        sortingFn: 'datetime',
        enableColumnFilter: true,
        meta: {
          label: 'Updated At',
          variant: 'dateRange',
          icon: CalendarClock,
          operator: 'isBetween',
        },
      },
      {
        id: 'lastLoginMethod',
        accessorKey: 'lastLoginMethod',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Last Login Method" />,
        cell: ({ cell }) => {
          const method = cell.getValue<User['lastLoginMethod']>() ?? '—';
          return (
            <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
              <History className="h-4 w-4" />
              {method}
            </div>
          );
        },
        meta: {
          label: 'Last Login Method',
          variant: 'multiSelect',
          options: [
            { label: 'GitHub', value: 'github', icon: SiGithub },
            { label: 'Google', value: 'google', icon: SiGoogle },
            { label: 'Email', value: 'email', icon: Mail },
          ],
          operator: 'inArray',
        },
        enableColumnFilter: true,
        enableHiding: true,
        enableSorting: false,
      },
      {
        id: 'banned',
        accessorKey: 'banned',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Banned" />,
        cell: ({ cell }) => {
          const banned = cell.getValue<User['banned']>();
          return (
            <span className={`text-sm ${banned ? 'text-red-600' : 'text-green-600'}`}>
              {banned ? 'Yes' : 'No'}
            </span>
          );
        },
        meta: {
          label: 'Banned',
          variant: 'select',
          icon: Ban,
          options: [
            { label: 'Yes', value: 'true', icon: Ban },
            { label: 'No', value: 'false', icon: Ban },
          ],
          operator: 'eq',
        },
        enableColumnFilter: true,
        enableHiding: true,
        enableSorting: false,
      },
      {
        id: 'banReason',
        accessorKey: 'banReason',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Ban Reason" />,
        cell: ({ cell }) => {
          const reason = cell.getValue<User['banReason']>() ?? '—';
          return <span className="text-sm">{reason}</span>;
        },
        meta: {
          label: 'Ban Reason',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: false,
        enableHiding: true,
        enableSorting: false,
      },
      {
        id: 'banExpires',
        accessorKey: 'banExpires',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Ban Expires" />,
        cell: ({ cell }) => {
          const expires = cell.getValue<User['banExpires']>();
          return <span className="text-sm">{formatDate(expires ?? undefined)}</span>;
        },
        sortingFn: 'datetime',
        meta: {
          label: 'Ban Expires',
          variant: 'dateRange',
          icon: CalendarClock,
        },
        enableColumnFilter: false,
        enableHiding: true,
      },
      {
        id: 'emailVerified',
        accessorKey: 'emailVerified',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Email Verified" />,
        cell: ({ cell }) => {
          const emailVerified = cell.getValue<User['emailVerified']>();
          return (
            <span className={`text-sm ${emailVerified ? 'text-green-600' : 'text-red-600'}`}>
              {emailVerified ? 'Yes' : 'No'}
            </span>
          );
        },
        meta: {
          label: 'Email Verified',
          variant: 'boolean',
          icon: Shield,
        },
        enableColumnFilter: true,
        enableHiding: true,
        enableSorting: false,
      },
      {
        id: 'actions',
        cell: ({ row }) => <UserActionsMenu user={row.original} />,
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t],
  );

  const { table, filters } = useDataTable<User>({
    clearOnDefault: false,
    data: users,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] /*left: ['select']*/ },
      pagination: { pageIndex: 0, pageSize: 10 },
      globalFilter: search,
      columnVisibility: {
        lastLoginMethod: false,
        banReason: false,
        banExpires: false,
        updatedAt: false,
      },
    },
    getRowId: row => row.id,
    onGlobalFilterChange: value => {
      onSearchChange?.(value ?? '');
    },
  });
  useEffect(() => {
    const filterableColumns = table.getAllColumns().filter(col => col.columnDef.enableColumnFilter);
    const extendedFilters = convertToExtendedFilters(filters, filterableColumns);

    onFiltersChange?.(extendedFilters);
  }, [filters, onFiltersChange, table]);
  useEffect(() => {
    const sortingState = table.getState().sorting;
    const extendedSorting = sortingState[0] as ExtendedColumnSort<User>;

    onSortingChange?.(extendedSorting);
  }, [table, onSortingChange]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{title}</h1>
        <CreateUserDialog />
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} isLoading={isLoading} />
      </DataTable>
    </div>
  );
}
