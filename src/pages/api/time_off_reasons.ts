import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { corsHeaders } from '@/utils/cors';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('time_off_reasons')
                .select('*');

            if (error) {
                throw error;
            }

            res.status(200).json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
