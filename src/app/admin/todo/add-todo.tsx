"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addTodo } from "./actions";
import { PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AddTodo() {
  const ref = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (formData: FormData) => addTodo(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      ref.current?.reset();
    },
  });

  return (
    <form
      className="flex outline-none items-center gap-2"
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const task = formData.get("task") as string;
        mutation.mutate(formData);
      }}
    >
      <Button type="submit" className="min-w-5 h-5 p-0 rounded-sm">
        <PlusIcon className="w-4 h-4" />
      </Button>
      <Input
        id="task"
        className="p-0 border-none focus-visible:ring-transparent"
        name="task"
        placeholder="Add new task"
        required
      />
    </form>
  );
}
