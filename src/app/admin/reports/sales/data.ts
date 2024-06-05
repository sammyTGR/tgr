import { supabase } from '@/utils/supabase/client';
import { SalesData } from './types';

export const fetchSalesData = async (): Promise<SalesData[]> => {
  const { data, error } = await supabase.from('sales_data').select('*');
  if (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
  return data as SalesData[];
};
