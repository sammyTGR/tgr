// src/app/admin/audits/contest/data-table.tsx

import React from 'react';

export interface ColumnDef<T = any> {
  Header: string;
  accessor: keyof T | string;
  Cell?: (props: { value: any; row: { original: T } }) => JSX.Element;
}

export interface DataTableProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
}

export const DataTable = <T extends object>({ columns, data }: DataTableProps<T>) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.accessor as string} className="px-4 py-2">
                {column.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column.accessor as string} className="px-4 py-2">
                  {column.Cell
                    ? column.Cell({
                        value: row[column.accessor as keyof T],
                        row: { original: row },
                      })
                    : String(row[column.accessor as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
