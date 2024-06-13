import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { corsHeaders } from '@/utils/cors';
import { supabase } from '@/utils/supabase/client';

// Function to get the day of the week from a date
const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
};

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

  const { employee_id, day, start_time, end_time } = req.body;

  if (!employee_id || !day || !start_time || !end_time) {
    console.error('Missing required fields', { employee_id, day, start_time, end_time });
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }

  try {
    const scheduleDate = new Date(day);
    const dayOfWeek = getDayOfWeek(scheduleDate);

    // Check if a schedule already exists for the same employee and day
    const { data: existingSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('schedule_id')
      .eq('employee_id', employee_id)
      .eq('schedule_date', day)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // 'PGRST116' is the 'No rows found' error code
      console.error("Error fetching existing schedule:", fetchError);
      throw fetchError;
    }

    if (existingSchedule) {
      console.warn('Schedule already exists for this employee on this day', existingSchedule);
      res.status(400).json({ message: 'Schedule already exists for this employee on this day' });
      return;
    }

    const { error: insertError } = await supabase
      .from('schedules')
      .insert({
        employee_id,
        schedule_date: day,
        day_of_week: dayOfWeek, // Add calculated day_of_week
        start_time,
        end_time,
        status: 'scheduled' // or any default status you want to set
      });

    if (insertError) {
      console.error("Error inserting schedule:", insertError);
      throw insertError;
    }

    res.status(200).json({ message: 'Schedule submitted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
