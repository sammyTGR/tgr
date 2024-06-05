// src/app/admin/reports/sales/data-table.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

const DataTable = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('your_table_name').select('*');
      if (error) {
        console.error('Error fetching data:', error);
      } else {
        setData(data);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Data Table</h1>
      <table>
        <thead>
          <tr>
            <th>Category Number</th>
            <th>Category Label</th>
            <th>Subcategory Number</th>
            <th>Subcategory Label</th>
            {/* Add more columns as needed */}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row['Category Number']}</td>
              <td>{row['Category Label']}</td>
              <td>{row['Subcategory Number']}</td>
              <td>{row['Subcategory Label']}</td>
              {/* Add more cells as needed */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
