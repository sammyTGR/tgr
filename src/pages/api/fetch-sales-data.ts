// src/pages/api/fetch-sales-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  try {
    const { pageIndex, pageSize, filters, sorting } = req.body;

    console.log('Request body:', req.body);

    const { data, error } = await supabase
      .rpc('fetch_sales_data', {
        page_index: pageIndex,
        page_size: pageSize,
        filters: JSON.stringify(filters),
        sorting: JSON.stringify(sorting)
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      res.status(500).json({ error: 'Failed to fetch filtered sales data' });
      return;
    }

    const count = data.length > 0 ? data[0].total_count : 0;

    console.log('Fetched data:', data);

    res.status(200).json({ data, count });
  } catch (error) {
    console.error('Error fetching filtered sales data:', error);
    res.status(500).json({ error: 'Failed to fetch filtered sales data' });
  }
};
