// src/pages/api/fetch-sales-data-aggregated.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const { data, error } = await supabase
      .rpc('fetch_aggregated_sales_data');

    if (error) throw error;

    console.log('Fetched Aggregated Data:', data);

    const result = data.map((row: { category_label: string, total_sales: number }) => ({
      name: row.category_label || 'Unknown',
      value: row.total_sales,
    }));

    console.log('Aggregated Result:', result);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching aggregated sales data:', error);
    res.status(500).json({ error: 'Failed to fetch aggregated sales data' });
  }
};
