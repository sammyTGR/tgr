import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { user_uuid, name, department, contact_info } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 1: Check if an entry with the given email exists
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('contact_info', contact_info.toLowerCase())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Error other than 'no rows returned'
      console.error('Error fetching existing employee:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Step 2: If an entry with the email exists, update it with user_uuid
    if (existingEmployee) {
      const { error: updateError } = await supabase
        .from('employees')
        .update({ user_uuid, name, department })
        .eq('contact_info', contact_info.toLowerCase());

      if (updateError) {
        console.error('Error updating employee:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        message: 'User updated successfully for existing employee',
      });
    }

    // Step 3: If no entry with the email exists, proceed with upsert
    const { data, error } = await supabase.from('employees').upsert(
      {
        user_uuid,
        name,
        department,
        contact_info: contact_info.toLowerCase(),
      },
      {
        onConflict: 'user_uuid',
      }
    );

    if (error) {
      console.error('Error updating or creating employee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'User created or updated successfully',
      data,
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
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
