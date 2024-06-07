// src/pages/api/generate_all_schedules.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { corsHeaders } from '@/utils/cors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    try {
        const { weeks } = req.body;

        if (!weeks || typeof weeks !== 'number') {
            console.error('Invalid weeks parameter:', weeks);
            return res.status(400).json({ error: 'Invalid weeks parameter' });
        }

        console.log("Calling RPC function with weeks:", weeks);

        // Call the RPC function in Supabase
        const { data, error } = await supabase.rpc('generate_schedules_for_all_employees', { weeks });

        if (error) {
            console.error("Error generating schedules:", error.message);
            return res.status(500).json({ error: error.message });
        }

        console.log("RPC response data:", data);

        res.status(200).json({ message: 'Schedules generated successfully', data });
    } catch (error: any) {
        console.error("Unhandled error:", error.message);
        res.status(500).json({ error: error.message });
    }
}
