// src/pages/api/generate_all_schedules.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    try {
        const { weeks } = req.body;

        if (!weeks || typeof weeks !== 'number') {
            return res.status(400).json({ error: 'Invalid weeks parameter' });
        }

        // Call the RPC function in Supabase
        const { data, error } = await supabase.rpc('generate_schedules_for_all_employees', { weeks });

        if (error) {
            console.error("Error generating schedules:", error);
            return res.status(500).json({ error: error.message });
        }

        if (data) {
            console.log("RPC response data:", data);
        }

        res.status(200).json({ message: 'Schedules generated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
