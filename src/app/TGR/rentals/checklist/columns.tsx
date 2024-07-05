// src/app/TGR/rentals/checklist/columns.tsx

import { ColumnDef } from "@tanstack/react-table";

export interface FirearmsMaintenanceData {
  id: number;
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string;
  gunsmith_notes: string;
  status: string;
  assigned_to: string;
  checked: boolean; // New field to indicate if the firearm has been checked
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
    accessorKey: "gunsmith_notes",
    header: "Gunsmith Notes",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "checked",
    header: "Checked",
    cell: ({ row }) => (row.original.checked ? "Yes" : "No"),
  },
];
export type { ColumnDef };