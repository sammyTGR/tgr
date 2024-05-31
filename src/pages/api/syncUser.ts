// pages/api/syncUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const user = req.body;

        // Extract necessary fields from the user object
        const user_uuid = user.id;
        const email = user.email.toLowerCase();
        const full_name = user.user_metadata.full_name;
        const first_name = full_name.split(' ')[0];

        try {
            // Step 1: Check if an entry with the given email exists
            const { data: existingEmployee, error: fetchError } = await supabase
                .from('employees')
                .select('*')
                .eq('contact_info', email)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                // Error other than 'no rows returned'
                console.error('Error fetching existing employee:', fetchError);
                return res.status(500).json({ error: fetchError.message });
            }

            // Step 2: If an entry with the email exists, update it with user_uuid
            if (existingEmployee) {
                const { error: updateError } = await supabase
                    .from('employees')
                    .update({ user_uuid, name: first_name })
                    .eq('contact_info', email);

                if (updateError) {
                    console.error('Error updating employee:', updateError);
                    return res.status(500).json({ error: updateError.message });
                }

                return res.status(200).json({ message: 'User updated successfully for existing employee' });
            }

            // Step 3: If no entry with the email exists, proceed with upsert
            const { data, error } = await supabase
                .from('employees')
                .upsert({
                    user_uuid,
                    contact_info: email,
                    name: first_name,
                    role: 'user' // Set default role as 'user'
                }, {
                    onConflict: 'user_uuid'
                });

            if (error) {
                console.error('Error updating or creating employee:', error);
                return res.status(500).json({ error: error.message });
            }

            res.status(200).json({ message: 'User created or updated successfully', data });
        } catch (error) {
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
