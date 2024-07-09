import { ColumnDef } from "@tanstack/react-table";

// Ensure FirearmsMaintenanceData is properly defined
export interface FirearmsMaintenanceData {
  id: number;
  firearm_type: string;
  firearm_name: string;
  morning_checked: boolean;
  evening_checked: boolean;
  notes: string;
  maintenance_notes: string; // Include maintenance_notes
}

// Add the Gunsmithing Notes column
export const columns: ColumnDef<FirearmsMaintenanceData>[] = [
  {
    accessorKey: "firearm_name",
    header: "Firearm Name",
  },
  {
    accessorKey: "maintenance_notes",
    header: "Gunsmithing Notes",
    cell: ({ row }) => <span>{row.original.maintenance_notes}</span>,
  },
  {
    accessorKey: "morning_checked",
    header: "Morning Checked",
    cell: ({ row }) => (
      <span>{row.original.morning_checked ? "Yes" : "No"}</span>
    ),
  },
  {
    accessorKey: "evening_checked",
    header: "Evening Checked",
    cell: ({ row }) => (
      <span>{row.original.evening_checked ? "Yes" : "No"}</span>
    ),
  },
  // Other columns as needed...
];

export type { ColumnDef };
