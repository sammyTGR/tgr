"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Todo } from "@/lib/interface";

export async function addTodo(formData: FormData) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error("Authentication failed");
    }

    if (!user) {
      throw new Error("User not found");
    }

    const task = formData.get("task");
    if (typeof task !== "string" || task.trim() === "") {
      throw new Error("Invalid task");
    }

    const { error } = await supabase
      .from("todos")
      .insert([
        {
          user_id: user.id,
          task: task.trim(),
          is_complete: false,
          inserted_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting todo:", error);
      throw new Error(error.message);
    }

    revalidatePath("/");
  } catch (error) {
    console.error("Error in addTodo:", error);
    throw error;
  }
}

export async function editTodo(todo: Todo) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("todos")
    .update({ task: todo.task })
    .eq("id", todo.id)
    .eq("user_id", user?.id)
    .select();

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTodo(id: number) {
  const supabase = createClient();

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function deleteCompletedTodos() {
  const supabase = createClient();

  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("is_complete", true);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function deleteAllTodos() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("user_id", user?.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function onCheckChange(todo: Todo) {
  try {
    const supabase = createClient();

    if (!todo || typeof todo.id === "undefined") {
      throw new Error("Invalid todo object");
    }

    const completed_at = !todo.is_complete ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("todos")
      .update({ 
        is_complete: !todo.is_complete,
        completed_at: completed_at
      })
      .eq("id", todo.id)
      .select();

    if (error) {
      console.error("Error updating todo:", error);
      throw new Error(error.message);
    }

    revalidatePath("/");
  } catch (error) {
    console.error("Error in onCheckChange:", error);
    throw error;
  }
}
