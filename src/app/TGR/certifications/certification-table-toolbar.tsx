// src/app/TGR/certifications/certification-table-toolbar.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { statuses } from "./statuses";

interface CertificationTableToolbarProps<TData> {
  table: Table<TData>;
  onFilterChange: (filters: ColumnFiltersState) => void;
}

export function CertificationTableToolbar<TData>({
  table,
  onFilterChange,
}: CertificationTableToolbarProps<TData>) {
  // Get current filter values
  const getColumnFilterValue = (columnId: string) => {
    const column = table.getColumn(columnId);
    return column?.getFilterValue() ?? "";
  };

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: unknown) => {
    const column = table.getColumn(columnId);
    if (column) {
      column.setFilterValue(value);

      // Get all current filters
      const newFilters = table
        .getAllColumns()
        .map((col) => ({
          id: col.id,
          value: col.getFilterValue(),
        }))
        .filter(
          (filter) => filter.value != null && filter.value !== ""
        ) as ColumnFiltersState;

      onFilterChange(newFilters);
    }
  };

  // Check if any filters are applied
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 p-1">
        <Input
          placeholder="Filter By Name..."
          value={getColumnFilterValue("name") as string}
          onChange={(event) => handleFilterChange("name", event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Certificate"
          value={getColumnFilterValue("certificate") as string}
          onChange={(event) =>
            handleFilterChange("certificate", event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* <Input
          placeholder="Filter By Number"
          value={getColumnFilterValue("number") as string}
          onChange={(event) => handleFilterChange("number", event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        /> */}
        {table.getColumn("action_status") && (
          <DataTableFacetedFilter
            column={table.getColumn("action_status")!}
            title="Status"
            options={statuses}
            onSelect={(selectedValues) =>
              handleFilterChange("action_status", selectedValues)
            }
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              onFilterChange([]);
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
