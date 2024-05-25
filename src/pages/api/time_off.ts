// pages/api/time_off.ts used for submitting time off requests
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { employee_name, start_date, end_date, reason, other_reason } = req.body;

        try {
            // Fetch employee_id based on employee_name
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('employee_id')
                .eq('name', employee_name)
                .single();

            if (employeeError || !employeeData) {
                console.error("Error fetching employee:", employeeError?.message);
                return res.status(500).json({ error: 'Employee not found' });
            }

            const employee_id = employeeData.employee_id;

            // Insert the time off request
            const { data, error } = await supabase
                .from('time_off_requests')
                .insert([{ employee_id, name: employee_name, start_date, end_date, reason, other_reason, status: 'pending' }])
                .select(); // Select the inserted row to return it

            if (error) {
                console.error("Error inserting time off request:", error.message);
                return res.status(500).json({ error: error.message });
            }

            console.log("Time off request inserted:", data);
            return res.status(200).json(data);
        } catch (err) {
            console.error("Unexpected error handling time off request:", err);
            return res.status(500).json({ error: 'Unexpected error handling time off request' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

