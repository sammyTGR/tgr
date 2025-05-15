import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types_db';
import { toZonedTime as zonedTimeToUtc } from 'date-fns-tz';

interface RequestBody {
  dateRange: {
    from: string;
    to: string;
  };
  employeeLanids: string[] | null;
}

interface SalesAggregation {
  Lanid: string | null;
  total_gross: number;
  total_net: number;
}

const TIMEZONE = 'America/Los_Angeles';

// Add validation and debug logging for date ranges
const validateDateRange = (from: string, to: string) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const daysDifference = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  // console.log("Date Range Validation:", {
  //   from,
  //   to,
  //   fromDate: fromDate.toISOString(),
  //   toDate: toDate.toISOString(),
  //   daysDifference,
  // });

  return {
    isValid: daysDifference >= 0,
    daysDifference,
  };
};

// Add timeout utility
const timeoutPromise = (ms: number) =>
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body: RequestBody = await req.json();

    // console.log("Request body:", {
    //   dateRange: body.dateRange,
    //   employeeLanidsCount: body.employeeLanids?.length,
    // });

    // Convert dates to UTC with timezone consideration
    const fromDateTemp = new Date(body.dateRange.from);
    fromDateTemp.setHours(0, 0, 0, 0);
    const fromDate = zonedTimeToUtc(fromDateTemp, TIMEZONE);

    const toDateTemp = new Date(body.dateRange.to);
    toDateTemp.setHours(23, 59, 59, 999);
    const toDate = zonedTimeToUtc(toDateTemp, TIMEZONE);

    // console.log("Date conversion:", {
    //   originalFrom: body.dateRange.from,
    //   originalTo: body.dateRange.to,
    //   fromDate: fromDate.toISOString(),
    //   toDate: toDate.toISOString(),
    // });

    // Validate date range
    const { isValid, daysDifference } = validateDateRange(
      fromDate.toISOString(),
      toDate.toISOString()
    );

    // console.log("Date validation:", { isValid, daysDifference });

    if (!isValid) {
      console.error('Invalid date range:', {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }

    // First get active employees
    const { data: activeEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('lanid, name')
      .eq('status', 'active')
      .in('department', ['Sales', 'Range', 'Operations']);

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      throw employeesError;
    }

    // console.log("Active employees:", {
    //   count: activeEmployees?.length,
    //   sample: activeEmployees?.slice(0, 2),
    // });

    // Create a map of lanid to employee name for easier lookup
    const employeeMap = new Map(
      activeEmployees?.map((emp) => [emp.lanid?.toLowerCase(), emp.name]) || []
    );

    const employeeLanids = body.employeeLanids || activeEmployees?.map((e) => e.lanid) || [];

    // Get aggregated sales data with timeout
    const rpcParams = {
      start_date: fromDate.toISOString(),
      end_date: toDate.toISOString(),
      employee_lanids: employeeLanids.length > 0 ? employeeLanids : null,
    };

    // console.log("Starting RPC call:", {
    //   timestamp: new Date().toISOString(),
    //   params: rpcParams,
    //   employeeLanidsCount: employeeLanids.length,
    // });

    // Race between the RPC call and a timeout
    const { data: salesData, error: salesError } = (await Promise.race([
      supabase.rpc('get_employee_sales_summary', rpcParams),
      timeoutPromise(30000), // 30 second timeout
    ])) as { data: SalesAggregation[] | null; error: any };

    if (salesError) {
      console.error('RPC Error:', {
        error: salesError,
        params: rpcParams,
        timestamp: new Date().toISOString(),
      });

      // Check if it's a timeout error
      if (salesError.message?.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Request timed out',
            details: 'The request took too long to process. Please try with a smaller date range.',
          },
          { status: 504 }
        );
      }

      throw salesError;
    }

    // console.log("RPC call completed:", {
    //   timestamp: new Date().toISOString(),
    //   recordCount: salesData?.length,
    // });

    // Process the pre-aggregated data
    const processedData = (salesData || [])
      .map((row: SalesAggregation) => ({
        Lanid: row.Lanid || '',
        employee_name: employeeMap.get(row.Lanid?.toLowerCase() || '') || '',
        total_gross: Number(row.total_gross) || 0,
        total_net: Number(row.total_net) || 0,
      }))
      .filter((row) => row.employee_name);

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('API Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
      timestamp: new Date().toISOString(),
    });

    // Return a more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('timeout') ? 504 : 500;

    return NextResponse.json(
      {
        error: 'Failed to fetch employee summary',
        details: errorMessage,
        suggestion:
          status === 504
            ? 'Try reducing the date range or filtering by specific employees'
            : undefined,
      },
      { status }
    );
  }
}
