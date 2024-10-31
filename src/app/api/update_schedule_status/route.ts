import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Resend } from "resend";
import LateStart from "../../../../emails/LateStart";
import ShiftAdded from "../../../../emails/ShiftAdded";
import ShiftUpdated from "../../../../emails/ShiftUpdated";
import LeftEarly from "../../../../emails/LeftEarly";
import CalledOut from "../../../../emails/CalledOut";
import CustomStatus from "../../../../emails/CustomStatus";

const resend = new Resend(process.env.RESEND_API_KEY);
const timeZone = "America/Los_Angeles";

const formatDateWithDay = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, "EEEE, MMMM d, yyyy");
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
    const pacificDate = toZonedTime(parseISO(schedule_date), timeZone);
    const formattedScheduleDate = format(pacificDate, "yyyy-MM-dd");
    const emailFormattedDate = formatDateWithDay(schedule_date);

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

    if (!scheduleData || scheduleData.length === 0) {
      return NextResponse.json(
        { error: "No schedule found for this date" },
        { status: 404 }
      );
    }

    // Update existing schedule
    const { error: scheduleUpdateError } = await supabase
      .from("schedules")
      .update({ status, start_time, end_time })
      .eq("employee_id", employee_id)
      .eq("schedule_date", formattedScheduleDate);

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

    // Fetch employee data
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("contact_info, name")
      .eq("employee_id", employee_id)
      .limit(1);

    if (employeeError || !employeeData || employeeData.length === 0) {
      console.error("Failed to fetch employee data:", employeeError);
      return NextResponse.json(
        { error: "Failed to fetch employee data" },
        { status: 500 }
      );
    }

    const employee = employeeData[0];

    // Prepare email data
    let subject: string;
    let EmailTemplate: React.ComponentType<any>;
    let templateData: any;

    if (status.startsWith("Late Start")) {
      const lateStartTime = status.split("Late Start ")[1];
      subject = "Late Start Notification";
      EmailTemplate = LateStart;
      templateData = {
        name: employee.name,
        date: emailFormattedDate,
        startTime: lateStartTime,
      };
    } else {
      switch (status) {
        case "added_day":
          subject = "New Shift Added to Your Schedule";
          EmailTemplate = ShiftAdded;
          templateData = {
            name: employee.name,
            date: emailFormattedDate,
            startTime: start_time,
            endTime: end_time,
          };
          break;
        case "updated_shift":
          subject = "Your Shift Has Been Updated";
          EmailTemplate = ShiftUpdated;
          templateData = {
            name: employee.name,
            date: emailFormattedDate,
            startTime: start_time,
            endTime: end_time,
          };
          break;
        case "left_early":
          subject = "Left Early Notification";
          EmailTemplate = LeftEarly;
          templateData = {
            name: employee.name,
            date: emailFormattedDate,
          };
          break;
        case "called_out":
          subject = "Called Out Confirmation";
          EmailTemplate = CalledOut;
          templateData = {
            name: employee.name,
            date: emailFormattedDate,
          };
          break;
        default:
          if (status.startsWith("Custom:")) {
            subject = "Schedule Update";
            EmailTemplate = CustomStatus;
            templateData = {
              name: employee.name,
              date: emailFormattedDate,
              status: status.replace("Custom:", "").trim(),
            };
          } else {
            throw new Error("Invalid status");
          }
      }
    }

    // Send email directly using Resend
    try {
      await resend.emails.send({
        from: `TGR <scheduling@${process.env.RESEND_DOMAIN}>`,
        to: [employee.contact_info],
        subject,
        react: EmailTemplate(templateData),
      });
    } catch (emailError: any) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        { error: "Error sending email", details: emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Schedule updated and email sent successfully",
      debug: {
        originalDate: schedule_date,
        formattedDate: emailFormattedDate,
        timezone: timeZone,
      },
    });
  } catch (err) {
    console.error("Unexpected error updating schedule status:", err);
    return NextResponse.json(
      { error: "Unexpected error updating schedule status" },
      { status: 500 }
    );
  }
}