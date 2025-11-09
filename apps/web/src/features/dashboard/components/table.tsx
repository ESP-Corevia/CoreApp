'use client';

import * as React from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import { CalendarClock, Mail, Shield, Text } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';

import { UserActionsMenu } from './user-actions-menu';
import { CreateUserDialog } from './user-create-dialog';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string; // Better Auth returns role as string
  createdAt: string; // ISO string
  updatedAt?: string;
  emailVerified?: boolean;
  image?: string | null;
  banned?: boolean;
  banExpires?: string | null;
  banReason?: string | null;
  lastLoginMethod?: string | null;
}

function formatDate(input?: string) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString();
}

export default function DataTableDemo({
  data,
  pageCount: providedPageCount,
}: {
  data: User[];
  pageCount?: number;
}) {
  // Data is already filtered/sorted/paginated by Better Auth
  const users = React.useMemo(() => data, [data]);
  const pageCount = providedPageCount ?? Math.ceil((users.length || 1) / 10);

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
        cell: ({ cell }) => {
          return <div className="font-medium">{cell.getValue<User['email']>()}</div>;
        },
        meta: {
          label: 'Name',
          // placeholder: 'Search…',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: true,
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
        enableColumnFilter: true,
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Role" />,
        cell: ({ cell }) => {
          const role = cell.getValue<User['role']>() || 'user';
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
            { label: 'Admin', value: 'admin', icon: Shield },
            { label: 'User', value: 'user', icon: Shield },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} label="CreatedAt" />,
        cell: ({ cell }) => {
          const created = cell.getValue<User['createdAt']>();
          return (
            <div className="text-muted-foreground inline-flex items-center gap-1 text-sm">
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
        },
      },
      {
        id: 'actions',
        cell: function Cell({ row }) {
          return <UserActionsMenu user={row.original} />;
        },
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const { table } = useDataTable({
    data: users,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: row => row.id,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <CreateUserDialog />
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
