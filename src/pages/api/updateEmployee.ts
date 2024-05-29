// pages/api/updateEmployee.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { clerkUserId, name, department, contact_info } = req.body;

        // Step 1: Check if an entry with the given email exists
        const { data: existingEmployee, error: fetchError } = await supabase
            .from('employees')
            .select('*')
            .eq('contact_info', contact_info.toLowerCase())
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // Error other than 'no rows returned'
            console.error('Error fetching existing employee:', fetchError);
            return res.status(500).json({ error: fetchError.message });
        }

        // Step 2: If an entry with the email exists, update it with clerk_user_id
        if (existingEmployee) {
            const { error: updateError } = await supabase
                .from('employees')
                .update({ clerk_user_id: clerkUserId, name, department })
                .eq('contact_info', contact_info.toLowerCase());

            if (updateError) {
                console.error('Error updating employee:', updateError);
                return res.status(500).json({ error: updateError.message });
            }

            return res.status(200).json({ message: 'User ID updated successfully for existing employee' });
        }

        // Step 3: If no entry with the email exists, proceed with upsert
        const { data, error } = await supabase
            .from('employees')
            .upsert({
                clerk_user_id: clerkUserId,
                name,
                department,
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
