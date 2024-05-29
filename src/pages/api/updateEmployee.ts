// pages/api/updateEmployee.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { clerkUserId, name, department, contact_info } = req.body;

        // Fetch existing employee
        const { data: existingEmployee, error: fetchError } = await supabase
            .from('employees')
            .select('role')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // Error other than 'no rows returned'
            console.error('Error fetching existing employee:', fetchError);
            return res.status(500).json({ error: fetchError.message });
        }

        const role = existingEmployee ? existingEmployee.role : 'user';

        const { data, error } = await supabase
            .from('employees')
            .upsert({
                clerk_user_id: clerkUserId,
                name,
                department,
                role,
                contact_info
            }, {
                onConflict: 'clerk_user_id'
            });

        if (error) {
            console.error('Error updating or creating employee:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'User ID updated successfully', data });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
