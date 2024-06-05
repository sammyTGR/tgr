"use client";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface SalesTableToolbarProps<TData> {
  table: Table<TData>;
  totalDROS: number;
}

export function SalesTableToolbar<TData>({
  table,
  totalDROS,
}: SalesTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 p-1">
        <Input
          placeholder="Filter By Sales Rep ID..."
          value={(table.getColumn("Lanid")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("Lanid")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Invoice..."
          value={(table.getColumn("Invoice")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("Invoice")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter By Date..."
          value={(table.getColumn("Date")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("Date")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
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
      <div className="p-4">Total DROS: {totalDROS}</div>
      {/* <DataTableViewOptions table={table} /> */}
    </div>
  );
}
