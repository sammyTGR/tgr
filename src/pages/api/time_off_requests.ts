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
  available_sick_time: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('time_off_requests')
                .select('*')
                .eq('status', 'pending'); 

            if (error) {
                console.error("Error fetching time off requests:", error.message);
                return res.status(500).json({ error: error.message });
            }

            const enrichedData = await Promise.all(data.map(async (request: TimeOffRequest) => {
                const { data: sickTimeData, error } = await supabase
                  .rpc("calculate_available_sick_time", { p_emp_id: request.employee_id });
                if (error) {
                  console.error("Failed to fetch sick time:", error.message);
                  return { ...request, available_sick_time: 40 };  
                }
                return { ...request, available_sick_time: sickTimeData };
            }));

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
