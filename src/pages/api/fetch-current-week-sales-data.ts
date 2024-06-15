// src/pages/api/fetch-current-week-sales-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

const fetchCurrentWeekSalesData = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Start on Sunday
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // End on Saturday

    const { data, error } = await supabase
      .from('sales_data')
      .select('Lanid, category_label, SoldPrice, SoldQty, Date')
      .gte('Date', startOfWeek.toISOString().split('T')[0])
      .lte('Date', endOfWeek.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current week sales data' });
  }
};

export default fetchCurrentWeekSalesData;
