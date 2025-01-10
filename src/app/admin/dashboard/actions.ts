"use server";

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export interface Employee {
  employee_id: number;
  name: string;
  last_name: string;
  avatar_url: string | null;
  pay_rate: string;
  status: string;
  extension: number | null;
  role: string;
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
      .select(
        "employee_id, name, last_name, pay_rate, status, avatar_url, extension, role"
      )
      .eq("status", "active");

    // Restrict view for admin, super admin, and auditor
    if (role === "admin" || role === "super admin" || role === "auditor") {
      query = query
        .neq("role", "admin")
        .neq("role", "super admin")
        .neq("role", "auditor")
        .neq("role", "dev")
        .neq("role", "ceo");
    } else if (role === "ceo") {
      // CEO can see everything except devs and other ceos
      query = query.neq("role", "dev").neq("role", "ceo");
    } else if (role === "dev") {
      // Devs can see everything
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
