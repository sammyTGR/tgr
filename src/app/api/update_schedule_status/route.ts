import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { Resend } from "resend";
import ShiftAdded from "../../../../emails/ShiftAdded";
import ShiftUpdated from "../../../../emails/ShiftUpdated";
import LeftEarly from "../../../../emails/LeftEarly";
import CustomStatus from "../../../../emails/CustomStatus";
import CalledOut from "../../../../emails/CalledOut";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { employee_id, schedule_date, status, start_time, end_time } =
    await request.json();

  if (!employee_id || !schedule_date || typeof status !== "string") {
    console.error("Invalid request:", { employee_id, schedule_date, status });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // Check if the date exists in the schedules table
    const { data: scheduleData, error: scheduleFetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", schedule_date)
      .single();

    if (scheduleFetchError) {
      console.error(
        `Error fetching schedule for date ${schedule_date}:`,
        scheduleFetchError
      );
      return NextResponse.json(
        { error: scheduleFetchError.message },
        { status: 500 }
      );
    }

    if (!scheduleData) {
      // Insert new schedule if it doesn't exist
      const { error: scheduleInsertError } = await supabase
        .from("schedules")
        .insert({ employee_id, schedule_date, status });

      if (scheduleInsertError) {
        console.error(
          `Error inserting schedule for date ${schedule_date}:`,
          scheduleInsertError
        );
        return NextResponse.json(
          { error: scheduleInsertError.message },
          { status: 500 }
        );
      }
    } else {
      // Update existing schedule
      const { error: scheduleUpdateError } = await supabase
        .from("schedules")
        .update({ status, start_time, end_time })
        .eq("employee_id", employee_id)
        .eq("schedule_date", schedule_date);

      if (scheduleUpdateError) {
        console.error(
          `Error updating schedule for date ${schedule_date}:`,
          scheduleUpdateError
        );
        return NextResponse.json(
          { error: scheduleUpdateError.message },
          { status: 500 }
        );
      }
    }

    // Fetch employee email from contact_info assuming it's plain text
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("contact_info, name")
      .eq("employee_id", employee_id)
      .single();

    if (employeeError || !employeeData || !employeeData.contact_info) {
      console.error("Failed to fetch employee contact_info:", employeeError);
      return NextResponse.json(
        { error: "Failed to fetch employee contact_info" },
        { status: 500 }
      );
    }

    const email = employeeData.contact_info;
    const employeeName = employeeData.name;
    const scheduleDayOfWeek = new Date(schedule_date).toLocaleString("en-US", {
      weekday: "long",
    });

    let subject: string;
    let EmailTemplate: React.ComponentType<any>;
    let templateData: any;

    switch (status) {
      case "added_day":
        subject = "New Shift Added to Your Schedule";
        EmailTemplate = ShiftAdded;
        templateData = {
          name: employeeName,
          date: `${scheduleDayOfWeek}, ${schedule_date}`,
          startTime: start_time,
          endTime: end_time,
        };
        break;
      case "updated_shift":
        subject = "Your Shift Has Been Updated";
        EmailTemplate = ShiftUpdated;
        templateData = {
          name: employeeName,
          date: `${scheduleDayOfWeek}, ${schedule_date}`,
          startTime: start_time,
          endTime: end_time,
        };
        break;
      case "left_early":
        subject = "Left Early Notification";
        EmailTemplate = LeftEarly;
        templateData = {
          name: employeeName,
          date: `${scheduleDayOfWeek}, ${schedule_date}`,
        };
        break;
      case "called_out":
        subject = "Called Out Confirmation";
        EmailTemplate = CalledOut;
        templateData = {
          name: employeeName,
          date: `${scheduleDayOfWeek}, ${schedule_date}`,
        };
        break;
      default:
        if (status.startsWith("Custom:")) {
          subject = "Custom Status Update";
          EmailTemplate = CustomStatus;
          templateData = {
            name: employeeName,
            date: `${scheduleDayOfWeek}, ${schedule_date}`,
            status: status.replace("Custom:", "").trim(),
          };
        } else {
          throw new Error("Invalid status");
        }
    }

    try {
      await resend.emails.send({
        from: `TGR <scheduling@${process.env.RESEND_DOMAIN}>`,
        to: [email],
        subject: subject,
        react: EmailTemplate(templateData),
      });
    } catch (emailError: any) {
      console.error("Error sending email:", emailError.message);
      return NextResponse.json(
        { error: "Error sending email", details: emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Schedule updated and email sent successfully",
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
