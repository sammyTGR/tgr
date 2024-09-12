// src/pages/api/fetch-sales-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { format } from 'date-fns';
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

    if (!startDate || !endDate) {
      throw new Error('Start date or end date is missing');
    }

    console.log("API received dates:", { startDate, endDate });
    
    // Convert to Date objects and adjust for UTC
    const utcStartDate = new Date(startDate);
    const utcEndDate = new Date(endDate);
    utcEndDate.setUTCHours(23, 59, 59, 999);
    
    const formattedStartDate = format(utcStartDate, 'yyyy-MM-dd');
    const formattedEndDate = format(utcEndDate, 'yyyy-MM-dd');

    console.log("Formatted date range:", { formattedStartDate, formattedEndDate });

    const { data, error, count } = await supabase
      .from('sales_data')
      .select('*', { count: 'exact' })
      .gte('Date', formattedStartDate)
      .lte('Date', formattedEndDate);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log("Fetched data count:", count);
    res.status(200).json({ data, count });
  } catch (error: any) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data', details: error.message });
  }
};

export default fetchSalesData;