"use client";

import { Button } from "@/components/ui/button";
import { deleteCompletedTodos, deleteAllTodos } from "./actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ClearActions() {
  const queryClient = useQueryClient();

  const clearCompletedMutation = useMutation({
    mutationFn: deleteCompletedTodos,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: deleteAllTodos,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  return (
    <div className="flex items-center border-t pt-2 justify-between space-x-2">
      <Button
        onClick={() => clearAllMutation.mutate()}
        variant="destructive"
        className="ml-auto"
        size="sm"
      >
        Clear All Items
      </Button>
      <Button
        onClick={() => clearCompletedMutation.mutate()}
        size="sm"
        variant="outline"
      >
        Clear Completed Items
      </Button>
    </div>
  );
}
