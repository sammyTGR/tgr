import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!token) {
      console.error('No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deposits: Deposit[] = await request.json();
    const depositsWithUserUUID = deposits.map((deposit: Deposit) => ({
      ...deposit,
      user_uuid: user.id,
    }));

    const { error } = await supabase.from('daily_deposits').insert(depositsWithUserUUID);

    if (error) {
      console.error('Error inserting data:', error.message);
      throw error;
    }

    return NextResponse.json({
      message: 'Deposit data submitted successfully.',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Internal server error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('Unknown internal server error');
      return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
