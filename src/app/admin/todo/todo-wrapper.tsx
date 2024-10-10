"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Todos from "./todos";
import ClearActions from "./clear-actions";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { useFlags } from "flagsmith/react";

const queryClient = new QueryClient();

export default function TodoWrapper() {
  const flags = useFlags(["is_todo_enabled"]);

  return (
    <>
      {flags.is_todo_enabled.enabled ? (
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col max-w-2xl border rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-4 pb-4">
              <CheckCircledIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              <h1 className="font-semibold text-2xl">Todos</h1>
            </div>
            <Todos />
            <ClearActions />
          </div>
        </QueryClientProvider>
      ) : null}
    </>
  );
}
