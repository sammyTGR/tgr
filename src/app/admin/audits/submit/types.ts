export interface AuditData {
  audits_id?: string; // Make this optional
  id?: string; // Add this field
  dros_number: string | null;
  salesreps: string | null;
  audit_type: string | null;
  trans_date: string | null;
  audit_date: string | null;
  error_location: string | null;
  error_details: string | null;
  error_notes: string | null;
  dros_cancel: string | null;
  label?: string | null;
}
