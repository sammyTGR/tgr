import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Add this to the beginning of your handler function
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  try {
    const { pageIndex, pageSize, filters } = req.body;

    let query = supabase
      .from('sales_data')
      .select('*', { count: 'exact' })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    if (filters && filters.length > 0) {
      filters.forEach((filter: { column: string, value: string }) => {
        query = query.ilike(filter.column, `%${filter.value}%`);
      });
    }

    const { data, count, error } = await query;

    if (error) throw error;

    res.status(200).json({ data, count });
  } catch (error) {
    console.error('Error fetching filtered sales data:', error);
    res.status(500).json({ error: 'Failed to fetch filtered sales data' });
  }
};
