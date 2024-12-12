export interface DatabaseFirearm {
  firearm_id: string;
  type: "rifle" | "handgun";
  manufacturer: string;
  model: string;
  variations: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditingFirearm {
  firearm_id: string;
  type: "rifle" | "handgun";
  manufacturer: string;
  model: string;
  variations: string;
  created_at: string;
  updated_at: string;
}
