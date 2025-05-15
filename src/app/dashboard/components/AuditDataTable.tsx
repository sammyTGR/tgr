// components/AuditDataTable.tsx
import React from 'react';
import { Table, TableBody, TableRow, TableCell, TableHeader } from '@/components/ui/table';
import { AuditData } from '../../admin/audits/review/columns'; // adjust the path as needed

interface AuditDataTableProps {
  data: AuditData[];
}

const AuditDataTable: React.FC<AuditDataTableProps> = ({ data }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell>DROS Number</TableCell>
          <TableCell>Sales Reps</TableCell>
          <TableCell>Audit Type</TableCell>
          <TableCell>Transaction Date</TableCell>
          <TableCell>Audit Date</TableCell>
          <TableCell>Error Location</TableCell>
          <TableCell>Error Details</TableCell>
          <TableCell>Notes</TableCell>
          <TableCell>DROS Cancelled</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.audits_id}>
            <TableCell>{item.dros_number}</TableCell>
            <TableCell>{item.salesreps}</TableCell>
            <TableCell>{item.audit_type}</TableCell>
            <TableCell>{item.trans_date}</TableCell>
            <TableCell>{item.audit_date || 'N/A'}</TableCell>
            <TableCell>{item.error_location}</TableCell>
            <TableCell>{item.error_details}</TableCell>
            <TableCell>{item.error_notes || 'N/A'}</TableCell>
            <TableCell>{item.dros_cancel ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              {/* Example of action: */}
              <button>Edit</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AuditDataTable;
