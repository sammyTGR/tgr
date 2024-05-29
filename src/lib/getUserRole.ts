// lib/getUserRole.ts for header
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function getUserRole(email: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('role')
            .ilike('contact_info', email.toString().toLowerCase());

        if (error) {
            console.error('Error fetching user role:', error);
            return null;
        }

        if (!data) {
            console.error('User not found');
            return null;
        }

        return data[0].role;
    } catch (error) {
        console.error('Error in getUserRole:', error);
        return null;
    }
}

