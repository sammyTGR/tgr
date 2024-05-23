// pages/api/createEmployee.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function createEmployeeInSupabase(userId: string, email: string, role: string) {
  const { data, error } = await supabase
    .from('employees')
    .insert({ clerk_user_id: userId, email, role });

  if (error) {
    console.error('Error creating employee in Supabase:', error);
    throw new Error('Failed to create employee');
  } else {
    console.log('Employee created in Supabase:', data);
    return data;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, email, role } = req.body;

    try {
      const data = await createEmployeeInSupabase(userId, email, role);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create employee' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
