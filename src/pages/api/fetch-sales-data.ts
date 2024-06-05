import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { data, error } = await supabase.from('sales_data').select('*');
    if (error) throw error;

    console.log("Fetched data:", data); // Add this line to log the fetched data

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};
