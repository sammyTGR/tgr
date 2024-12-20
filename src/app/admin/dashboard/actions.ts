"use server";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export interface Employee {
  employee_id: number;
  name: string;
  pay_rate: string;
  status: string;
}

const supabase = createClient();
export const fetchEmployees = async (role: string | null) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("employees")
      .select("employee_id, name, pay_rate, status")
      .eq("status", "active");

    // If the user's role is 'admin', filter out other 'admin' and 'super admin'
    if (role === "admin" || role === "auditor") {
      query = query
        .neq("role", "admin")
        .neq("role", "super admin")
        .neq("role", "dev");
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching employees:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
