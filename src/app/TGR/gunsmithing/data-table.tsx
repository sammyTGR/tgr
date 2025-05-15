import * as React from 'react';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { DataTablePagination } from './pagination';
import { ColumnDef, FirearmsMaintenanceData, columns } from './columns';
import { DataTableRowActions } from './data-table-row-actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import classNames from 'classnames';
import styles from './profiles.module.css';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';

// Add this type definition at the top of your file
type CustomColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  initial?: boolean;
};

interface DataTableProps<TData extends FirearmsMaintenanceData, TValue> {
  columns: CustomColumnDef<TData, TValue>[]; // Updated this line
  data: TData[];
  userRole: string;
  userUuid: string;
  onStatusChange: (id: number, status: string | null) => void;
  onNotesChange: (id: number, notes: string) => void;
  onUpdateFrequency: (id: number, frequency: number) => void;
  onDeleteFirearm: (id: number) => void;
}

type NotesFormData = {
  maintenance_notes: string;
};

export function DataTable<TData extends FirearmsMaintenanceData, TValue>({
  columns,
  data,
  userRole,
  userUuid,
  onStatusChange,
  onNotesChange,
  onUpdateFrequency,
  onDeleteFirearm,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(26);
  const [pageCount, setPageCount] = React.useState(0);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    const initialVisibility: VisibilityState = {};
    columns.forEach((column) => {
      if (column.id) {
        initialVisibility[column.id] =
          column.id === 'maintenance_frequency' ? false : column.initial !== false;
      }
    });
    return initialVisibility;
  });

  React.useEffect(() => {
    setPageCount(Math.ceil(data.length / pageSize));
  }, [data, pageSize]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newPaginationState =
        typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(newPaginationState.pageIndex);
      setPageSize(newPaginationState.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  const NotesCell = ({ row, onNotesChange }: { row: any; onNotesChange: any }) => {
    const form = useForm<NotesFormData>({
      defaultValues: {
        maintenance_notes: row.original.maintenance_notes || '',
      },
    });

    const onSubmit = (data: NotesFormData) => {
      onNotesChange(row.original.id, data.maintenance_notes);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="maintenance_notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-[100px]"
                    onChange={(e) => {
                      field.onChange(e);
                      // Only update parent state, don't save yet
                      onNotesChange(row.original.id, e.target.value, false);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" variant="outline" size="sm">
            Save Notes
          </Button>
        </form>
      </Form>
    );
  };

  return (
    <div className="flex flex-col max-h-full w-full overflow-hidden">
      <div className="flex flex-row items-center justify-between mx-2 my-2 overflow-hidden">
        <Input
          placeholder="Filter By Firearm Name..."
          value={(table.getColumn('firearm_name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('firearm_name')?.setFilterValue(event.target.value)}
          className="max-w-sm w-full"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-hidden max-h-full rounded-md w-full">
        <div className="overflow-hidden">
          <ScrollArea
            className={classNames(
              styles.noScroll,
              'h-[calc(100vh-300px)] w-full overflow-auto relative'
            )}
          >
            <Table className="w-full overflow-hidden">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="overflow-hidden">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DataTableRowActions
                          row={row}
                          userRole={userRole}
                          userUuid={userUuid}
                          onStatusChange={onStatusChange}
                          onNotesChange={onNotesChange}
                          onUpdateFrequency={onUpdateFrequency}
                          onDeleteFirearm={onDeleteFirearm}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="overflow-hidden">
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
      <div className="mt-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
