import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { pageIndex, pageSize, filters, sorting } = req.body;

    let query = supabase
      .from('sales_data')
      .select('*', { count: 'exact' });

    if (filters && filters.length > 0) {
      filters.forEach((filter: { id: string, value: string }) => {
        query = query.ilike(filter.id, `%${filter.value}%`);
      });
    }

    if (sorting && sorting.length > 0) {
      sorting.forEach((sort: { id: string; desc: boolean }) => {
        query = query.order(sort.id, { ascending: !sort.desc });
      });
    } else {
      query = query.order('Date', { ascending: false });  // Ensure data is sorted by Date
    }

    const { data, count, error } = await query.range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    if (error) throw error;

    res.status(200).json({ data, count });
  } catch (error) {
    console.error('Error fetching filtered sales data:', error);
    res.status(500).json({ error: 'Failed to fetch filtered sales data' });
  }
};
