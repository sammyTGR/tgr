import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
