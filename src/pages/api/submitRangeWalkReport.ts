import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';
import { corsHeaders } from '@/utils/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'CORS preflight request success' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Error fetching user with token:", userError?.message || "No user data");
      return res.status(401).json({ error: userError?.message || 'Unauthorized' });
    }

    const user = userData.user;

    const { date_of_walk, lanes, lanes_with_problems, description, role } = req.body;

    try {
      const { data, error: insertError } = await supabase
        .from('range_walk_reports')
        .insert([
          {
            user_uuid: user.id,
            user_name: user.user_metadata.full_name || user.email, // Ensure user_name fallback
            date_of_walk,
            lanes,
            lanes_with_problems,
            description,
            role
          }
        ]);

      if (insertError) {
        console.error("Error inserting data:", insertError.message);
        throw insertError;
      }

      // console.log("Data inserted successfully:", data);

      res.status(200).json({ message: 'Report submitted successfully.' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error handling request:", error.message);
        res.status(500).json({ error: error.message });
      } else {
        console.error("Unknown error handling request:", error);
        res.status(500).json({ error: 'An unknown error occurred.' });
      }
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
