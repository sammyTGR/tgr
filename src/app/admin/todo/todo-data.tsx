"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { editTodo } from "./actions";
import { Input } from "@/components/ui/input";
import type { Todo } from "@/lib/interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function TodoData({ todo }: { todo: Todo }) {
  const [description, setDescription] = useState(todo.task);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setDescription(todo.task);
  }, [todo.task]);

  const mutation = useMutation({
    mutationFn: () => editTodo({ ...todo, task: description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setIsEditing(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      mutation.mutate();
    }
  };

  const handleBlur = () => {
    if (description !== todo.task) {
      mutation.mutate();
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        className="p-0 border-none focus-visible:ring-transparent"
        value={description}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus
      />
    );
  }

  return (
    <span
      className="flex-grow cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      {todo.task}
    </span>
  );
}
