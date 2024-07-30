import { z } from "zod";

export const scheduleData = z.object({
  id: z.number(),
  employee_id: z.number(),
  day_of_week: z.string(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  user_uuid: z.string().uuid(),
});

export type ScheduleData = z.infer<typeof scheduleData>;
