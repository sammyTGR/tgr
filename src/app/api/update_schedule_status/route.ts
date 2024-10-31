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

export async function POST(request: Request) {
  const { employee_id, schedule_date, status, start_time, end_time } =
    await request.json();

  if (!employee_id || !schedule_date || typeof status !== "string") {
    console.error("Invalid request:", { employee_id, schedule_date, status });
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // Convert the schedule_date to Pacific Time
    const utcDate = parseISO(schedule_date);
    // Convert to Pacific Time for database operations
    const pacificDate = toZonedTime(utcDate, timeZone);
    const formattedScheduleDate = formatTZ(pacificDate, "yyyy-MM-dd", {
      timeZone,
    });

    // Format date for email using the helper function
    const emailFormattedDate = formatDateWithDay(schedule_date);


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
      console.error("Failed to fetch employee contact_info:", employeeError);
      return NextResponse.json(
        { error: "Failed to fetch employee contact_info" },
        { status: 500 }
      );
    }

    const email = employeeData.contact_info;
    const employeeName = employeeData.name;
    const zonedDate = toZonedTime(parseISO(schedule_date), timeZone);
    const formattedDate = format(pacificDate, "EEEE, MMMM d yyyy");
    

     // Prepare email data
     let emailData: {
      email: string;
      subject: string;
      templateName: string;
      templateData: any;
    };

    if (status.startsWith("Late Start")) {
      const lateStartTime = status.split("Late Start ")[1];
      emailData = {
        email: employeeData.contact_info,
        subject: "Late Start Notification",
        templateName: "LateStart",
        templateData: {
          name: employeeData.name,
          date: emailFormattedDate,
          startTime: lateStartTime,
        },
      };
    } else {
      switch (status) {
        case "added_day":
          emailData = {
            email: employeeData.contact_info,
            subject: "New Shift Added to Your Schedule",
            templateName: "ShiftAdded",
            templateData: {
              name: employeeData.name,
              date: emailFormattedDate,
              startTime: start_time,
              endTime: end_time,
            },
          };
          break;
        case "updated_shift":
          emailData = {
            email: employeeData.contact_info,
            subject: "Your Shift Has Been Updated",
            templateName: "ShiftUpdated",
            templateData: {
              name: employeeData.name,
              date: emailFormattedDate,
              startTime: start_time,
              endTime: end_time,
            },
          };
          break;
        case "left_early":
          emailData = {
            email: employeeData.contact_info,
            subject: "Left Early Notification",
            templateName: "LeftEarly",
            templateData: {
              name: employeeData.name,
              date: emailFormattedDate,
            },
          };
          break;
        case "called_out":
          emailData = {
            email: employeeData.contact_info,
            subject: "Called Out Confirmation",
            templateName: "CalledOut",
            templateData: {
              name: employeeData.name,
              date: emailFormattedDate,
            },
          };
          break;
        default:
          if (status.startsWith("Custom:")) {
            emailData = {
              email: employeeData.contact_info,
              subject: "Schedule Update",
              templateName: "CustomStatus",
              templateData: {
                name: employeeData.name,
                date: emailFormattedDate,
                status: status.replace("Custom:", "").trim(),
              },
            };
          } else {
            throw new Error("Invalid status");
          }
      }
    }

    // Replace the fetch call with direct email sending
    try {
      let emailTemplate;
      const fromEmail = `TGR <scheduling@${process.env.RESEND_DOMAIN}>`;

      // Select the correct email template based on status
      switch (emailData.templateName) {
        case "LateStart":
          emailTemplate = LateStart(emailData.templateData);
          break;
        case "ShiftAdded":
          emailTemplate = ShiftAdded(emailData.templateData);
          break;
        case "ShiftUpdated":
          emailTemplate = ShiftUpdated(emailData.templateData);
          break;
        case "LeftEarly":
          emailTemplate = LeftEarly(emailData.templateData);
          break;
        case "CalledOut":
          emailTemplate = CalledOut(emailData.templateData);
          break;
        case "CustomStatus":
          emailTemplate = CustomStatus(emailData.templateData);
          break;
        default:
          throw new Error("Invalid template name");
      }

      const resendRes = await resend.emails.send({
        from: fromEmail,
        to: [emailData.email],
        subject: emailData.subject,
        react: emailTemplate,
      });

      if (resendRes.error) {
        throw new Error(resendRes.error.message);
      }

    } catch (emailError: any) {
      console.error("Error sending email:", emailError);
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