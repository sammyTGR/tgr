import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.from('certifications').select('id, expiration');

    if (error) throw error;

    const updates = data.map((cert) => {
      const expirationDate = new Date(cert.expiration);
      const today = new Date();
      const timeDiff = expirationDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const status = daysDiff <= 60 ? 'Start Renewal Process' : '';

      return { id: cert.id, status };
    });

    for (const update of updates) {
      await supabase.from('certifications').update({ status: update.status }).eq('id', update.id);
    }

    return NextResponse.json({
      message: 'Certification statuses updated successfully',
    });
  } catch (error) {
    console.error('Error updating certification statuses:', error);
    return NextResponse.json({ error: 'Failed to update certification statuses' }, { status: 500 });
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
