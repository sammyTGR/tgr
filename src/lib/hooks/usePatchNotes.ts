import { useQuery } from "@tanstack/react-query";

interface PatchNote {
  id: string;
  version: string;
  release_date: string;
  title: string;
  description: string;
  changes: {
    type: "added" | "changed" | "fixed" | "removed";
    items: string[];
  }[];
}

export function usePatchNotes() {
  return useQuery<PatchNote[]>({
    queryKey: ["patch-notes"],
    queryFn: async () => {
      const response = await fetch("/api/patch-notes");
      if (!response.ok) {
        throw new Error("Failed to fetch patch notes");
      }
      return response.json();
    },
  });
}
