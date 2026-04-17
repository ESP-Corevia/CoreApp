'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Calendar, FileSpreadsheet, FileText, Image, Mail } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { useDataTable } from '@/hooks/use-data-table';

import { DocumentActionsMenu } from './document-actions-menu';

export interface AdminDocument {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  status: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return FileSpreadsheet;
}

function getMimeBadgeVariant(
  mimeType: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (mimeType.startsWith('image/')) return 'default';
  if (mimeType === 'application/pdf') return 'destructive';
  return 'secondary';
}

function getMimeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'image/jpeg') return 'JPEG';
  if (mimeType === 'image/png') return 'PNG';
  if (mimeType === 'image/webp') return 'WebP';
  if (mimeType === 'application/msword') return 'DOC';
  if (mimeType.includes('wordprocessingml')) return 'DOCX';
  return mimeType.split('/').pop()?.toUpperCase() ?? 'FILE';
}

export default function DocumentsTable({
  data,
  pageCount: providedPageCount,
  search,
  onSearchChange,
  isLoading,
  title,
  includeDeleted,
}: {
  data: AdminDocument[];
  pageCount?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  isLoading: boolean;
  title: string;
  includeDeleted: boolean;
}) {
  const documents = useMemo(() => data, [data]);
  const pageCount = providedPageCount ?? Math.ceil((documents.length || 1) / 10);
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<AdminDocument>[]>(
    () => [
      {
        id: 'fileName',
        accessorKey: 'fileName',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('documents.table.fileName', 'File Name')}
          />
        ),
        cell: ({ row }) => {
          const Icon = getMimeIcon(row.original.mimeType);
          const isDeleted = !!row.original.deletedAt;
          return (
            <div
              className={`flex items-center gap-2 ${isDeleted ? 'line-through opacity-50' : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="max-w-[200px] truncate" title={row.original.fileName}>
                {row.original.fileName}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'user',
        accessorKey: 'userName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('documents.table.user', 'User')} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row.original.userName}</span>
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <Mail className="h-3 w-3" />
              {row.original.userEmail}
            </span>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'mimeType',
        accessorKey: 'mimeType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('documents.table.type', 'Type')} />
        ),
        cell: ({ cell }) => {
          const mime = cell.getValue<string>();
          return <Badge variant={getMimeBadgeVariant(mime)}>{getMimeLabel(mime)}</Badge>;
        },
        enableSorting: false,
      },
      {
        id: 'fileSize',
        accessorKey: 'fileSize',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('documents.table.size', 'Size')} />
        ),
        cell: ({ cell }) => (
          <span className="text-muted-foreground text-sm">
            {formatFileSize(cell.getValue<number>())}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('documents.table.status', 'Status')} />
        ),
        cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return <Badge variant={status === 'confirmed' ? 'default' : 'outline'}>{status}</Badge>;
        },
        enableSorting: false,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={t('documents.table.uploaded', 'Uploaded')}
          />
        ),
        cell: ({ cell }) => (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            {new Date(cell.getValue<string>()).toLocaleDateString()}
          </div>
        ),
      },
      ...(includeDeleted
        ? [
            {
              id: 'deletedAt',
              accessorKey: 'deletedAt' as const,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  label={t('documents.table.deletedAt', 'Deleted At')}
                />
              ),
              cell: ({ row }) => {
                const val = row.original.deletedAt;
                return val ? (
                  <Badge variant="destructive">{new Date(val).toLocaleDateString()}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                );
              },
              enableSorting: false,
            } satisfies ColumnDef<AdminDocument>,
          ]
        : []),
      {
        id: 'actions',
        cell: ({ row }) => <DocumentActionsMenu document={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t, includeDeleted],
  );

  const { table } = useDataTable<AdminDocument>({
    clearOnDefault: false,
    data: documents,
    columns,
    pageCount,
    enableRowSelection: false,
    initialState: {
      columnPinning: { right: ['actions'] },
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
        <DataTableToolbar
          table={table}
          isLoading={isLoading}
          searchPlaceholder={t('documents.searchPlaceholder', 'Search by user name or email…')}
        />
      </DataTable>
    </div>
  );
}
