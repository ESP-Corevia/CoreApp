'use client';

import * as React from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons';
import { CalendarClock, Mail, Shield, Text, User, History } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';

import { UserActionsMenu } from './user-actions-menu';
import { CreateUserDialog } from './user-create-dialog';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
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

export default function DataTableUsers({
  data,
  pageCount: providedPageCount,
  search,
  onSearchChange,
  isLoading,
  title,
}: {
  data: User[];
  pageCount?: number;
  search?: string;
  // eslint-disable-next-line no-unused-vars
  onSearchChange?: (value: string) => void;
  isLoading: boolean;
  title: string;
}) {
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
        id: 'fullName',
        accessorKey: 'fullName',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Full Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.image ?? undefined} />
              <AvatarFallback>
                {row.original.firstName.charAt(0).toUpperCase() +
                  row.original.lastName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </span>
          </div>
        ),
        meta: {
          label: 'Full Name',
          variant: 'text',
          icon: Text,
        },
        // enableColumnFilter: true,
        enableSorting: false,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-muted-foreground text-sm">{row.original.name}</span>
          </div>
        ),
        meta: {
          label: 'Name',
          variant: 'text',
          icon: Text,
        },
        // enableColumnFilter: true,
        enableSorting: false,
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
        header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
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
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Updated At" />,
        cell: ({ cell }) => {
          const updated = cell.getValue<User['updatedAt']>();
          return (
            <div className="text-muted-foreground inline-flex items-center gap-1 text-sm">
              <CalendarClock className="h-4 w-4" />
              {formatDate(updated)}
            </div>
          );
        },
        sortingFn: 'datetime',
        enableColumnFilter: true,
        meta: {
          label: 'Updated At',
          variant: 'dateRange',
          icon: CalendarClock,
        },
      },
      {
        id: 'lastLoginMethod',
        accessorKey: 'lastLoginMethod',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Last Login Method" />,
        cell: ({ cell }) => {
          const method = cell.getValue<User['lastLoginMethod']>() ?? '—';
          return (
            <div className="text-muted-foreground inline-flex items-center gap-1 text-sm">
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
        },
        enableColumnFilter: true,
        enableHiding: true,
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
          variant: 'boolean',
          icon: Shield,
        },
        enableColumnFilter: true,
        enableHiding: true,
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
        id: 'actions',
        cell: ({ row }) => <UserActionsMenu user={row.original} />,
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const { table } = useDataTable<User>({
    clearOnDefault: false,
    data: users,
    columns,
    pageCount,

    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'], left: ['select'] },
      pagination: { pageIndex: 0, pageSize: 10 },
      globalFilter: search,
      columnVisibility: {
        lastLoginMethod: false,
        banned: false,
        banReason: false,
        banExpires: false,
        updatedAt: false,
        name: false,
      },
    },

    getRowId: row => row.id,
    onGlobalFilterChange: value => {
      onSearchChange?.(value);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <CreateUserDialog />
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} isLoading={isLoading} />
      </DataTable>
    </div>
  );
}
