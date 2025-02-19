import { type ColumnDef as TanstackColumnDef } from "@tanstack/react-table";

export interface Employee {
  lanid: string;
  department?: string;
  role?: string;
  status?: string;
  contact_info?: string;
}

export interface PointsCalculation {
  id: number;
  category: string;
  error_location: string;
  points_deducted: number;
  error_type: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuditData {
  audits_id: string;
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes: string;
  dros_cancel: string;
  created_at?: string;
  updated_at?: string;
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
  Lanid: string;
  Date: string;
  SubDesc: string;
  CatDesc: string;
  SoldDate: string;
  dros_number: string;
  status: string;
  id: number;
  cancelled_dros: number;
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
  isOperations: boolean;
  minimumDros: number;
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
