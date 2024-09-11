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

    if (!startDate || !endDate) {
      throw new Error('Start date or end date is missing');
    }

    console.log("API received dates:", { startDate, endDate });
    
    // Add one day to endDate to make it inclusive
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
    
    const { data, error, count } = await supabase
      .from('sales_data')
      .select('*', { count: 'exact' })
      .gte('Date', startDate)
      .lt('Date', adjustedEndDate.toISOString().split('T')[0]);

    if (error) {
      throw error;
    }
    
    console.log("Fetched data count:", count);
    console.log("Date range:", { startDate, endDate: adjustedEndDate.toISOString().split('T')[0] });
    res.status(200).json({ data, count });
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

export default fetchSalesData;