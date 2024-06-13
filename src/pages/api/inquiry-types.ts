// pages/api/inquiry-types.ts for use in special order form
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/utils/cors';
import { supabase } from '@/utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
}

res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('orderlist')
      .select('inquiry_type')
      .neq('inquiry_type', null)
      .order('inquiry_type', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Filter out distinct inquiry types
    const distinctInquiryTypes = Array.from(new Set(data.map(item => item.inquiry_type)));

    res.status(200).json(distinctInquiryTypes);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
