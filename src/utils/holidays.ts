// utils/holidays.ts
import { isSameDay, parseISO } from 'date-fns';
import { Holiday } from '../app/TGR/crew/calendar/types/holiday';
import { supabase } from "@/utils/supabase/client";

export const isHoliday = async (date: Date): Promise<Holiday | null> => {
  try {
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('*');

    if (error) {
      console.error('Error fetching holidays:', error);
      return null;
    }

    if (!holidays) return null;

    return holidays.find(holiday => {
      try {
        const holidayDate = parseISO(holiday.date);
        
        // For yearly repeating holidays, only compare month and day
        if (holiday.repeat_yearly) {
          return (
            holidayDate.getMonth() === date.getMonth() &&
            holidayDate.getDate() === date.getDate()
          );
        }
        
        // For one-time holidays, compare exact dates
        return isSameDay(holidayDate, date);
      } catch (err) {
        console.error('Error processing holiday date:', err);
        return false;
      }
    }) || null;
  } catch (err) {
    console.error('Error in isHoliday function:', err);
    return null;
  }
};