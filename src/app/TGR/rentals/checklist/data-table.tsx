import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
import { ChevronDown, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FirearmsMaintenanceData, columns } from './columns';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { Input } from '@/components/ui/input';
import { DataTableRowActions } from './data-table-row-actions';

interface DataTableProps<TData extends FirearmsMaintenanceData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  userRole: string;
  userUuid: string;
  onNotesChange: (id: number, notes: string) => void;
  onVerificationComplete: () => Promise<void>;
  onDeleteFirearm: (id: number) => void;
  onEditFirearm: (updatedFirearm: {
    id: number;
    firearm_type: string;
    firearm_name: string;
    maintenance_frequency: number | null;
  }) => void;
  onRequestInspection: (id: number, notes: string) => void;
}

export function DataTable<TData extends FirearmsMaintenanceData, TValue>({
  columns,
  data,
  userRole,
  userUuid,
  onNotesChange,
  onVerificationComplete,
  onDeleteFirearm,
  onEditFirearm,
  onRequestInspection,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchValue, setSearchValue] = React.useState('');
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      // Custom filter function for handling multiple selected values
      includes: (row, columnId, filterValue) => {
        const cellValue = row.getValue(columnId) as string; // Cast to string
        return filterValue.some((val: string) => cellValue.includes(val));
      },
    },
  });

  const handleSelect = (selectedValues: string[]) => {
    table.getColumn('notes')?.setFilterValue(selectedValues);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    table.getColumn('firearm_name')?.setFilterValue(value);
  };

  const clearSearch = () => {
    setSearchValue('');
    table.getColumn('firearm_name')?.setFilterValue('');
  };

  return (
    <div className="flex flex-col h-full w-full max-h-[80vh]">
      <div className="flex flex-row items-center justify-between mx-2 my-2">
        <div className="flex flex-row items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Filter By Firearm Name..."
              value={searchValue}
              onChange={handleSearchChange}
              className="min-w-full pr-8"
            />
            {searchValue && (
              <Button
                variant="link"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <DataTableFacetedFilter
            columnId="notes"
            title="Filter By Notes"
            options={[
              { label: 'With Gunsmith', value: 'With Gunsmith' },
              { label: 'Currently Rented Out', value: 'Currently Rented Out' },
              { label: 'Out For Warranty Repair', value: 'Out For Warranty Repair' },
            ]}
            onSelect={(selectedValues) =>
              table.getColumn('notes')?.setFilterValue(selectedValues.join(','))
            }
          />
        </div>
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
      <div className="flex-1 h-full w-full overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const metaStyle = (
                    header.column.columnDef.meta as {
                      style?: React.CSSProperties;
                    }
                  )?.style;
                  return (
                    <TableHead key={header.id} style={metaStyle}>
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={row.original.highlight ? `text-${row.original.highlight}` : ''}
                >
                  {row.getVisibleCells().map((cell) => {
                    const metaStyle = (
                      cell.column.columnDef.meta as {
                        style?: React.CSSProperties;
                      }
                    )?.style;
                    return (
                      <TableCell key={cell.id} style={metaStyle}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <DataTableRowActions
                      row={row}
                      userRole={userRole}
                      userUuid={userUuid}
                      onNotesChange={onNotesChange}
                      onVerificationComplete={onVerificationComplete}
                      onDeleteFirearm={onDeleteFirearm}
                      onEditFirearm={onEditFirearm}
                      onRequestInspection={onRequestInspection}
                    />
                  </TableCell>
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
      </div>
    </div>
  );
}
