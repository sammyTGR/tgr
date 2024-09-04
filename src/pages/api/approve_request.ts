import { supabase } from '@/utils/supabase/client';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    if (req.method === 'POST') {
        const { request_id, action, use_sick_time, use_vacation_time } = req.body;

        console.log('Processing request:', { request_id, action, use_sick_time, use_vacation_time });

        if (!request_id || typeof action !== 'string') {
            return res.status(400).json({ error: 'Invalid request' });
        }

        if (use_sick_time && use_vacation_time) {
            return res.status(400).json({ error: 'Cannot use both sick time and vacation time for the same request' });
        }

        try {
            // Update the status of the time off request
            const { data: timeOffData, error: timeOffError } = await supabase
                .from('time_off_requests')
                .update({ status: action, use_sick_time, use_vacation_time })
                .eq('request_id', request_id)
                .select('employee_id, start_date, end_date, email')
                .single();

            if (timeOffError) {
                console.error("Error updating request status:", timeOffError);
                return res.status(500).json({ error: timeOffError.message });
            }

            if (!timeOffData) {
                console.error("No data returned from time off request update");
                return res.status(404).json({ error: "Time off request not found" });
            }

            if (use_sick_time) {
                const { error: sickTimeError } = await supabase
                    .rpc("deduct_sick_time", { 
                        p_emp_id: timeOffData.employee_id, 
                        p_start_date: timeOffData.start_date, 
                        p_end_date: timeOffData.end_date 
                    });

                if (sickTimeError) {
                    console.error("Error deducting sick time:", sickTimeError);
                    // Revert the time off request update
                    await supabase
                        .from('time_off_requests')
                        .update({ status: 'pending', use_sick_time: false })
                        .eq('request_id', request_id);
                    return res.status(500).json({ error: sickTimeError.message });
                }
            }

            if (use_vacation_time) {
                const { error: vacationTimeError } = await supabase
                    .rpc("deduct_vacation_time", { 
                        p_emp_id: timeOffData.employee_id, 
                        p_start_date: timeOffData.start_date, 
                        p_end_date: timeOffData.end_date 
                    });

                if (vacationTimeError) {
                    console.error("Error deducting vacation time:", vacationTimeError);
                    // Revert the time off request update
                    await supabase
                        .from('time_off_requests')
                        .update({ status: 'pending', use_vacation_time: false })
                        .eq('request_id', request_id);
                    return res.status(500).json({ error: vacationTimeError.message });
                }
            }

            if (!timeOffData.email) {
                console.error("Email not found in the time off request:", timeOffData);
                return res.status(400).json({ error: "Email not found in the time off request" });
            }

            console.log('Request processed successfully:', timeOffData);
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