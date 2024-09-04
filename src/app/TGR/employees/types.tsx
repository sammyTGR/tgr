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
  hire_date: string | null;
  birthday: string | null;
}

interface ReferenceSchedule {
  employee_id: number;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  name: string; // Add this line
}
