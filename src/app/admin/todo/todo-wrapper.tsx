"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Todos from "./todos";
import ClearActions from "./clear-actions";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { useFlags } from "flagsmith/react";

const queryClient = new QueryClient();

interface Flags {
  is_todo_enabled: {
    enabled: boolean;
    value: any;
  };
}

function TodoContent() {
  const flags = useFlags(["is_todo_enabled"]);

  const {
    data: refreshedFlags,
    isLoading,
    error,
  } = useQuery<Flags>({
    queryKey: ["flags"],
    queryFn: () => Promise.resolve(flags as Flags),
    refetchInterval: 30000, // Refetch every 30 seconds
    initialData: flags as Flags,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error refreshing flags</div>;

  if (!flags.is_todo_enabled.enabled) return null;

  return (
    <div className="flex flex-col max-w-2xl border rounded-lg shadow-lg p-4">
      <div className="flex items-center gap-4 pb-4">
        <CheckCircledIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        <h1 className="font-semibold text-2xl">Todos</h1>
      </div>
      <Todos />
      <ClearActions />
    </div>
  );
}

export default function TodoWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoContent />
    </QueryClientProvider>
  );
}
