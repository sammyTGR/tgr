"use client";

import { useState } from "react";
import TodoData from "./todo-data";
import TodoCheckbox from "./todo-checkbox";
import DeleteTodo from "./delete-todo";
import { Button } from "@/components/ui/button";
import { Pencil1Icon, Cross2Icon } from "@radix-ui/react-icons";
import type { Todo } from "@/lib/interface";
import { format } from "date-fns";

export default function Todo({ todo }: { todo: Todo }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-1 flex items-center gap-2">
        <TodoCheckbox todo={todo} />
        <div
          className={`flex-1 flex items-center gap-2 ${
            todo.is_complete ? "line-through text-gray-500" : ""
          }`}
        >
          <TodoData todo={todo} />
          {todo.is_complete && todo.completed_at && (
            <span className="text-sm text-gray-500 ml-2">
              (Completed: {format(new Date(todo.completed_at), "MMM d")})
            </span>
          )}
        </div>
      </div>
      <div
        className={`transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => {
            /* Handle edit */
          }}
        >
          <Pencil1Icon className="h-4 w-4" />
        </Button>
        <DeleteTodo id={todo.id} />
      </div>
    </div>
  );
}
