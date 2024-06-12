// src/app/TGR/certifications/certification-table-toolbar.tsx
"use client";
import { useState, useEffect } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { statuses } from "./statuses";

interface CertificationTableToolbarProps<TData> {
  table: Table<TData>;
  onFilterChange: (filters: any[]) => void;
}

export function CertificationTableToolbar<TData>({
  table,
  onFilterChange,
}: CertificationTableToolbarProps<TData>) {
  const [nameFilter, setNameFilter] = useState("");
  const [certificateFilter, setCertificateFilter] = useState("");
  const [numberFilter, setNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Check if any filter is applied
  const isFiltered =
    nameFilter.length > 0 ||
    certificateFilter.length > 0 ||
    numberFilter.length > 0 ||
    statusFilter.length > 0;

  // Sync local state with table state
  useEffect(() => {
    const columnFilters = table.getState().columnFilters;
    columnFilters.forEach((filter) => {
      if (filter.id === "name") setNameFilter(filter.value as string);
      if (filter.id === "certificate")
        setCertificateFilter(filter.value as string);
      if (filter.id === "number") setNumberFilter(filter.value as string);
      if (filter.id === "status") setStatusFilter(filter.value as string[]);
    });
  }, [table]);

  const handleFilterChange = (columnId: string, value: string | string[]) => {
    table.getColumn(columnId)?.setFilterValue(value);

    // Update the corresponding local state
    if (columnId === "name") setNameFilter(value as string);
    if (columnId === "certificate") setCertificateFilter(value as string);
    if (columnId === "number") setNumberFilter(value as string);
    if (columnId === "status") setStatusFilter(value as string[]);

    // Update filters in the parent component
    const newFilters = table
      .getState()
      .columnFilters.map((filter) =>
        filter.id === columnId ? { id: columnId, value } : filter
      );
    onFilterChange(newFilters);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 p-1">
        <Input
          placeholder="Filter By Name..."
          value={table.getColumn("name")?.getFilterValue() as string}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Certificate"
          value={table.getColumn("certificate")?.getFilterValue() as string}
          onChange={(event) =>
            table.getColumn("certificate")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Number"
          value={table.getColumn("number")?.getFilterValue() as string}
          onChange={(event) =>
            table.getColumn("number")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
            onSelect={(selectedValues) =>
              handleFilterChange("status", selectedValues)
            }
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setNameFilter("");
              setCertificateFilter("");
              setNumberFilter("");
              setStatusFilter([]);
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
