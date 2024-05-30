// pages/api/clerk-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { clerkUserId, email_address, first_name, last_name } = req.body;

  if (!clerkUserId || !email_address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Unnamed User';

    // Insert or update the user in the employees table
    const { error } = await supabase
      .from('employees')
      .upsert({
        clerk_user_id: clerkUserId,
        contact_info: email_address,
        name: fullName,
        role: 'user',
        user_uuid: clerkUserId  // Ensure user_uuid is set correctly
      }, {
        onConflict: 'clerk_user_id'  // This should be a string, not an array
      });

    if (error) {
      console.error('Error inserting/updating employee:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'User processed successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
