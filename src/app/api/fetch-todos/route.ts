import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export interface Todo {
  id: number;
  user_id: string;
  task: string | null;
  is_complete: boolean;
  inserted_at: string;
}

export async function GET() {
  try {
    const supabase = createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch todos for the current user
    const { data, error } = await supabase
      .from("todos")
      .select("id, user_id, task, is_complete, inserted_at")
      .eq("user_id", user.id)
      .order("inserted_at", { ascending: false });

    if (error) {
      console.error("Error fetching todos:", error);
      throw new Error(error.message);
    }

    return NextResponse.json(data as Todo[]);
  } catch (error: any) {
    console.error("Error in fetch-todos API route:", error);
    return NextResponse.json({ error: "Failed to fetch todos", details: error.message }, { status: 500 });
  }
}