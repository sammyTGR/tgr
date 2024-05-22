// src/pages/api/generate_schedules.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

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
                schedules.push({
                    employee_id: employee.employee_id,
                    day_of_week: dayOfWeek,
                    start_time: dailySchedule.start_time,
                    end_time: dailySchedule.end_time,
                    schedule_date: date.toISOString().split('T')[0] // Format as YYYY-MM-DD
                });
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
    console.log('API Route /api/generate_schedules accessed');
    if (req.method === 'POST') {
        try {
            const weeks = req.body.weeks || 4; // Default to 4 weeks if not provided
            await generateSchedules(weeks);
            res.status(200).json({ message: 'Schedules generated successfully' });
        } catch (error: unknown) {
            console.error('Failed to generate schedules:', error);
            if (error instanceof Error) {
                res.status(500).json({ message: 'Failed to generate schedules', error: error.message });
            } else {
                res.status(500).json({ message: 'Failed to generate schedules' });
            }
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
