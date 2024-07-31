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
        const { employee_name, start_date, end_date, reason, other_reason } = req.body;

        try {
            // Fetch employee_id and contact_info based on employee_name
            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('employee_id, contact_info')
                .eq('name', employee_name)
                .single();

            if (employeeError || !employeeData) {
                console.error("Error fetching employee:", employeeError?.message);
                return res.status(500).json({ error: 'Employee not found' });
            }

            const { employee_id, contact_info } = employeeData;
            const email = contact_info; // Assuming contact_info is the plain text email

            // Insert the time off request
            const { data, error } = await supabase
                .from('time_off_requests')
                .insert([{
                    employee_id,
                    name: employee_name,
                    start_date,
                    end_date,
                    reason,
                    other_reason,
                    status: 'pending',
                    email,
                    sick_time_year: new Date().getFullYear()  // Add this line
                }])
                .select(); // Select the inserted row to return it

            if (error) {
                console.error("Error inserting time off request:", error.message);
                return res.status(500).json({ error: error.message });
            }

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
