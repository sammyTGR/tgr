// src/pages/api/fetch-employee-sales-data.ts
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/client";

const fetchEmployeeSalesData = async (req: NextApiRequest, res: NextApiResponse) => {
  const { employeeId, pageIndex, pageSize, filters, sorting } = req.body;

  try {
    // Get the employee's Lanid
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("lanid")
      .eq("employee_id", employeeId)
      .single();

    if (employeeError) throw employeeError;

    const lanid = employeeData.lanid;

    // Calculate the date range for the last 3 months
    const currentDate = new Date();
    const startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 3)).toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    console.log(`Fetching sales data from ${startDate} to ${endDate} for Lanid: ${lanid}`);

    let query = supabase
      .from("sales_data")
      .select("*, total_gross, total_net", { count: "exact" })
      .eq("Lanid", lanid)
      .gte("Date", startDate)
      .lte("Date", endDate)
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

    // Apply filters
    filters.forEach((filter: any) => {
      query = query.ilike(filter.id, `%${filter.value}%`);
    });

    // Apply sorting
    sorting.forEach((sort: any) => {
      query = query.order(sort.id, { ascending: !sort.desc });
    });

    // Execute query
    const { data, count, error } = await query;

    if (error) throw error;

    console.log(`Fetched ${data.length} records with count: ${count}`);

    res.status(200).json({ data, count });
  } catch (error) {
    console.error("Failed to fetch employee sales data:", error);
    res.status(500).json({ error: "Failed to fetch employee sales data" });
  }
};

export default fetchEmployeeSalesData;
