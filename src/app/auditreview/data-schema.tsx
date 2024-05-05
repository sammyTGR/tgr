import { z } from "zod"

export const auditData = z.object({
    label: z.string().optional().nullable(),
    id: z.string().optional().nullable(),
    dros_number: z.string(),
    salesreps: z.string(),
    audit_type: z.string(),
    trans_date: z.string(),
    audit_date: z.string(),
    error_location: z.string(),
    error_details: z.string(),
    error_notes: z.string().optional().nullable(),
    dros_cancel: z.string().nullable(),
})

export type Task = z.infer<typeof auditData>