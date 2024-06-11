// src/pages/api/syncUser.ts
// src/pages/api/syncUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const user = req.body;
        console.log('Received user data:', user);

        // Extract necessary fields from the user object
        const user_uuid = user.id;
        const email = user.email.toLowerCase();
        const full_name = user.user_metadata.full_name || '';
        const first_name = full_name.split(' ')[0];

        console.log('Processed user data:', { user_uuid, email, first_name });

        try {
            // Check if an entry with the given email exists
            const { data: existingEmployee, error: fetchError } = await supabase
                .from('employees')
                .select('*')
                .eq('contact_info', email)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching existing employee:', fetchError);
                return res.status(500).json({ error: fetchError.message });
            }

            console.log('Existing employee:', existingEmployee);

            // If an entry with the email exists, update it with user_uuid
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

            // If no entry with the email exists, proceed with upsert
            const { data, error } = await supabase
                .from('employees')
                .upsert({
                    user_uuid,
                    contact_info: email,
                    name: first_name,
                    role: 'user' // Set default role as 'user'
                }, {
                    onConflict: 'contact_info'
                });

            if (error) {
                console.error('Error updating or creating employee:', error);
                return res.status(500).json({ error: error.message });
            }

            console.log('User created or updated successfully:', data);

            res.status(200).json({ message: 'User created or updated successfully', data });
        } catch (error) {
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
