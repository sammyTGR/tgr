"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import AddFirearmDialog from "./add-firearm-dialog";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { DatabaseFirearm } from "./types";

export default function BannedFirearmsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const response = await fetch("/api/getUserRole");
      if (!response.ok) {
        throw new Error("Failed to fetch user role");
      }
      const data = await response.json();
      return data;
    },
  });

  const { data: firearms, isLoading } = useQuery({
    queryKey: ["banned-firearms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banned_firearms")
        .select("*")
        .order("manufacturer", { ascending: true });

      if (error) throw error;
      return data as unknown as DatabaseFirearm[];
    },
  });

  const canAddFirearm = userRole?.role === "admin" || userRole?.role === "dev";

  const addFirearmMutation = useMutation({
    mutationFn: async (
      newFirearm: Omit<
        DatabaseFirearm,
        "firearm_id" | "created_at" | "updated_at"
      >
    ) => {
      const { data, error } = await supabase
        .from("banned_firearms")
        .insert([newFirearm])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banned-firearms"] });
      toast.success("Firearm added successfully");
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Error adding firearm:", error);
      toast.error("Failed to add firearm");
    },
  });

  return (
    <RoleBasedWrapper
      allowedRoles={[
        "super admin",
        "dev",
        "admin",
        "user",
        "auditor",
        "gunsmith",
      ]}
    >
      <div className="container mx-auto max-w-full">
        <h1 className="text-2xl font-bold ">Banned Firearms Database</h1>
        <div className="flex justify-end mb-5">
          {canAddFirearm && (
            <Button
              variant="gooeyRight"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircledIcon className="mr-2 h-4 w-4" />
              Add Firearm
            </Button>
          )}
        </div>
        {isLoading ? (
          <p>Loading firearms database...</p>
        ) : (
          <DataTable columns={columns} data={firearms || []} />
        )}
        <AddFirearmDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAdd={(newFirearm) => addFirearmMutation.mutate(newFirearm)}
        />
      </div>
    </RoleBasedWrapper>
  );
}
