// pages/api/mark_duplicate.ts used in time off review
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
        const { request_id } = req.body;

        if (!request_id) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        try {
            // Update the time off request to mark as duplicate and set is_read to true
            const { error } = await supabase
                .from('time_off_requests')
                .update({ is_read: true, status: 'duplicate' }) // Assuming you want to mark status as 'duplicate'
                .eq('request_id', request_id);

            if (error) {
                console.error("Error marking request as duplicate:", error);
                return res.status(500).json({ error: error.message });
            }

            res.status(200).json({ message: 'Request marked as duplicate' });
        } catch (err: any) {
            console.error("Unexpected error marking request as duplicate:", err);
            return res.status(500).json({ error: 'Unexpected error marking request as duplicate', details: err.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
