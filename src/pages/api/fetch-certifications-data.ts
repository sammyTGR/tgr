// src/pages/api/fetch-certifications-data.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "OPTIONS") {
    res.status(200).json({ message: "CORS preflight request success" });
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");

  try {
    const { pageIndex, pageSize, filters, sorting } = req.body;

    let query = supabase
      .from("certifications")
      .select("*", { count: "exact" });

    if (filters && filters.length > 0) {
      filters.forEach((filter: { id: string; value: string }) => {
        if (filter.id === "status" && Array.isArray(filter.value)) {
          query = query.in(filter.id, filter.value);
        } else if (filter.id === "number") {
          query = query.eq(filter.id, filter.value); // Use equality for numeric filtering
        } else {
          query = query.ilike(filter.id, `%${filter.value}%`);
        }
      });
    }

    if (sorting && sorting.length > 0) {
      sorting.forEach((sort: { id: string; desc: boolean }) => {
        query = query.order(sort.id, { ascending: !sort.desc });
      });
    } else {
      query = query.order("expiration", { ascending: false });
    }

    const { data, count, error } = await query.range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    if (error) throw error;

    res.status(200).json({ data, count });
  } catch (error) {
    console.error("Error fetching filtered certifications data:", error);
    res.status(500).json({ error: "Failed to fetch filtered certifications data" });
  }
};
