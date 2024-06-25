import { ColumnDef } from "@tanstack/react-table";

export interface FirearmsMaintenanceData {
  id: number;
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string;
  maintenance_frequency: number;
  maintenance_notes: string;
  status: string;
  assigned_to: string;
}

export const columns: ColumnDef<FirearmsMaintenanceData>[] = [
  {
    accessorKey: "firearm_type",
    header: "Firearm Type",
  },
  {
    accessorKey: "firearm_name",
    header: "Firearm Name",
  },
  {
    accessorKey: "last_maintenance_date",
    header: "Last Maintenance Date",
  },
  {
    accessorKey: "maintenance_frequency",
    header: "Maintenance Frequency",
  },
  {
    accessorKey: "maintenance_notes",
    header: "Maintenance Notes",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

export type { ColumnDef };
