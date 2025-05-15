import React from 'react';

interface ColumnDef {
  Header: string;
  accessor: string;
  Cell?: (props: { value: any; row: { original: any } }) => JSX.Element;
}

interface DataTableProps {
  columns: ColumnDef[];
  data: any[];
  rowClassName?: (row: { original: { isDivider?: boolean } }) => string;
}

const DataTableProfile: React.FC<DataTableProps> = ({ columns, data, rowClassName = () => '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.accessor} className="px-4 py-2">
                {column.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowClassName({ original: row })}>
              {columns.map((column) => (
                <td key={column.accessor} className="px-4 py-2">
                  {column.Cell
                    ? column.Cell({
                        value: row[column.accessor],
                        row: { original: row },
                      })
                    : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { DataTableProfile };
