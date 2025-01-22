export interface Domain {
  id: number;
  domain: string;
}

export interface Suggestion {
  id: number;
  suggestion: string;
  created_by: string;
  created_at: string | null;
  is_read: boolean | null;
  replied_by: string | null;
  replied_at: string | null;
  reply: string | null;
  email: string | null;
  replierName?: string | null;
}

export interface Certificate {
  id: number;
  name: string;
  certificate: string;
  action_status: string;
  expiration: Date | null;
}

export interface ReplyStates {
  [key: number]: string;
}

export interface MetricData {
  metric: string;
  value: string;
}

export interface SalesMetrics {
  averageMonthlyGrossRevenue: number;
  averageMonthlyNetRevenue: number;
  topPerformingCategories: { category: string; revenue: number }[];
  peakHours: { hour: number; transactions: number; formattedHour: string }[];
  customerFrequency: { visits: string; percentage: number }[];
}
