import React from "react";

interface DataTableProps {
  columns: { Header: string; accessor: string }[];
  data: any[];
}

const DataTableProfile: React.FC<DataTableProps> = ({ columns, data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full ">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.accessor} className="px-4 py-2 ">
                {column.Header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column.accessor} className="px-4 py-2 ">
                  {row[column.accessor]}
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
