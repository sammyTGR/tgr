// src/pages/api/generate_schedules.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { corsHeaders } from '@/utils/cors';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function getLastSunday(date: Date): Date {
    const lastSunday = new Date(date);
    lastSunday.setDate(date.getDate() - date.getDay());
    return lastSunday;
}

function generateDates(weeks: number): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date();
    const startDate = getLastSunday(currentDate);

    for (let i = 0; i < weeks * 7; i++) {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + i);
        dates.push(newDate);
    }

    return dates;
}

async function generateSchedules(weeks: number) {
    console.log(`Starting to generate schedules for ${weeks} weeks.`);

    const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('employee_id, name');

    if (employeeError) {
        console.error("Error fetching employees:", employeeError);
        throw employeeError;
    }

    console.log("Employees fetched:", employees);

    const { data: referenceSchedules, error: referenceScheduleError } = await supabase
        .from('reference_schedules')
        .select('employee_id, day_of_week, start_time, end_time');

    if (referenceScheduleError) {
        console.error("Error fetching reference schedules:", referenceScheduleError);
        throw referenceScheduleError;
    }

    console.log("Reference schedules fetched:", referenceSchedules);

    const dates = generateDates(weeks);
    const schedules = [];

    for (const employee of employees) {
        const employeeSchedules = referenceSchedules.filter(ref => ref.employee_id === employee.employee_id);

        for (const date of dates) {
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dailySchedule = employeeSchedules.find(schedule => schedule.day_of_week === dayOfWeek);

            if (dailySchedule && dailySchedule.start_time && dailySchedule.end_time) {
                const scheduleDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

                try {
                    // Check if a schedule for this date and employee already exists
                    const { data: existingSchedule, error: existingScheduleError } = await supabase
                        .from('schedules')
                        .select('schedule_id')
                        .eq('employee_id', employee.employee_id)
                        .eq('schedule_date', scheduleDate)
                        .single();

                    if (existingScheduleError && existingScheduleError.code !== 'PGRST116') {
                        console.error("Error checking existing schedules:", existingScheduleError);
                        throw existingScheduleError;
                    }

                    if (!existingSchedule) {
                        schedules.push({
                            employee_id: employee.employee_id,
                            day_of_week: dayOfWeek,
                            start_time: dailySchedule.start_time,
                            end_time: dailySchedule.end_time,
                            schedule_date: scheduleDate,
                            status: 'scheduled' // or any default status you want to set
                        });
                    }
                } catch (error) {
                    console.error(`Error processing schedule for employee_id: ${employee.employee_id}, schedule_date: ${scheduleDate}`, error);
                    throw error;
                }
            }
        }
    }

    console.log("Generated schedules:", schedules);

    if (schedules.length === 0) {
        throw new Error("No schedules generated to insert");
    }

    const { data, error } = await supabase
        .from('schedules')
        .insert(schedules);

    if (error) {
        console.error("Error inserting schedules:", error);
        throw error;
    }

    console.log("Schedules inserted successfully:", data);
}

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

    try {
        const { weeks } = req.body;
        await generateSchedules(weeks);
        res.status(200).json({ message: 'Schedules generated successfully' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}
