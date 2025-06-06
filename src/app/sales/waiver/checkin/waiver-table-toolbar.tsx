// src/app/sales/waiver/checkin/waiver-table-toolbar.tsx

'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from '@/app/admin/audits/review/data-table-view-options';
import { DataTableFacetedFilter } from './data-table-faceted-filter';

interface WaiverTableToolbarProps<TData> {
  table: Table<TData>;
}

export function WaiverTableToolbar<TData>({ table }: WaiverTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter By First Name..."
          value={(table.getColumn('first_name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('first_name')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Last Name..."
          value={(table.getColumn('last_name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('last_name')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Email..."
          value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('email')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Phone..."
          value={(table.getColumn('phone')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('phone')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('status') && (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title="Status"
            options={[{ value: 'checked_in', label: 'Checked In' }]}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
