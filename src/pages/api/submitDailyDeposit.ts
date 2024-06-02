import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/utils/supabase/client';

interface Deposit {
  register: string;
  employee_name: string;
  pennies: number;
  nickels: number;
  dimes: number;
  quarters: number;
  ones: number;
  fives: number;
  tens: number;
  twenties: number;
  fifties: number;
  hundreds: number;
  roll_of_pennies: number;
  roll_of_nickels: number;
  roll_of_dimes: number;
  roll_of_quarters: number;
  total_in_drawer: number;
  total_to_deposit: number;
  aim_generated_total: number;
  discrepancy_message: string;
  explain_discrepancies: string;
  user_uuid: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
      console.error('Error fetching user:', userError.message);
      return res.status(401).json({ error: userError.message });
    }
    if (!user) {
      console.error('User not found for token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const deposits: Deposit[] = req.body.map((deposit: Deposit) => ({
      ...deposit,
      user_uuid: user.id,
    }));

    try {
      const { error } = await supabase
        .from('daily_deposits')
        .insert(deposits);

      if (error) {
        console.error('Error inserting data:', error.message);
        throw error;
      }

      res.status(200).json({ message: 'Deposit data submitted successfully.' });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Internal server error:', error.message);
        res.status(500).json({ error: error.message });
      } else {
        console.error('Unknown internal server error');
        res.status(500).json({ error: 'An unknown error occurred.' });
      }
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
