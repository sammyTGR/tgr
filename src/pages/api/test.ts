// pages/api/adminAccess.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function getUserRole(userId: string): Promise<string> {
    const { data, error } = await supabase
        .from('employees')
        .select('role')
        .eq('clerk_user_id', userId)
        .single(); // Assumes that clerk_user_id is unique and returns only one record

    if (error) {
        console.error('Error fetching role from Supabase:', error);
        throw new Error('Failed to fetch user role');
    }

    return data.role; // Assuming 'role' is the column storing the role
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const userId = req.query.userId as string;

        try {
            const userRole = await getUserRole(userId);

            if (userRole === 'admin') {
                res.status(200).json({ message: "Access granted to admin features." });
            } else {
                res.status(403).json({ error: "Access denied. Restricted to admin users." });
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve user role' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
