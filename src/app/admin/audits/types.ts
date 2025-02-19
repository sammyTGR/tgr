import { type ColumnDef as TanstackColumnDef } from "@tanstack/react-table";

export interface Employee {
  employee_id: number;
  name: string | null;
  department: string | null;
  role: string | null;
  contact_info: string | null;
  user_uuid: string | null;
  lanid: string | null;
  status: string | null;
  pay_type: string | null;
  avatar_url: string | null;
  rank: number | null;
  is_online: boolean | null;
  sick_time_used: number;
  pay_rate: number | null;
  hire_date: string | null;
  birthday: string | null;
  vacation_time: number | null;
  phone_number: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  promotion_date: string | null;
  last_name: string | null;
  term_date: string | null;
  extension: number | null;
}

export interface PointsCalculation {
  id: string;
  category: string;
  error_location: string;
  points_deducted: number;
  error_type: string;
  description?: string;
}

export interface AuditData {
  audits_id: string;
  dros_number: string | null;
  salesreps: string | null;
  audit_type: string | null;
  trans_date: string | null;
  audit_date: string | null;
  error_location: string | null;
  error_details: string | null;
  error_notes: string | null;
  dros_cancel: string | null;
  user_id: string | null;
  user_uuid: string | null;
  employee_lanid: string | null;
}

export interface SummaryData {
  Lanid: string;
  Department: string;
  TotalDros: number | null;
  MinorMistakes: number | null;
  MajorMistakes: number | null;
  CancelledDros: number | null;
  WeightedErrorRate: number | null;
  TotalWeightedMistakes: number | null;
  PointsDeducted?: number;
  TotalPoints?: number;
  ErrorRate?: number;
  Qualified: boolean;
  DisqualificationReason: string;
  isDivider?: boolean;
}

export interface SalesData {
  id: number;
  Desc: string | null;
  CatDesc: string | null;
  SubDesc: string | null;
  SoldDate: string | null;
  Lanid: string | null;
  Qty: number | null;
  SoldPrice: number | null;
  Cost: number | null;
  Margin: number | null;
  MarginPerc: string | null;
  Cat: number | null;
  Sub: number | null;
  total_net: number | null;
  total_gross: number | null;
}

export interface AuditFilters {
  startDate?: string;
  endDate?: string;
  lanid?: string;
  auditType?: string;
}

export interface AuditCategory {
  id: string;
  name: string;
  guidelines: string;
  created_at?: string;
  updated_at?: string;
}

export interface CellProps<T = any> {
  value: any;
  row: {
    original: T & {
      Qualified?: boolean;
      isDivider?: boolean;
      [key: string]: any;
    };
  };
}

export type ColumnDef<T = any> = TanstackColumnDef<T>;

export type QueryKeys =
  | ["user"]
  | ["employee"]
  | ["employees"]
  | ["audits"]
  | ["historicalAudits", string | null]
  | ["pointsCalculation"]
  | ["summaryData", string | null, boolean, Date | null]
  | ["audit-categories"]
  | ["realtime-subscription"]
  | ["edit-modal-state"]
  | ["delete-dialog-state"];

export interface WeightedScoringMetrics {
  salesData: SalesData[];
  auditData: AuditData[];
  pointsCalculation: PointsCalculation[];
  isOperations?: boolean;
  minimumDros?: number;
}

export interface ModalState {
  isOpen: boolean;
  selectedAudit: AuditData | null;
}

export interface DeleteDialogState {
  isOpen: boolean;
  auditId: string | null;
}

export interface PageParams {
  tab?: string;
  lanid?: string;
  date?: string;
  showAll?: string;
  search?: string;
}
