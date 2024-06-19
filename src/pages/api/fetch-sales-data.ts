// src/pages/api/fetch-sales-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

const fetchSalesData = async (req: NextApiRequest, res: NextApiResponse) => {
  const { pageIndex, pageSize, filters, sorting } = req.body;

  try {
    let query = supabase
      .from('sales_data')
      .select('*, total_gross, total_net', { count: 'exact' })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    // Apply filters
    filters.forEach((filter: any) => {
      query = query.ilike(filter.id, `%${filter.value}%`);
    });

    // Apply sorting
    sorting.forEach((sort: any) => {
      query = query.order(sort.id, { ascending: !sort.desc });
    });

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json({ data, count });
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

export default fetchSalesData;
