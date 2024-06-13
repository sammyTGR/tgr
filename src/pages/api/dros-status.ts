import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('pointslist')
      .select('dros_status')
      .neq('dros_status', null)
      .order('dros_status', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const distinctDrosStatus = Array.from(new Set(data.map(item => item.dros_status)));
    
    res.status(200).json(distinctDrosStatus);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
