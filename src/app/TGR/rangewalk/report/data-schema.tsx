import { z } from "zod";

export const rangeWalkDataSchema = z.object({
  id: z.number(),
  user_uuid: z.string(),
  user_name: z.string(),
  date_of_walk: z.string(),
  lanes: z.string(),
  lanes_with_problems: z.string(),
  description: z.string(),
  status: z.string().optional().nullable(), // New field
  repair_notes: z.string().optional().nullable(), // New field
  repair_notes_user: z.string().optional().nullable(), // New field
});

export type RangeWalkData = z.infer<typeof rangeWalkDataSchema>;
