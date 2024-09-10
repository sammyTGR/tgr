export interface Employee {
  employee_id: number;
  name: string;
  last_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  department: string;
  role: string;
  contact_info: string;
  lanid: string | null;
  pay_type: string;
  rank: number | null;
  pay_rate: number | null;
  hire_date: string | null;
  birthday: string | null;
  promotion_date: string | null;
}

interface ReferenceSchedule {
  employee_id: number;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  name: string; // Add this line
}
