// src/pages/api/fetch-sales-data-by-employee.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { data, error } = await supabase
      .from('sales_data')
      .select('Lanid, category_label, SoldPrice, SoldQty');

    if (error) {
      throw error;
    }

    type AggregatedData = {
      [key: string]: {
        Lanid: string;
        category_label: string;
        total_sales: number;
      };
    };

    const aggregatedData = data.reduce<AggregatedData>((acc, row) => {
      const { Lanid, category_label, SoldPrice, SoldQty } = row;
      const key = `${Lanid}-${category_label}`;
      if (!acc[key]) {
        acc[key] = { Lanid, category_label, total_sales: 0 };
      }
      acc[key].total_sales += SoldPrice * SoldQty;
      return acc;
    }, {});

    const responseData = Object.values(aggregatedData);
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales data by employee' });
  }
};
