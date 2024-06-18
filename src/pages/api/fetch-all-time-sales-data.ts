// src/pages/api/fetch-all-time-sales-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

const fetchAllTimeSalesData = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { data, error } = await supabase
      .from('sales_data')
      .select('Lanid, category_label, SoldPrice, SoldQty, Date'); // Include Date field

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all-time sales data' });
  }
};

export default fetchAllTimeSalesData;
