import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';
import { EmployeeTableToolbar } from './employee-table-toolbar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import classNames from 'classnames';
import styles from './table.module.css';
import { useSidebar } from '@/components/ui/sidebar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const { state } = useSidebar();
  // console.log("Data passed to DataTable:", data); // Add this line
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <EmployeeTableToolbar table={table} />
      <div
        className={`flex flex-col max-h-full w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] overflow-hidden transition-all duration-300`}
      >
        <div
          className={`flex-1 overflow-hidden max-h-full rounded-md border w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] mt-2 transition-all duration-300`}
        >
          <div className="overflow-hidden">
            <ScrollArea
              className={classNames(
                styles.noScroll,
                'h-[calc(100vh-20rem)] w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] overflow-hidden relative'
              )}
            >
              <Table className="w-full md:w-[calc(100vw-15rem)] lg:w-[calc(100vw-20rem)] overflow-hidden transition-all duration-300">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="vertical" />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
