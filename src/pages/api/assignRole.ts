// src/pages/api/assignRole.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  
  if (req.method === 'POST') {
    const { email, role } = req.body;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('email', email);

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
