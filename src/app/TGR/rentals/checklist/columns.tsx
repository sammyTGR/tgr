// src/app/TGR/rentals/checklist/columns.tsx
import { ColumnDef } from "@tanstack/react-table";

export interface FirearmsMaintenanceData {
  id: number;
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string;
  maintenance_notes: string;
  checklist_notes: string;
  assigned_to: string;
  morning_checked: boolean;
  evening_checked: boolean;
  notes: string;
}

export interface FirearmVerificationData {
  firearm_id: number;
  verified_by: string;
  verification_date: string;
  verification_time: string;
  serial_verified: boolean;
  condition_verified: boolean;
  magazine_attached: boolean;
  notes: string;
  created_at: string;
}

export const columns: ColumnDef<FirearmsMaintenanceData>[] = [
  {
    accessorKey: "firearm_name",
    header: "Firearm Name",
  },
  {
    accessorKey: "last_maintenance_date",
    header: "Last Maintenance Date",
  },
  {
    accessorKey: "maintenance_notes",
    header: "Gunsmith Notes",
  },
  {
    accessorKey: "notes",
    header: "Checklist Notes",
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
];
export type { ColumnDef };
