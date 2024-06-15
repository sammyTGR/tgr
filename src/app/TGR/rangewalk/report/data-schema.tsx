import { z } from "zod";

export const rangeWalkDataSchema = z.object({
  id: z.string().optional().nullable(),
  user_uuid: z.string(),
  user_name: z.string(),
  date_of_walk: z.string(),
  lanes: z.string(),
  lanes_with_problems: z.string(),
  description: z.string(),
  created_at: z.string(),
  role: z.string(),
});

export type RangeWalkData = z.infer<typeof rangeWalkDataSchema>;
