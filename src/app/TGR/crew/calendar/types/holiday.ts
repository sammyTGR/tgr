// types/holiday.ts
export interface Holiday {
    id: number;
    name: string;
    date: string;
    is_full_day: boolean;
    repeat_yearly: boolean;
    created_at: string;
  }