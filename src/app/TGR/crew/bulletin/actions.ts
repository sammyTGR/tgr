"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export type BulletinPost = {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by: string;
  requires_acknowledgment: boolean;
  required_departments: string[];
};

export type Acknowledgment = {
  id: number;
  post_id: number;
  employee_id: number;
  employee_name: string;
  summary: string;
  acknowledged_at: string;
};

// Get all bulletin posts
export async function getBulletinPosts(): Promise<BulletinPost[]> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from("bulletin_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Get all acknowledgments
export async function getAcknowledgments(): Promise<Acknowledgment[]> {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from("bulletin_acknowledgments")
    .select("*")
    .order("acknowledged_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Create a new acknowledgment
export async function createAcknowledgment(
  postId: number,
  employeeId: number,
  employeeName: string,
  summary: string
): Promise<void> {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from("bulletin_acknowledgments").insert({
    post_id: postId,
    employee_id: employeeId,
    employee_name: employeeName,
    summary,
  });

  if (error) throw new Error(error.message);
}
