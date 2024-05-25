// pages/api/getUserRole.ts for getting user role used in time off review
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email parameter is required' });
    }

    const { data, error } = await supabase
        .from('employees')
        .select('role')
        .ilike('contact_info', email.toString().toLowerCase())
        .single();

    if (error) {
        console.error('Error fetching user role:', error);
        return res.status(500).json({ error: error.message });
    }

    if (!data) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ role: data.role });
}
