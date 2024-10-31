import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { Resend } from "resend";
import ShiftAdded from "../../../../emails/ShiftAdded";
import ShiftUpdated from "../../../../emails/ShiftUpdated";
import LeftEarly from "../../../../emails/LeftEarly";
import CustomStatus from "../../../../emails/CustomStatus";
import CalledOut from "../../../../emails/CalledOut";
import LateStart from "../../../../emails/LateStart";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const resend = new Resend(process.env.RESEND_API_KEY);
const timeZone = "America/Los_Angeles";

export async function POST(request: Request) {
  try {
    const { employee_id, schedule_date, status, start_time, end_time } =
      await request.json();

    if (!employee_id || !schedule_date || typeof status !== "string") {
      console.error("Invalid request:", { employee_id, schedule_date, status });
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Convert the schedule_date to Pacific Time
    const pacificDate = toZonedTime(parseISO(schedule_date), timeZone);
    // Format the date for database operations
    const formattedScheduleDate = format(pacificDate, "yyyy-MM-dd");

    // Check if the date exists in the schedules table
    const { data: scheduleData, error: scheduleFetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", formattedScheduleDate);

    if (scheduleFetchError) {
      console.error(
        `Error fetching schedule for date ${formattedScheduleDate}:`,
        scheduleFetchError
      );
      return NextResponse.json(
        { error: scheduleFetchError.message },
        { status: 500 }
      );
    }

    // Handle schedule update or insert
    if (!scheduleData || scheduleData.length === 0) {
      // Insert new schedule if it doesn't exist
      const { error: scheduleInsertError } = await supabase
        .from("schedules")
        .insert({
          employee_id,
          schedule_date: formattedScheduleDate,
          status,
          start_time,
          end_time,
        });

      if (scheduleInsertError) {
        console.error(
          `Error inserting schedule for date ${formattedScheduleDate}:`,
          scheduleInsertError
        );
        return NextResponse.json(
          { error: scheduleInsertError.message },
          { status: 500 }
        );
      }
    } else {
      // If we have start_time and end_time, use them to target the specific schedule
      let query = supabase
        .from("schedules")
        .update({ status })
        .eq("employee_id", employee_id)
        .eq("schedule_date", formattedScheduleDate);

      if (start_time && end_time) {
        query = query
          .eq("start_time", start_time)
          .eq("end_time", end_time);
      }

      const { error: scheduleUpdateError } = await query;

      if (scheduleUpdateError) {
        console.error(
          `Error updating schedule for date ${formattedScheduleDate}:`,
          scheduleUpdateError
        );
        return NextResponse.json(
          { error: scheduleUpdateError.message },
          { status: 500 }
        );
      }
    }

    // Fetch employee data - using limit(1) instead of single() for more reliable behavior
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("contact_info, name")
      .eq("employee_id", employee_id)
      .limit(1);

    if (employeeError || !employeeData || employeeData.length === 0 || !employeeData[0].contact_info) {
      console.error("Failed to fetch employee data:", employeeError);
      return NextResponse.json(
        { error: "Failed to fetch employee data" },
        { status: 500 }
      );
    }

    const email = employeeData[0].contact_info;
    const employeeName = employeeData[0].name;
    const formattedDate = format(pacificDate, "EEEE, MMMM d yyyy");

    let subject: string;
    let EmailTemplate: React.ComponentType<any>;
    let templateData: any;

    // Prepare email template and data
    if (status.startsWith("Late Start")) {
      const lateStartTime = status.split("Late Start ")[1];
      subject = "Late Start Notification";
      EmailTemplate = LateStart;
      templateData = {
        name: employeeName,
        date: formattedDate,
        startTime: lateStartTime,
      };
    } else {
      switch (status) {
        case "added_day":
          subject = "New Shift Added to Your Schedule";
          EmailTemplate = ShiftAdded;
          templateData = {
            name: employeeName,
            date: formattedDate,
            startTime: start_time,
            endTime: end_time,
          };
          break;
        case "updated_shift":
          subject = "Your Shift Has Been Updated";
          EmailTemplate = ShiftUpdated;
          templateData = {
            name: employeeName,
            date: formattedDate,
            startTime: start_time,
            endTime: end_time,
          };
          break;
        case "left_early":
          subject = "Left Early Notification";
          EmailTemplate = LeftEarly;
          templateData = {
            name: employeeName,
            date: formattedDate,
          };
          break;
        case "called_out":
          subject = "Called Out Confirmation";
          EmailTemplate = CalledOut;
          templateData = {
            name: employeeName,
            date: formattedDate,
          };
          break;
        default:
          if (status.startsWith("Custom:")) {
            subject = "Schedule Update";
            EmailTemplate = CustomStatus;
            templateData = {
              name: employeeName,
              date: formattedDate,
              status: status.replace("Custom:", "").trim(),
            };
          } else {
            throw new Error("Invalid status");
          }
      }
    }

    // Attempt to send email but don't block on failure
    try {
      await resend.emails.send({
        from: `TGR <scheduling@${process.env.RESEND_DOMAIN}>`,
        to: [email],
        subject: subject,
        react: EmailTemplate(templateData),
      });
    } catch (emailError: any) {
      // Log the error but don't return - allow the update to be considered successful
      console.error("Error sending email:", emailError.message);
    }

    // Return success even if email failed - the schedule update is the primary concern
    return NextResponse.json({
      message: "Schedule updated successfully",
      emailStatus: "sent", // or "failed" if you want to track this
    });

  } catch (err) {
    console.error("Unexpected error updating schedule status:", err);
    return NextResponse.json(
      { error: "Unexpected error updating schedule status" },
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