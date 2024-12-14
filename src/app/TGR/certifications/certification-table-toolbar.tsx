// src/app/TGR/certifications/certification-table-toolbar.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { statuses } from "./statuses";
import { useState } from "react";

interface CertificationTableToolbarProps<TData> {
  table: Table<TData>;
  onFilterChange: (filters: ColumnFiltersState) => void;
}

export function CertificationTableToolbar<TData>({
  table,
  onFilterChange,
}: CertificationTableToolbarProps<TData>) {
  const [filterValues, setFilterValues] = useState<{
    name: string;
    certificate: string;
    action_status?: string[];
  }>({
    name: "",
    certificate: "",
    action_status: [],
  });

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: string | string[]) => {
    // Update local state
    setFilterValues((prev) => ({
      ...prev,
      [columnId]: value,
    }));

    // Create new filters array
    const newFilters: ColumnFiltersState = Object.entries({
      ...filterValues,
      [columnId]: value,
    })
      .filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== "";
      })
      .map(([id, value]) => ({
        id,
        value,
      }));

    // Update filters through the callback
    onFilterChange(newFilters);
  };

  // Check if any filters are applied
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 mb-2 mt-2">
        <Input
          placeholder="Filter By Name..."
          value={filterValues.name}
          onChange={(event) => handleFilterChange("name", event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Certificate"
          value={filterValues.certificate}
          onChange={(event) =>
            handleFilterChange("certificate", event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {/* {table.getColumn("action_status") && (
          <DataTableFacetedFilter
            column={table.getColumn("action_status")!}
            title="Status"
            options={statuses}
            onSelect={(selectedValues) =>
              handleFilterChange("action_status", selectedValues)
            }
          />
        )} */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilterValues({ name: "", certificate: "", action_status: [] });
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
