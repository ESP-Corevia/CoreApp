'use client';

import * as React from 'react';

import type { Column, ColumnDef } from '@tanstack/react-table';

import { CalendarClock, Mail, MoreHorizontal, Shield, Text } from 'lucide-react';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDataTable } from '@/hooks/use-data-table';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  role: 'admin' | 'user';
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

export default function DataTableDemo({ data }: { data: User[] }) {
  // URL-synced filters
  const [nameQuery] = useQueryState('name', parseAsString.withDefault(''));
  const [roles] = useQueryState('role', parseAsArrayOf(parseAsString).withDefault([]));

  const filteredData = React.useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    const roleSet = new Set(roles as Array<User['role']>);

    return (data ?? []).filter(user => {
      const displayName =
        user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '';
      const matchesName =
        q === '' || displayName.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
      const matchesRole = roleSet.size === 0 || roleSet.has(user.role);
      return matchesName && matchesRole;
    });
  }, [data, nameQuery, roles]);

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
        header: ({ column }: { column: Column<User, unknown> }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ row, cell }) => {
          const fallback =
            [row.original.firstName, row.original.lastName].filter(Boolean).join(' ') || '';
          const value = (cell.getValue<User['name']>() || fallback) as string;
          return <div className="font-medium">{value || '—'}</div>;
        },
        meta: {
          label: 'Name or email',
          placeholder: 'Search…',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: ({ column }: { column: Column<User, unknown> }) => (
          <DataTableColumnHeader column={column} label="Email" />
        ),
        cell: ({ cell }) => {
          const email = cell.getValue<User['email']>();
          return (
            <div className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-muted-foreground text-sm">{email}</span>
            </div>
          );
        },
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: ({ column }: { column: Column<User, unknown> }) => (
          <DataTableColumnHeader column={column} label="Role" />
        ),
        cell: ({ cell }) => {
          const role = cell.getValue<User['role']>();
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
        header: ({ column }: { column: Column<User, unknown> }) => (
          <DataTableColumnHeader column={column} label="Created" />
        ),
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
      },
      {
        id: 'actions',
        cell: function Cell() {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 32,
      },
    ],
    []
  );

  const { table } = useDataTable({
    data: filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: 'name', desc: false }],
      columnPinning: { right: ['actions'] },
    },
    getRowId: row => row.id,
  });

  return (
    <div className="data-table-container">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
