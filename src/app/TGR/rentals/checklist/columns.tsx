// src/app/TGR/rentals/checklist/columns.tsx
import { ColumnDef } from "@tanstack/react-table";

export interface FirearmsMaintenanceData {
  id: number;
  firearm_name: string;
  morning_checked: boolean;
  evening_checked: boolean;
  notes: string;
}

export const columns: ColumnDef<FirearmsMaintenanceData>[] = [
  {
    accessorKey: "firearm_name",
    header: "Firearm Name",
  },
  {
    accessorKey: "morning_checked",
    header: "Morning Checked",
    cell: ({ row }) => (row.original.morning_checked ? "Yes" : ""),
  },
  {
    accessorKey: "evening_checked",
    header: "Evening Checked",
    cell: ({ row }) => (row.original.evening_checked ? "Yes" : ""),
  },
  {
    accessorKey: "notes",
    header: "Checklist Notes",
    cell: ({ row }) => row.original.notes,
  },
];

export type { ColumnDef };
