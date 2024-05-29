// pages/api/approve_request.ts used in time off review
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { request_id, action } = req.body;

        if (!request_id || typeof action !== 'string') {
            return res.status(400).json({ error: 'Invalid request' });
        }

        try {
            // Update the status of the time off request
            const { data: timeOffData, error: timeOffError } = await supabase
                .from('time_off_requests')
                .update({ status: action })
                .eq('request_id', request_id)
                .select()
                .single();

            if (timeOffError) {
                console.error("Error updating request status:", timeOffError);
                return res.status(500).json({ error: timeOffError.message });
            }

            // Update the schedules table with the custom approval text
            const { employee_id, start_date, end_date } = timeOffData;

            // Generate dates between start_date and end_date
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const dates = [];
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d));
            }

            for (const date of dates) {
                const formattedDate = date.toISOString().split('T')[0]; // Format date as 'YYYY-MM-DD'
                const { error: scheduleError } = await supabase
                    .from('schedules')
                    .update({ status: action })
                    .eq('employee_id', employee_id)
                    .eq('schedule_date', formattedDate);

                if (scheduleError) {
                    console.error(`Error updating schedule for date ${formattedDate}:`, scheduleError);
                    return res.status(500).json({ error: scheduleError.message });
                }
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
