import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('time_off_requests')
                .select('*');

            if (error) {
                console.error("Error fetching time off requests:", error.message);
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json(data);
        } catch (err) {
            console.error("Unexpected error fetching time off requests:", err);
            return res.status(500).json({ error: 'Unexpected error fetching time off requests' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
