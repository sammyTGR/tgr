import { z } from "zod";

export const scheduleData = z.object({
  id: z.number(),
  employee_id: z.number(),
  day_of_week: z.string(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  user_uuid: z.string().uuid(),
});

export const timesheetData = z.object({
  id: z.number(),
  employee_id: z.number(),
  start_time: z.string(),
  lunch_start: z.string().nullable(),
  lunch_end: z.string().nullable(),
  end_time: z.string().nullable(),
  total_hours: z.string().nullable(),
  created_at: z.string().nullable(),
  employee_name: z.string().nullable(),
  event_date: z.string().nullable(),
});

export type ScheduleData = z.infer<typeof scheduleData>;
export type TimesheetData = z.infer<typeof timesheetData>;
