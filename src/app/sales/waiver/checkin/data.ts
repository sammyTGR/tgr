// src/app/sales/waiver/checkin/data.ts
import { supabase } from '@/utils/supabase/client';
import { Waiver } from './types';

export const fetchWaiverData = async (): Promise<Waiver[]> => {
  const { data, error } = await supabase.from('waiver').select('*');
  if (error) {
    console.error('Error fetching waiver data:', error);
    return [];
  }
  return data as Waiver[];
};
