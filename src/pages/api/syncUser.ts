import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
        return res.status(200).json({ message: 'CORS preflight request success' });
    }

    // Set necessary headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    if (req.method === 'POST') {
        const user = req.body;
        // console.log('Received user data:', user);

        const user_uuid = user.id;
        const email = user.email.toLowerCase();
        const first_name = user.user_metadata.full_name?.split(' ')[0] || '';
        const last_name = user.user_metadata.full_name?.split(' ')[1] || '';

        // console.log('Processed user data:', { user_uuid, email, first_name, last_name });

        try {
            // Insert the user into the customers table during sign-up
            const { data, error } = await supabase
              .from('customers')
              .insert({
                user_uuid,
                email,
                first_name,
                last_name,
                role: 'customer',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (error) {
                console.error('Error inserting customer:', error);
                return res.status(500).json({ error: error.message });
            }

            // console.log('Customer inserted successfully:', data);
            res.status(200).json({ message: 'Customer inserted successfully', data });
        } catch (error) {
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
