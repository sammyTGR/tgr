export interface Employee {
  employee_id: number;
  name: string;
  last_name: string;
  lanid: string | null;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  department: string;
  role: string;
  position: string;
  contact_info: string;
  pay_type: string | null;
  employee_number: number | null;
  pay_rate: number | null;
  hire_date: string | null;
  birthday: string | null;
  promotion_date: string | null;
  status: string | null;
  term_date: string | null;
  extension: number | null;
}

export interface ReferenceSchedule {
  employee_id: number;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  name: string;
}
