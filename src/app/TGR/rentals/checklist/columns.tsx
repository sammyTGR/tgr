import { ColumnDef } from '@tanstack/react-table';

// Ensure FirearmsMaintenanceData is properly defined
export interface FirearmsMaintenanceData {
  id: number;
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string | null;
  maintenance_frequency: number | null;
  maintenance_notes: string | null;
  status: string | null;
  assigned_to: string | null; // UUID is represented as a string in TypeScript
  rental_notes: string | null; // Add this line to match the Supabase table
  verified_status: string | null;
  morning_checked?: boolean; // Keep these if you're still using them in your component
  evening_checked?: boolean;
  notes?: string; // This might be redundant with rental_notes, consider removing if not used
  highlight?: string;
}

// Define columns with the correct order
export const columns: ColumnDef<FirearmsMaintenanceData>[] = [
  {
    accessorKey: 'firearm_name',
    header: 'Firearm Name',
  },
  {
    accessorKey: 'maintenance_notes',
    header: 'Gunsmithing Notes',
    cell: ({ row }) => <span>{row.original.maintenance_notes}</span>,
  },
  {
    accessorKey: 'notes',
    header: 'Checklist Notes',
    cell: ({ row }) => <span>{row.original.notes}</span>,
  },
  // {
  //   accessorKey: "morning_checked",
  //   header: "Morning Checked",
  //   cell: ({ row }) => {
  //     const notes = row.original.notes;
  //     return notes === "With Gunsmith" ? (
  //       <span></span>
  //     ) : (
  //       <span>{row.original.morning_checked ? "" : ""}</span>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "evening_checked",
  //   header: "Evening Checked",
  //   cell: ({ row }) => {
  //     const notes = row.original.notes;
  //     return notes === "With Gunsmith" ? (
  //       <span></span>
  //     ) : (
  //       <span>{row.original.evening_checked ? "" : ""}</span>
  //     );
  //   },
  // },
  // Other columns as needed...
];

export type { ColumnDef };
