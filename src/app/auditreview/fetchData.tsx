// In your fetchAuditData.ts
"use server";
import supabase from "../../../supabase/lib/supabaseServer";
import { AuditData } from "./columns";

const fetchData = async (): Promise<AuditData[]> => {
  const client = await supabase();
  const { data, error } = await client.from("Auditsinput").select("*");

  if (error) {
    console.error("Error fetching data:", error.message);
    throw new Error(error.message);
  }

  console.log("Data fetched:", data);
  return data as AuditData[];
};
export default fetchData;
