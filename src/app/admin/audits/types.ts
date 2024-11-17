// types.ts
export interface Employee {
    lanid: string;
    department?: string;
  }
  
  export interface PointsCalculation {
    id: number;
    category: string;
    error_location: string;
    points_deducted: number;
    created_at?: string;
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
    Qualified: boolean;
    DisqualificationReason: string;
    isDivider?: boolean;
  }
  
  export interface CellProps {
    value: any;
    row: {
      original: {
        Qualified: boolean;
        isDivider?: boolean;
        [key: string]: any;
      };
    };
  }
  
  export interface ColumnDef {
    Header: string;
    accessor: string;
    Cell?: (props: CellProps) => JSX.Element;
  }
  
  export type QueryKeys = 
    | ['employees'] 
    | ['audits'] 
    | ['pointsCalculation']
    | ['summaryData', string | null, boolean, Date | null];
  
  export interface WeightedScoringMetrics {
    salesData: any[];
    auditData: any[];
    pointsCalculation: PointsCalculation[];
    isOperations: boolean;
    minimumDros: number;
  }