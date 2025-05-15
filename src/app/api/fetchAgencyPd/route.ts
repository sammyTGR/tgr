import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { searchParams } = new URL(request.url);
    const departmentType = searchParams.get('department');
    const id = searchParams.get('id');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If ID is provided, fetch single agency
    if (id) {
      const { data, error } = await supabase
        .from('agency_departments')
        .select('id, agency, department')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching agency department:', error);
        return NextResponse.json({ error: 'Failed to fetch agency department' }, { status: 500 });
      }

      return NextResponse.json({
        value: data.id.toString(),
        label: data.agency,
        department: data.department,
      });
    }

    // Otherwise, fetch filtered list
    let query = supabase
      .from('agency_departments')
      .select('id, agency, department')
      .order('agency', { ascending: true });

    if (departmentType) {
      query = query.eq('department', departmentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching agency departments:', error);
      return NextResponse.json({ error: 'Failed to fetch agency departments' }, { status: 500 });
    }

    const formattedData = data.map((item) => ({
      value: item.id.toString(),
      label: `${item.agency}`,
      department: item.department,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error in fetchAgencyPd:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
