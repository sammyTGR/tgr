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
import { format as formatTZ, toZonedTime } from "date-fns-tz";

const resend = new Resend(process.env.RESEND_API_KEY);
const timeZone = "America/Los_Angeles";

const formatDateWithDay = (dateString: string) => {
  // Parse the date and explicitly handle it as UTC
  const date = parseISO(dateString);
  // Convert to Pacific Time
  const pacificDate = toZonedTime(date, timeZone);
  return format(pacificDate, "EEEE, MMMM d, yyyy");
};

// Add interface for email payload
interface EmailPayload {
  email: string;
  subject: string;
  templateName: string;
  templateData: {
    name: string;
    date: string;
    startTime?: string;
    status?: string;
  };
}

export async function POST(request: Request) {
  const { employee_id, schedule_date, status } = await request.json();

  try {
    // Convert the schedule_date to Pacific Time
    const utcDate = parseISO(schedule_date);
    // Convert to Pacific Time for database operations
    const pacificDate = toZonedTime(utcDate, timeZone);
    const formattedScheduleDate = formatTZ(pacificDate, "yyyy-MM-dd", {
      timeZone,
    });

    // Check if the date exists in the schedules table
    const { data: scheduleData, error: scheduleFetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("schedule_date", schedule_date);

    // console.log("Found schedules:", scheduleData);

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

    if (!scheduleData) {
      // Insert new schedule if it doesn't exist
      const { error: scheduleInsertError } = await supabase
        .from("schedules")
        .insert({ employee_id, formattedScheduleDate, status });

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
      // Update existing schedule
      const { error: scheduleUpdateError } = await supabase
        .from("schedules")
        .update({ status })
        .eq("employee_id", employee_id)
        .eq("schedule_date", schedule_date);

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

    // Fetch employee email from contact_info assuming it's plain text
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("contact_info, name")
      .eq("employee_id", employee_id)
      .single();

    if (employeeError || !employeeData || !employeeData.contact_info) {
      throw new Error("Failed to fetch employee data");
    }

    // Format the date correctly for the email
    const formattedDate = formatDateWithDay(schedule_date);

    // Initialize emailPayload with proper typing
    let emailPayload: EmailPayload = {
      email: employeeData.contact_info,
      subject: "", // Will be set based on status
      templateName: "", // Will be set based on status
      templateData: {
        name: employeeData.name,
        date: formattedDate,
      },
    };

    // Set email subject and template based on status
    if (status.startsWith("Late Start")) {
      emailPayload = {
        ...emailPayload,
        subject: "Late Start Notification",
        templateName: "LateStart",
        templateData: {
          ...emailPayload.templateData,
          startTime: status.split("Late Start ")[1],
        },
      };
    } else if (status === "called_out") {
      emailPayload = {
        ...emailPayload,
        subject: "Called Out Confirmation",
        templateName: "CalledOut",
      };
    } else if (status === "left_early") {
      emailPayload = {
        ...emailPayload,
        subject: "Left Early Notification",
        templateName: "LeftEarly",
      };
    } else if (status.startsWith("Custom:")) {
      emailPayload = {
        ...emailPayload,
        subject: "Schedule Update",
        templateName: "CustomStatus",
        templateData: {
          ...emailPayload.templateData,
          status: status.replace("Custom:", "").trim(),
        },
      };
    }

    // Send email using the send_email API
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL}/api/send_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    return NextResponse.json({
      message: "Schedule updated and email sent successfully",
    });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
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