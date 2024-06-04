// page/api/assignRole.ts used for assigning roles for customers
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, role } = req.body;

    try {
      const { data, error } = await supabase
        .from('public_customers')
        .insert([{ email, role }]);

      if (error) throw error;

      res.status(200).json({ message: 'Role assigned successfully' });
    } catch (error: any) {
      console.error('Error assigning role:', error.message);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
