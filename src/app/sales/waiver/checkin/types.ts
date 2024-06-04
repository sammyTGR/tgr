// src/app/sales/waiver/checkin/types.ts
export interface Waiver {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  occupation?: string | null;
  company?: string | null;
  work_phone?: string | null;
  safety_rules: boolean;
  information_accurate: boolean;
  special_offers?: boolean;
  signature: string;
  handgun_experience: string;
  rifle_experience: string;
  shotgun_experience: string;
  mental_illness: string;
  felony: string;
  misdemeanor: string;
  narcotics: string;
  alcohol_abuse: string;
  created_at: string;
  status: 'checked_in' | 'checked_out';
}
