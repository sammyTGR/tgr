import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { request_id, action } = req.body;

        if (!request_id || !['approved', 'denied'].includes(action)) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        try {
            const { data, error } = await supabase
                .from('time_off_requests')
                .update({ status: action })
                .eq('id', request_id);

            if (error) {
                console.error("Error updating request status:", error);
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json(data);
        } catch (err) {
            console.error("Unexpected error updating request status:", err);
            return res.status(500).json({ error: 'Unexpected error updating request status' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
