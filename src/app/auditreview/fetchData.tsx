// In your fetchAuditData.ts
"use server";
import supabase from "../../../supabase/lib/supabaseServer";
import { AuditData } from './columns';

const fetchData = async (): Promise<AuditData[]> => {
    const client = await supabase();
    console.log("Initiating query for dates greater than or equal to 2024-01-01");
    const { data, error } = await client
      .from('Auditsinput')
      .select('*');
  
    if (error) {
      console.error("Error fetching data:", error.message);
      throw new Error(error.message);
    }
    
    console.log("Data fetched:", data);
    return data as AuditData[];
  };
export default fetchData;