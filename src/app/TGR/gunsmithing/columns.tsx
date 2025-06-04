import { ColumnDef } from '@tanstack/react-table';

export interface FirearmsMaintenanceData {
  id: number;
  firearm_type: string;
  firearm_name: string;
  last_maintenance_date: string;
  maintenance_frequency: number;
  maintenance_notes: string;
  status: string;
  assigned_to: string;
  rental_notes: string | null;
  verified_status: string | null;
}

export const columns: ColumnDef<FirearmsMaintenanceData>[] = [
  {
    accessorKey: 'firearm_name',
    header: 'Firearm Name',
  },
  {
    accessorKey: 'last_maintenance_date',
    header: 'Last Maintenance Date',
  },
  {
    accessorKey: 'maintenance_frequency',
    header: 'Maintenance Frequency',
    id: 'maintenance_frequency',
  },
  {
    accessorKey: 'maintenance_notes',
    header: 'Maintenance Notes',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];

export const maintenanceFrequencies = [
  { label: 'Weekly', value: 7 },
  { label: 'Bi-weekly', value: 14 },
  { label: 'Monthly', value: 30 },
  { label: 'Every other month', value: 60 },
  { label: 'Every quarter', value: 90 },
];

export type { ColumnDef };
