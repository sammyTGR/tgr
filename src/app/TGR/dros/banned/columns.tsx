'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DatabaseFirearm } from './types';
import { DataTableColumnHeader } from './data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { FirearmTableRowActions } from './firearm-table-row-actions';

export const columns = (userRole?: string): ColumnDef<DatabaseFirearm>[] => {
  const baseColumns: ColumnDef<DatabaseFirearm>[] = [
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant={type === 'rifle' ? 'destructive' : 'default'}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'manufacturer',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Manufacturer" />,
    },
    {
      accessorKey: 'model',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Model" />,
    },
    {
      accessorKey: 'variations',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Variations" />,
      cell: ({ row }) => {
        const variation = row.getValue('variations') as string | null;

        return variation ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{variation}</Badge>
          </div>
        ) : (
          ''
        );
      },
    },
  ];

  // Only add actions column for admin and dev roles
  if (userRole === 'admin' || userRole === 'dev') {
    baseColumns.push({
      id: 'actions',
      cell: ({ row }) => <FirearmTableRowActions row={row} />,
    });
  }

  return baseColumns;
};
