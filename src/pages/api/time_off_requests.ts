import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

interface TimeOffRequest {
  request_id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  other_reason: string;
  status: string;
  name: string;
  email: string;
  use_sick_time: boolean;
  use_vacation_time: boolean;
  available_sick_time: number;
  created_at: string;
  pay_type: string;
  hire_date: string;
  vacation_time: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    if (req.method === 'GET') {
        console.log('Fetching pending time off requests');
        try {
            const { data, error } = await supabase
                .from('time_off_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true }); // Add this line to sort by created_at in ascending order

            if (error) {
                console.error("Error fetching time off requests:", error.message);
                return res.status(500).json({ error: error.message });
            }

            if (!data || data.length === 0) {
                console.log('No pending time off requests found');
                return res.status(200).json([]);
            }

            console.log(`Found ${data.length} pending time off requests`);

            const enrichedData = await Promise.all(data.map(async (request: TimeOffRequest) => {
                console.log(`Enriching data for request ID: ${request.request_id}`);
                const [sickTimeResult, employeeResult] = await Promise.all([
                    supabase.rpc("calculate_available_sick_time", { p_emp_id: request.employee_id }),
                    supabase.from('employees').select('pay_type, hire_date, vacation_time').eq('employee_id', request.employee_id).single()
                ]);

                const sickTimeData = sickTimeResult.data;
                const sickTimeError = sickTimeResult.error;
                const employeeData = employeeResult.data;
                const employeeError = employeeResult.error;

                if (sickTimeError) {
                    console.error(`Failed to fetch sick time for employee ID ${request.employee_id}:`, sickTimeError.message);
                }

                if (employeeError) {
                    console.error(`Failed to fetch employee data for employee ID ${request.employee_id}:`, employeeError.message);
                }

                return { 
                    ...request, 
                    available_sick_time: sickTimeError ? 40 : sickTimeData as number,
                    pay_type: employeeData?.pay_type || 'unknown',
                    hire_date: employeeData?.hire_date || null,
                    vacation_time: employeeData?.vacation_time || 0
                };
            }));

            console.log('Successfully enriched time off request data');
            return res.status(200).json(enrichedData);
        } catch (err) {
            console.error("Unexpected error fetching time off requests:", err);
            return res.status(500).json({ error: 'Unexpected error fetching time off requests' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}