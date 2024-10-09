"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { onCheckChange } from "./actions";
import type { Todo } from "@/lib/interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function TodoCheckbox({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (todoId: number) => onCheckChange(todo),
    onMutate: async (todoId: number) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) =>
          t.id === todo.id ? { ...t, is_complete: !t.is_complete } : t
        )
      );
      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["todos"], context?.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <Checkbox
      className="mt-0.5 w-5 h-5"
      id={todo.id.toString()}
      checked={todo.is_complete}
      onCheckedChange={() => mutation.mutate(todo.id)}
    />
  );
}
