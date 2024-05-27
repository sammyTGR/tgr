// pages/api/customer-types.ts for use in special order form
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('orderlist')
      .select('customer_type')
      .neq('customer_type', null)
      .order('customer_type', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Filter out distinct customer types
    const distinctCustomerTypes = Array.from(new Set(data.map(item => item.customer_type)));
    
    res.status(200).json(distinctCustomerTypes);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
