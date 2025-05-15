// src/app/sales/orderreview/order-table-toolbar.tsx

'use client';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from '../../admin/audits/review/data-table-view-options';
import { statuses } from './data'; // Use the updated statuses
import { DataTableFacetedFilter } from './data-table-faceted-filter'; // Updated import

interface OrderTableToolbarProps<TData> {
  table: Table<TData>;
}

export function OrderTableToolbar<TData>({ table }: OrderTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter By Customer Name..."
          value={(table.getColumn('customer_name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('customer_name')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Email..."
          value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('email')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Manufacturer..."
          value={(table.getColumn('manufacturer')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('manufacturer')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Phone..."
          value={(table.getColumn('phone')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('phone')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
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
        )} */}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
