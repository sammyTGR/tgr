// src/pages/api/syncUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const user = req.body;
        console.log('Received user data:', user);

        const user_uuid = user.id;
        const email = user.email.toLowerCase();
        const full_name = user.user_metadata.full_name || '';
        const avatar_url = user.user_metadata.avatar_url || '';
        const first_name = full_name.split(' ')[0];
        const last_name = full_name.split(' ')[1] || '';

        console.log('Processed user data:', { user_uuid, email, first_name, last_name });

        try {
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    id: user_uuid,
                    email,
                    full_name,
                    avatar_url,
                    role: 'customer'
                });

            if (error) {
                console.error('Error updating or creating profile:', error);
                return res.status(500).json({ error: error.message });
            }

            console.log('Profile created or updated successfully:', data);

            res.status(200).json({ message: 'Profile created or updated successfully', data });
        } catch (error) {
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
