import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { corsHeaders } from '@/utils/cors';
import { supabase } from '@/utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    if (req.method === 'POST') {
        const { request_id, action, use_sick_time } = req.body;

        if (!request_id || typeof action !== 'string') {
            return res.status(400).json({ error: 'Invalid request' });
        }

        try {
            // Update the status of the time off request
            const { data: timeOffData, error: timeOffError } = await supabase
                .from('time_off_requests')
                .update({ status: action, use_sick_time })
                .eq('request_id', request_id)
                .select('employee_id, start_date, end_date, email')
                .single();

            if (timeOffError) {
                console.error("Error updating request status:", timeOffError);
                return res.status(500).json({ error: timeOffError.message });
            }

            if (use_sick_time) {
                const { error: sickTimeError } = await supabase
                    .rpc("deduct_sick_time", { p_emp_id: timeOffData.employee_id, p_start_date: timeOffData.start_date, p_end_date: timeOffData.end_date });

                if (sickTimeError) {
                    console.error("Error deducting sick time:", sickTimeError);
                    return res.status(500).json({ error: sickTimeError.message });
                }
            }

            if (!timeOffData.email) {
                console.error("Email not found in the time off request:", timeOffData);
                return res.status(400).json({ error: "Email not found in the time off request" });
            }

            return res.status(200).json(timeOffData);
        } catch (err) {
            console.error("Unexpected error updating request status:", err);
            return res.status(500).json({ error: 'Unexpected error updating request status' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
