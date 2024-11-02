import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // console.log('Received request body:', body);
    
    const { request_id, action, use_sick_time, use_vacation_time } = body;
    
    if (!request_id) {
      return NextResponse.json({ error: "Invalid request - missing request_id" }, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const supabase = createClient();

    // Get the time off request with employee data
    const { data: timeOffData, error: fetchError } = await supabase
      .from("time_off_requests")
      .select(`
        *,
        employees!time_off_requests_user_uuid_fkey (
          employee_id,
          sick_time_used,
          vacation_time,
          pay_type,
          name
        )
      `)
      .eq("request_id", request_id)
      .single();

    if (fetchError) {
      console.error('Error fetching time off request:', fetchError);
      return NextResponse.json({ 
        error: "Failed to fetch request data", 
        details: fetchError.message 
      }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // console.log('Time off request data:', timeOffData);

    // Handle action changes (approve, deny, etc.)
    if (action === "time_off" || action === "deny" || action === "called_out" || action === "left_early" || action.startsWith("Custom:")) {
      // Update schedules first
      if (timeOffData.employee_id) {
        let scheduleStatus = action === "time_off" ? "time_off" : action;
        if (action.startsWith("Custom:")) {
          scheduleStatus = action; // Keep the full custom status
        }

        const { error: scheduleError } = await supabase
          .from("schedules")
          .update({ status: scheduleStatus })
          .eq("employee_id", timeOffData.employee_id)
          .gte("schedule_date", timeOffData.start_date)
          .lte("schedule_date", timeOffData.end_date);

        if (scheduleError) {
          console.error("Error updating schedules:", scheduleError);
          return NextResponse.json({ error: scheduleError.message }, { status: 500 });
        }
      }

      // Update time off request with is_read only for action changes
      const { data: updatedTimeOff, error: timeOffError } = await supabase
        .from("time_off_requests")
        .update({
          status: action,
          is_read: true, // Set is_read for action changes
        })
        .eq("request_id", request_id)
        .select()
        .single();

      if (timeOffError) {
        return NextResponse.json({ error: timeOffError.message }, { status: 500 });
      }
    }

    // Handle sick time toggle
    if (typeof use_sick_time !== 'undefined' && use_sick_time !== timeOffData.use_sick_time) {
      // console.log('Attempting to update sick time usage:', {
      //   use_sick_time,
      //   employee_id: timeOffData.employee_id,
      //   start_date: timeOffData.start_date,
      //   end_date: timeOffData.end_date
      // });

      try {
        // First update the time_off_requests table directly
        const { error: updateError } = await supabase
          .from("time_off_requests")
          .update({
            use_sick_time,
            sick_time_year: new Date().getFullYear()
          })
          .eq("request_id", request_id);

        if (updateError) {
          console.error('Error updating time off request:', updateError);
          return NextResponse.json({ 
            error: "Failed to update time off request", 
            details: updateError.message 
          }, { 
            status: 500, 
            headers: corsHeaders 
          });
        }

        // Then if enabling sick time, calculate the hours
        if (use_sick_time) {
          // console.log('Calling deduct_sick_time with params:', {
          //   p_emp_id: timeOffData.employee_id,
          //   p_start_date: timeOffData.start_date,
          //   p_end_date: timeOffData.end_date
          // });

          const { error: sickTimeError } = await supabase.rpc('deduct_sick_time', {
            p_emp_id: timeOffData.employee_id,
            p_start_date: timeOffData.start_date,
            p_end_date: timeOffData.end_date
          });

          if (sickTimeError) {
            console.error('Error in deduct_sick_time:', sickTimeError);
            // Rollback the update if the function call failed
            await supabase
              .from("time_off_requests")
              .update({ use_sick_time: false, sick_time_year: null })
              .eq("request_id", request_id);

            return NextResponse.json({ 
              error: "Failed to deduct sick time", 
              details: sickTimeError.message 
            }, { 
              status: 500, 
              headers: corsHeaders 
            });
          }
        }
      } catch (err) {
        console.error('Error in sick time handling:', err);
        return NextResponse.json({ 
          error: "Error processing sick time", 
          details: err instanceof Error ? err.message : 'Unknown error occurred'
        }, { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // Get final state of the request
    const { data: finalState, error: finalError } = await supabase
      .from("time_off_requests")
      .select(`
        *,
        employees!time_off_requests_user_uuid_fkey (
          employee_id,
          sick_time_used,
          vacation_time,
          pay_type,
          name
        )
      `)
      .eq("request_id", request_id)
      .single();

    if (finalError) {
      console.error('Error fetching final state:', finalError);
      return NextResponse.json({ 
        error: "Failed to fetch final state", 
        details: finalError.message 
      }, { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    return NextResponse.json(finalState, { headers: corsHeaders });

  } catch (err: any) {
    console.error("Unexpected error in approve_request:", err);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: err.message 
    }, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}