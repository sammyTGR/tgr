// src/pages/api/fetch-sales-data-by-range.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

const fetchSalesDataByRange = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { start, end } = req.query;

    console.log(`Fetching sales data from ${start} to ${end}`);

    const { data, error } = await supabase
      .from('sales_data')
      .select('Lanid, category_label, SoldPrice, SoldQty, Cost, Date')
      .gte('Date', start)
      .lte('Date', end);

    if (error) {
      console.error("Error fetching data from Supabase:", error);
      throw error;
    }

    console.log("Fetched data:", data);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in fetchSalesDataByRange API:", error);
    res.status(500).json({ error: 'Failed to fetch sales data by date range' });
  }
};

export default fetchSalesDataByRange;
