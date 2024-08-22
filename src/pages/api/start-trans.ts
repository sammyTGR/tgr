import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add this to the beginning of your handler function
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('pointslist')
      .select('start_trans')
      .neq('start_trans', null)
      .order('start_trans', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const distinctStartTrans = Array.from(new Set(data.map(item => item.start_trans)));
    
    res.status(200).json(distinctStartTrans);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
