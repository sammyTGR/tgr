// src/app/admin/audits/contest/data-table-profile.tsx

import React from "react";

export interface ColumnDef<T = any> {
  Header: string;
  accessor: keyof T | string;
  Cell?: (props: { value: any; row: { original: T } }) => JSX.Element;
}

export interface DataTableProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  rowClassName?: (row: { original: T }) => string;
}

export const DataTableProfile = <T extends object>({
  columns,
  data,
  rowClassName = () => "",
}: DataTableProps<T>) => {
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

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
            <tr key={rowIndex} className={rowClassName({ original: row })}>
              {columns.map((column) => (
                <td key={column.accessor as string} className="px-4 py-2">
                  {column.Cell
                    ? column.Cell({
                        value: row[column.accessor as keyof T],
                        row: { original: row },
                      })
                    : formatCellValue(row[column.accessor as keyof T])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
