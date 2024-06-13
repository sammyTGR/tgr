// pages/api/getUserRole.ts for getting user role used in time off review
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '@/utils/cors';
import { supabase } from '@/utils/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'OPTIONS') {
        res.status(200).json({ message: 'CORS preflight request success' });
        return;
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email parameter is required' });
    }

    const { data, error } = await supabase
        .from('employees')
        .select('role')
        .ilike('contact_info', email.toString().toLowerCase())
        .maybeSingle();

    if (error) {
        console.error('Error fetching user role:', error);
        return res.status(500).json({ error: error.message });
    }

    if (!data) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ role: data.role });
}
