export interface Employee {
  employee_id: number;
  name: string;
  department: string;
  role: string;
  contact_info: string;
  lanid: string;
  pay_type: string;
  rank: number | null;
  pay_rate: number | null;
}