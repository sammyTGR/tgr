// src/pages/api/fetch-sales-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

const fetchSalesData = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  try {
    const { startDate, endDate } = req.body;
    console.log("API received dates:", { startDate, endDate });

    const { data, error, count } = await supabase
      .from('sales_data')
      .select('*')
      .gte('Date', startDate)
      .lte('Date', endDate);


    if (error) {
      throw error;
    }

    console.log("Fetched data count:", count);
    res.status(200).json({ data, count });
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

export default fetchSalesData;