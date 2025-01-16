import { parseISO, format as formatDate } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

const timeZone = "America/Los_Angeles";

export const formatTime = (time: string | null): string => {
  if (!time) return "";
  try {
    // Ensure time is in HH:mm:ss format
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    // Create a full ISO date string
    const date = parseISO(`1970-01-01T${normalizedTime}Z`);
    // Convert to LA timezone
    const zonedDate = toZonedTime(date, timeZone);
    // Format with AM/PM
    return formatInTimeZone(zonedDate, timeZone, "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error, "for time value:", time);
    return "";
  }
};
