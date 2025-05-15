// src/app/TGR/certifications/columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO, isValid } from 'date-fns';
import { CertificationData } from './types';
import { DataTableColumnHeader } from './data-table-column-header';
import CertificationTableRowActions from './certification-table-row-actions';
import { includesArrayString } from './custom-filter';

const calculateStatus = (expiration: string) => {
  const expirationDate = parseISO(expiration);
  const today = new Date();
  const timeDiff = expirationDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return daysDiff <= 60 ? 'Start Renewal Process' : '';
};

export const certificationColumns = (
  onUpdate: (id: string, updates: Partial<CertificationData>) => void
): ColumnDef<CertificationData>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: {
      style: { width: '50px' },
    },
  },
  {
    accessorKey: 'certificate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Certificate" />,
    meta: {
      style: { width: '50px' },
    },
  },
  {
    accessorKey: 'number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Number" />,
    meta: {
      style: { width: '90px' },
    },
  },
  {
    accessorKey: 'expiration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expiration" />,
    cell: ({ row }) => {
      const date = parseISO(row.original.expiration);
      return isValid(date) ? format(date, 'MM-dd-yyyy') : 'Invalid Date';
    },
    meta: {
      style: { width: '120px' },
    },
    sortingFn: 'datetime',
    filterFn: (row, columnId, filterValue) => {
      const formattedDate = format(new Date(row.getValue(columnId)), 'yyyy-MM-dd');
      return formattedDate.includes(filterValue);
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => calculateStatus(row.original.expiration),
    meta: {
      style: { width: '100px' },
    },
    filterFn: includesArrayString,
  },
  {
    accessorKey: 'action_status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action Status" />,
    meta: {
      style: { width: '100px' },
    },
    filterFn: includesArrayString,
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <CertificationTableRowActions certification={row.original} onUpdate={onUpdate} />
    ),
    meta: {
      style: { width: '50px' },
    },
  },
];
