// src/pages/api/fetch-sales-data-by-employee.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { data, error } = await supabase
      .from('sales_data')
      .select('Lanid, category_label, SoldPrice, SoldQty, Date'); // Include Date field

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data) {
      console.error("No data fetched from Supabase");
    } else {
      console.log("Fetched data:", data.length, "records"); // Log data length for verification
      console.log("Fetched data sample:", data.slice(0, 5)); // Log a sample of the data
    }
    
    type AggregatedData = {
      [key: string]: {
        Lanid: string;
        category_label: string;
        total_sales: number;
        Date: string;
      };
    };

    const aggregatedData = data.reduce<AggregatedData>((acc, row) => {
      const { Lanid, category_label, SoldPrice, SoldQty, Date } = row;
      const key = `${Lanid}-${category_label}`;
      if (!acc[key]) {
        acc[key] = { Lanid, category_label, total_sales: 0, Date };
      }
      acc[key].total_sales += SoldPrice * SoldQty;
      return acc;
    }, {});

    const responseData = Object.values(aggregatedData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ error: 'Failed to fetch sales data by employee' });
  }
};
