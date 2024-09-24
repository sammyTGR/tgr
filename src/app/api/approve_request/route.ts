import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";

export async function POST(request: Request) {
  const { request_id, action, use_sick_time, use_vacation_time } =
    await request.json();

  console.log("Processing request:", {
    request_id,
    action,
    use_sick_time,
    use_vacation_time,
  });

  if (!request_id || typeof action !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (use_sick_time && use_vacation_time) {
    return NextResponse.json(
      {
        error:
          "Cannot use both sick time and vacation time for the same request",
      },
      { status: 400 }
    );
  }

  try {
    // Update the status of the time off request
    const { data: timeOffData, error: timeOffError } = await supabase
      .from("time_off_requests")
      .update({ status: action, use_sick_time, use_vacation_time })
      .eq("request_id", request_id)
      .select("employee_id, start_date, end_date, email")
      .single();

    if (timeOffError) {
      console.error("Error updating request status:", timeOffError);
      return NextResponse.json(
        { error: timeOffError.message },
        { status: 500 }
      );
    }

    if (!timeOffData) {
      console.error("No data returned from time off request update");
      return NextResponse.json(
        { error: "Time off request not found" },
        { status: 404 }
      );
    }

    if (use_sick_time) {
      const { error: sickTimeError } = await supabase.rpc("deduct_sick_time", {
        p_emp_id: timeOffData.employee_id,
        p_start_date: timeOffData.start_date,
        p_end_date: timeOffData.end_date,
      });

      if (sickTimeError) {
        console.error("Error deducting sick time:", sickTimeError);
        // Revert the time off request update
        await supabase
          .from("time_off_requests")
          .update({ status: "pending", use_sick_time: false })
          .eq("request_id", request_id);
        return NextResponse.json(
          { error: sickTimeError.message },
          { status: 500 }
        );
      }
    }

    if (use_vacation_time) {
      const { error: vacationTimeError } = await supabase.rpc(
        "deduct_vacation_time",
        {
          p_emp_id: timeOffData.employee_id,
          p_start_date: timeOffData.start_date,
          p_end_date: timeOffData.end_date,
        }
      );

      if (vacationTimeError) {
        console.error("Error deducting vacation time:", vacationTimeError);
        // Revert the time off request update
        await supabase
          .from("time_off_requests")
          .update({ status: "pending", use_vacation_time: false })
          .eq("request_id", request_id);
        return NextResponse.json(
          { error: vacationTimeError.message },
          { status: 500 }
        );
      }
    }

    if (!timeOffData.email) {
      console.error("Email not found in the time off request:", timeOffData);
      return NextResponse.json(
        { error: "Email not found in the time off request" },
        { status: 400 }
      );
    }

    console.log("Request processed successfully:", timeOffData);
    return NextResponse.json(timeOffData);
  } catch (err) {
    console.error("Unexpected error updating request status:", err);
    return NextResponse.json(
      { error: "Unexpected error updating request status" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}
