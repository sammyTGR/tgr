import { UUID } from "crypto";

// types.ts or a similar file
export interface AuditData {
    id: UUID;
    dros_number: string;
    salesreps: string;
    audit_type: string;
    trans_date: string;
    audit_date?: string;
    error_location: string;
    error_details: string;
    error_notes?: string;
    dros_cancel: boolean;
}
