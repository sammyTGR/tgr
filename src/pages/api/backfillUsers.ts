// pages/api/backfillUsers.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/auth-js';

// Initialize Supabase clients
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const backfillUsers = async () => {
  try {
    // Fetch existing employees
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('*');

    if (fetchError) {
      console.error('Error fetching employees:', fetchError);
      return { error: fetchError };
    }

    if (employees) {
      for (const employee of employees) {
        const { contact_info, clerk_user_id } = employee;

        // Check if user already exists in Supabase Auth
        const { data: existingAuthUsers, error: fetchAuthError } = await supabaseAdmin.auth.admin.listUsers();

        if (fetchAuthError) {
          console.error('Error fetching users from Supabase Auth:', fetchAuthError);
          continue;
        }

        // Ensure existingAuthUsers is typed correctly
        if (!existingAuthUsers || !Array.isArray(existingAuthUsers)) {
          console.error('No users fetched from Supabase Auth');
          continue;
        }

        const userExists = existingAuthUsers.some((user: SupabaseUser) => {
          return user.email?.toLowerCase() === contact_info.toLowerCase();
        });

        if (userExists) {
          console.log(`User with email ${contact_info.toLowerCase()} already exists in Supabase Auth`);
          continue;
        }

        // Create user in Supabase Auth
        const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: contact_info.toLowerCase(),
          password: 'default-password', // Handle passwords securely in a real application
          user_metadata: { clerk_user_id: clerk_user_id }
        });

        if (authError) {
          console.error('Error creating user in Supabase Auth:', authError);
        } else {
          console.log(`User created in Supabase Auth:`, createdUser);
        }
      }
    }

    return { message: 'Backfill completed' };
  } catch (error) {
    console.error('Unexpected error during backfill:', error);
    return { error: (error as Error).message };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const result = await backfillUsers();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.status(200).json(result);
}
