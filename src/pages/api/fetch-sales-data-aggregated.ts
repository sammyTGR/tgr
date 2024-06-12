// src/pages/api/fetch-sales-data-aggregated.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

interface SalesDataRow {
  category_label: string;
  SoldPrice: number;
  SoldQty: number;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  try {
    const { data, error } = await supabase
      .from('sales_data')
      .select('category_label, SoldPrice, SoldQty');

    if (error) throw error;

    const aggregatedData: Record<string, number> = data.reduce((acc: Record<string, number>, row: SalesDataRow) => {
      const category = row.category_label || 'Unknown';
      const value = row.SoldPrice * row.SoldQty;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += value;
      return acc;
    }, {});

    const result = Object.keys(aggregatedData).map((key) => ({
      name: key,
      value: aggregatedData[key],
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching aggregated sales data:', error);
    res.status(500).json({ error: 'Failed to fetch aggregated sales data' });
  }
};
