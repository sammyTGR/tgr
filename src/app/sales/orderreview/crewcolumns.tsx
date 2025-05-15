'use client';
import { ColumnDef as BaseColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../admin/audits/review/data-table-column-header';
import { statuses } from './data';
import { includesArrayString } from './custom-filter'; // Import the custom filter function

export type Order = {
  is_read: any;
  id: number;
  employee: string;
  customer_type: string;
  inquiry_type: string;
  customer_name: string;
  email: string;
  phone: string;
  manufacturer: string;
  item: string;
  details: string;
  contacted: boolean;
  created_at: string;
  status: string; // New status column
};

export type ColumnDef<TData, TValue = unknown> = BaseColumnDef<TData, TValue> & {
  meta?: {
    style?: React.CSSProperties;
  };
};

export const createColumns = (): ColumnDef<Order>[] => [
  {
    accessorKey: 'employee',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted By" />,
    meta: {
      style: { width: '150px' },
    },
  },
  {
    accessorKey: 'customer_name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer Name" />,
    meta: {
      style: { width: '200px' },
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    meta: {
      style: { width: '200px' },
    },
    filterFn: includesArrayString, // Use the custom filter function
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    meta: {
      style: { width: '150px' },
    },
  },
  {
    accessorKey: 'manufacturer',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Manufacturer" />,
    meta: {
      style: { width: '150px' },
    },
  },
  {
    accessorKey: 'item',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Item/Model" />,
    meta: {
      style: { width: '150px' },
    },
  },
  {
    accessorKey: 'details',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Details" />,
    meta: {
      style: { width: '250px' },
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date Submitted" />,
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    meta: {
      style: { width: '150px' },
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = statuses.find((s) => s.value === row.original.status);
      return status ? status.label : '';
    },
    meta: {
      style: { width: '150px' },
    },
  },
  // {
  //   accessorKey: "contacted",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Contacted" />
  //   ),
  //   cell: ({ row }) => (row.original.contacted ? "Yes" : "No"),
  //   meta: {
  //     style: { width: "100px" },
  //   },
  // },
];
