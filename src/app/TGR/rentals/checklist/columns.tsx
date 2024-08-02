import { ColumnDef } from "@tanstack/react-table";

// Ensure FirearmsMaintenanceData is properly defined
export interface FirearmsMaintenanceData {
  id: number;
  firearm_type: string;
  firearm_name: string;
  morning_checked: boolean;
  evening_checked: boolean;
  notes: string; // This field will contain the checklist notes
  maintenance_notes: string; // This field contains the gunsmithing notes
  highlight?: string; // Add this line
}

// Define columns with the correct order
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
    accessorKey: "notes",
    header: "Checklist Notes",
    cell: ({ row }) => <span>{row.original.notes}</span>,
  },
  {
    accessorKey: "morning_checked",
    header: "Morning Checked",
    cell: ({ row }) => {
      const notes = row.original.notes;
      return notes === "With Gunsmith" ? (
        <span></span>
      ) : (
        <span>{row.original.morning_checked ? "Yes" : "No"}</span>
      );
    },
  },
  {
    accessorKey: "evening_checked",
    header: "Evening Checked",
    cell: ({ row }) => {
      const notes = row.original.notes;
      return notes === "With Gunsmith" ? (
        <span></span>
      ) : (
        <span>{row.original.evening_checked ? "Yes" : "No"}</span>
      );
    },
  },
  // Other columns as needed...
];

export type { ColumnDef };
