import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  try {
    const batchSize = 1000;
    let offset = 0;
    let totalDROS = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const { data, error } = await supabase
        .from('sales_data')
        .select('SoldQty, subcategory_label')
        .range(offset, offset + batchSize - 1);

      if (error) throw error;

      if (data.length === 0) {
        hasMoreData = false;
        break;
      }

      const batchTotal = data.reduce((total, row) => {
        if (row.subcategory_label) {
          return total + (row.SoldQty || 0) * (parseFloat(row.subcategory_label) || 0);
        }
        return total;
      }, 0);

      totalDROS += batchTotal;
      offset += batchSize;
    }

    res.status(200).json({ totalDROS });
  } catch (error) {
    console.error('Error calculating total DROS:', error);
    res.status(500).json({ error: 'Failed to calculate total DROS' });
  }
};
