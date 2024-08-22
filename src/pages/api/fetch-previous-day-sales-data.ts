// src/pages/api/fetch-previous-day-sales-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

const fetchPreviousDaySalesData = async (req: NextApiRequest, res: NextApiResponse) => {
  // Add this to the beginning of your handler function
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  try {
    const today = new Date();
    const previousDay = new Date(today);
    previousDay.setDate(today.getDate() - 1); // Set to previous day

    const { data, error } = await supabase
      .from('sales_data')
      .select('Lanid, category_label, SoldPrice, SoldQty, Date')
      .gte('Date', previousDay.toISOString().split('T')[0])
      .lte('Date', previousDay.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch previous day sales data' });
  }
};

export default fetchPreviousDaySalesData;
