// In your fetchAuditData.ts
"use server";
import supabase from "../../../supabase/lib/supabaseServer";
import { AuditData } from './columns';
// import { useState } from 'react';

// const fetchData = async (): Promise<AuditData[]> => {
//     const { data, error } = await supabase
//         .from('Auditsinput')
//         .select('*');
//     if (error) throw new Error(error.message);
//     return data as AuditData[];
// }

// export default fetchData

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