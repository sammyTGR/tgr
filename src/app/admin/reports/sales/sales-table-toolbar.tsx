"use client";
import { useState, useEffect } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SalesTableToolbarProps<TData> {
  table: Table<TData>;
  totalDROS: number;
  onFilterChange: (filters: any[]) => void;
}

export function SalesTableToolbar<TData>({
  table,
  totalDROS,
  onFilterChange,
}: SalesTableToolbarProps<TData>) {
  const [lanidFilter, setLanidFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Check if any filter is applied
  const isFiltered =
    lanidFilter.length > 0 || invoiceFilter.length > 0 || dateFilter.length > 0;

  // Sync local state with table state
  useEffect(() => {
    const columnFilters = table.getState().columnFilters;
    columnFilters.forEach((filter) => {
      if (filter.id === "Lanid") setLanidFilter(filter.value as string);
      if (filter.id === "Invoice") setInvoiceFilter(filter.value as string);
      if (filter.id === "Date") setDateFilter(filter.value as string);
    });
  }, [table]);

  const handleFilterChange = (columnId: string, value: string) => {
    table.getColumn(columnId)?.setFilterValue(value);

    // Update the corresponding local state
    if (columnId === "Lanid") setLanidFilter(value);
    if (columnId === "Invoice") setInvoiceFilter(value);
    if (columnId === "Date") setDateFilter(value);

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
          placeholder="Filter By Sales Rep ID..."
          value={lanidFilter}
          onChange={(event) => handleFilterChange("Lanid", event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Invoice..."
          value={invoiceFilter}
          onChange={(event) =>
            handleFilterChange("Invoice", event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Date..."
          value={dateFilter}
          onChange={(event) => handleFilterChange("Date", event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setLanidFilter("");
              setInvoiceFilter("");
              setDateFilter("");
              onFilterChange([]);
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="p-4">Total DROS: {totalDROS}</div>
    </div>
  );
}
