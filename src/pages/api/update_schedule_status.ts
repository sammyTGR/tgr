import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import sendgrid from '@sendgrid/mail';
import { corsHeaders } from '@/utils/cors';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'POST') {
    const { employee_id, schedule_date, status, start_time, end_time } = req.body;

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
        // console.log(`Inserting new schedule for date ${schedule_date}`);
        // Insert new schedule if it doesn't exist
        const { error: scheduleInsertError } = await supabase
          .from('schedules')
          .insert({ employee_id, schedule_date, status });

        if (scheduleInsertError) {
          console.error(`Error inserting schedule for date ${schedule_date}:`, scheduleInsertError);
          return res.status(500).json({ error: scheduleInsertError.message });
        }
      } else {
        // console.log(`Updating existing schedule for date ${schedule_date}`);
        // Update existing schedule
        const { error: scheduleUpdateError } = await supabase
          .from('schedules')
          .update({ status, start_time, end_time })
          .eq('employee_id', employee_id)
          .eq('schedule_date', schedule_date);

        if (scheduleUpdateError) {
          console.error(`Error updating schedule for date ${schedule_date}:`, scheduleUpdateError);
          return res.status(500).json({ error: scheduleUpdateError.message });
        }
      }

      // Fetch employee email from contact_info assuming it's plain text
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('contact_info, name')
        .eq('employee_id', employee_id)
        .single();

      if (employeeError || !employeeData || !employeeData.contact_info) {
        console.error("Failed to fetch employee contact_info:", employeeError);
        return res.status(500).json({ error: 'Failed to fetch employee contact_info' });
      }

      const email = employeeData.contact_info;
      const employeeName = employeeData.name;
      const scheduleDayOfWeek = new Date(schedule_date).toLocaleString('en-US', { weekday: 'long' });

      let subject = "Your Schedule Has Been Updated";
      let message = `Your scheduled shift on ${scheduleDayOfWeek}, ${schedule_date} has been updated.`;

      if (status === "added_day") {
        message = `A new shift has been added to your work schedule for ${scheduleDayOfWeek}, ${schedule_date} from ${start_time} to ${end_time}.`;
      } else if (status === "updated_shift") {
        message = `Your shift on ${scheduleDayOfWeek}, ${schedule_date} has been updated. Your new shift time is from ${start_time} to ${end_time}.`;
      }

      const msg = {
        to: email,
        from: 'samlee@thegunrange.biz', // Your verified sender
        subject: subject,
        text: message,
        html: `<strong>${message}</strong>`, // Optional: Include HTML content
      };

      try {
        await sendgrid.send(msg);
        // console.log("Email sent successfully");
      } catch (emailError: any) {
        console.error("Error sending email:", emailError.response?.body || emailError);
        return res.status(500).json({ error: 'Error sending email', details: emailError.message });
      }

      return res.status(200).json({ message: 'Schedule updated and email sent successfully' });
    } catch (err) {
      console.error("Unexpected error updating schedule status:", err);
      return res.status(500).json({ error: 'Unexpected error updating schedule status' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}