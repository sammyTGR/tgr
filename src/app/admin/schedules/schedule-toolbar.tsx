"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ScheduleToolbarProps<TData> {
  table: Table<TData>;
}

export function ScheduleToolbar<TData>({ table }: ScheduleToolbarProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");

  return (
    <div className="flex items-center justify-between pb-4">
      <Input
        placeholder="Search schedules..."
        value={table.getColumn("employee_name")?.getFilterValue() as string}
        onChange={(e) => {
          table.getColumn("employee_name")?.setFilterValue(e.target.value);
        }}
        className="max-w-sm"
      />
      <Button onClick={() => {
        table.setGlobalFilter("");
        setGlobalFilter("");
      }}>Reset Filter</Button>
    </div>
  );
}
