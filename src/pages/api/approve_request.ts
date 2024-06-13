// pages/api/approve_request.ts used in time off review
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

            // Extract details from the time off request
            const { employee_id, start_date, end_date } = timeOffData;

            // Generate dates between start_date and end_date
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            const dates = [];
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d));
            }

            // Array to map days of the week
            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

            for (const date of dates) {
                const formattedDate = date.toISOString().split('T')[0]; // Format date as 'YYYY-MM-DD'
                const dayOfWeek = daysOfWeek[date.getUTCDay()]; // Get the day of the week as text
                console.log(`Processing date: ${formattedDate} which is a ${dayOfWeek}`);

                // Check if the date exists in the schedules table
                let { data: scheduleData, error: scheduleFetchError } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('employee_id', employee_id)
                    .eq('schedule_date', formattedDate)
                    .single();
            
                if (scheduleFetchError) {
                    console.error(`Error fetching schedule for date ${formattedDate}:`, scheduleFetchError);
                }
            
                if (!scheduleData) {
                    console.log(`Inserting new schedule for date ${formattedDate}`);
                    // Insert new schedule if it doesn't exist
                    const { error: scheduleInsertError } = await supabase
                        .from('schedules')
                        .insert({ employee_id, schedule_date: formattedDate, day_of_week: dayOfWeek, status: action });
            
                    if (scheduleInsertError) {
                        console.error(`Error inserting schedule for date ${formattedDate}:`, scheduleInsertError);
                        return res.status(500).json({ error: scheduleInsertError.message });
                    }
                } else {
                    console.log(`Updating existing schedule for date ${formattedDate}`);
                    // Update existing schedule
                    const { error: scheduleUpdateError } = await supabase
                        .from('schedules')
                        .update({ status: action })
                        .eq('employee_id', employee_id)
                        .eq('schedule_date', formattedDate);
            
                    if (scheduleUpdateError) {
                        console.error(`Error updating schedule for date ${formattedDate}:`, scheduleUpdateError);
                        return res.status(500).json({ error: scheduleUpdateError.message });
                    }
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
