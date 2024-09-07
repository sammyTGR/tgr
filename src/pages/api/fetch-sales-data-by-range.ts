// src/pages/api/fetch-sales-data-by-range.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

const fetchSalesDataByRange = async (req: NextApiRequest, res: NextApiResponse) => {
  // Add this to the beginning of your handler function
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  try {
    const { start, end } = req.query;

    console.log(`Fetching sales data from ${start} to ${end}`);
    if (typeof start !== 'string' || typeof end !== 'string') {
      throw new Error('Invalid date parameters');
    }

    let query = supabase
    .from('sales_data')
    .select('*');

  if (start) {
    query = query.gte('Date', start);
  }
  if (end) {
    query = query.lte('Date', end);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching data from Supabase:", error);
    throw error;
  }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in fetchSalesDataByRange API:", error);
    res.status(500).json({ error: 'Failed to fetch sales data by date range' });
  }
};

export default fetchSalesDataByRange;
