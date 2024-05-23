import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('role')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data.role;
}
