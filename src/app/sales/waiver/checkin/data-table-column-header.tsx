// src/app/sales/waiver/checkin/data-table-column-header.tsx

import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  return (
    <div className="flex items-center space-x-2">
      <span>{title}</span>
    </div>
  );
}
