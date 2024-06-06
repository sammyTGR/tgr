import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
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
