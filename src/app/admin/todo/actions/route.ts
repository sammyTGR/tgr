"use server";

import { editTodo as editTodoAction } from "../actions";
import type { Todo } from "@/lib/interface";

export async function editTodo(todo: Todo) {
  return await editTodoAction(todo);
}