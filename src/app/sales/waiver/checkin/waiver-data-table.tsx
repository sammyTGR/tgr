// src/app/sales/waiver/checkin/waiver-data-table.tsx
import { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { waiverColumns, Waiver } from "./columns";
import { fetchWaiverData } from "./data";
import { DataTable } from "./data-table";
import { WaiverTableToolbar } from "./waiver-table-toolbar";

const WaiverDataTable = () => {
  const [waivers, setWaivers] = useState<Waiver[]>([]);

  useEffect(() => {
    fetchWaiverData().then((data: Waiver[]) => setWaivers(data));
  }, []);

  const onStatusChange = (id: string, status: "checked_in" | "checked_out") => {
    setWaivers((currentWaivers) =>
      currentWaivers.map((waiver) =>
        waiver.id === id ? { ...waiver, status } : waiver
      )
    );
  };

  const table = useReactTable({
    data: waivers,
    columns: waiverColumns(onStatusChange),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <WaiverTableToolbar table={table} />
      <DataTable table={table} />
    </div>
  );
};

export default WaiverDataTable;
