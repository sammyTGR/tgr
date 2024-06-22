// pages/api/update_schedule_status.ts
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
    const { employee_id, schedule_date, status } = req.body;

    console.log("Received payload:", req.body); // Log the received payload

    if (!employee_id || !schedule_date || typeof status !== 'string') {
      console.error("Invalid request:", { employee_id, schedule_date, status });
      return res.status(400).json({ error: 'Invalid request' });
    }

    try {
      // Check if the date exists in the schedules table
      const { data: scheduleData, error: scheduleFetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('schedule_date', schedule_date)
        .single();

      if (scheduleFetchError) {
        console.error(`Error fetching schedule for date ${schedule_date}:`, scheduleFetchError);
        return res.status(500).json({ error: scheduleFetchError.message });
      }

      if (!scheduleData) {
        console.log(`Inserting new schedule for date ${schedule_date}`);
        // Insert new schedule if it doesn't exist
        const { error: scheduleInsertError } = await supabase
          .from('schedules')
          .insert({ employee_id, schedule_date, status });

        if (scheduleInsertError) {
          console.error(`Error inserting schedule for date ${schedule_date}:`, scheduleInsertError);
          return res.status(500).json({ error: scheduleInsertError.message });
        }
      } else {
        console.log(`Updating existing schedule for date ${schedule_date}`);
        // Update existing schedule
        const { error: scheduleUpdateError } = await supabase
          .from('schedules')
          .update({ status })
          .eq('employee_id', employee_id)
          .eq('schedule_date', schedule_date);

        if (scheduleUpdateError) {
          console.error(`Error updating schedule for date ${schedule_date}:`, scheduleUpdateError);
          return res.status(500).json({ error: scheduleUpdateError.message });
        }
      }

      return res.status(200).json({ message: 'Schedule updated successfully' });
    } catch (err) {
      console.error("Unexpected error updating schedule status:", err);
      return res.status(500).json({ error: 'Unexpected error updating schedule status' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
