"use client";

import { useState, useEffect } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmployeeTableToolbarProps<TData> {
  table: Table<TData>;
}

export function EmployeeTableToolbar<TData>({
  table,
}: EmployeeTableToolbarProps<TData>) {
  const [nameFilter, setNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Check if any filter is applied
  const isFiltered =
    nameFilter.length > 0 ||
    departmentFilter.length > 0 ||
    roleFilter.length > 0;

  // Sync local state with table state
  useEffect(() => {
    const columnFilters = table.getState().columnFilters;
    columnFilters.forEach((filter) => {
      if (filter.id === "name") setNameFilter(filter.value as string);
      if (filter.id === "department") setDepartmentFilter(filter.value as string);
      if (filter.id === "role") setRoleFilter(filter.value as string);
    });
  }, [table]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 p-1">
        <Input
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={(event) => {
            setNameFilter(event.target.value);
            table.getColumn("name")?.setFilterValue(event.target.value);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter by department..."
          value={departmentFilter}
          onChange={(event) => {
            setDepartmentFilter(event.target.value);
            table.getColumn("department")?.setFilterValue(event.target.value);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Input
          placeholder="Filter by role..."
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            table.getColumn("role")?.setFilterValue(event.target.value);
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setNameFilter("");
              setDepartmentFilter("");
              setRoleFilter("");
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