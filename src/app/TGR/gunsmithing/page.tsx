"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { FirearmsMaintenanceData, columns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import MaintenanceFrequencyForm from "./MaintenanceFrequencyForm";
import { cycleFirearms } from "@/utils/cycleFirearms"; // Import the utility function

const words = "Gunsmithing Maintenance";

export default function GunsmithingMaintenance() {
  const [data, setData] = useState<FirearmsMaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);

  const fetchUserRoleAndUuid = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error fetching user:", userError.message);
      return;
    }

    const user = userData.user;
    setUserUuid(user?.id || "");

    try {
      const { data: roleData, error: roleError } = await supabase
        .from("employees")
        .select("role")
        .eq("user_uuid", user?.id)
        .single();

      if (roleError || !roleData) {
        console.error(
          "Error fetching role:",
          roleError?.message || "No role found"
        );
        return;
      }

      setUserRole(roleData.role);
    } catch (error) {
      console.error("Unexpected error fetching role:", error);
    }
  }, []);

  useEffect(() => {
    fetchUserRoleAndUuid();
  }, [fetchUserRoleAndUuid]);

  const fetchFirearmsMaintenanceData = useCallback(async () => {
    const { data, error } = await supabase
      .from("firearms_maintenance")
      .select("*");

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }

    // Separate handguns and long guns
    const handguns = data.filter(
      (item: FirearmsMaintenanceData) => item.firearm_type === "handgun"
    );
    const longGuns = data.filter(
      (item: FirearmsMaintenanceData) => item.firearm_type === "long gun"
    );

    // Cycle through the lists to get 13 of each
    const cycledHandguns = cycleFirearms(handguns, 13);
    const cycledLongGuns = cycleFirearms(longGuns, 13);

    return [...cycledHandguns, ...cycledLongGuns];
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchFirearmsMaintenanceData();
      setData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  }, [fetchFirearmsMaintenanceData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (id: number, status: string | null) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id
          ? { ...item, status: status !== null ? status : "" }
          : item
      )
    );
  };

  const handleNotesChange = (id: number, notes: string) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, maintenance_notes: notes } : item
      )
    );
  };

  const handleUpdateFrequency = (id: number, frequency: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, maintenance_frequency: frequency } : item
      )
    );
  };

  useEffect(() => {
    const FirearmsMaintenanceTableSubscription = supabase
      .channel("custom-all-firearms-maintenance-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "firearms_maintenance" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((currentData) => [
              payload.new as FirearmsMaintenanceData,
              ...currentData,
            ]);
          } else if (payload.eventType === "UPDATE") {
            setData((currentData) =>
              currentData.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as FirearmsMaintenanceData)
                  : item
              )
            );
          } else {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(FirearmsMaintenanceTableSubscription);
    };
  }, [fetchData]);

  const handleSubmit = async () => {
    try {
      // Update the maintenance notes and status in the database
      for (const firearm of data) {
        await supabase
          .from("firearms_maintenance")
          .update({
            maintenance_notes: firearm.maintenance_notes,
            status: "Completed",
          })
          .eq("id", firearm.id);
      }

      // Generate the new list
      const response = await fetch("/api/firearms-maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "generateNewList", data: { userUuid } }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate new list");
      }

      // Reload the page to show the new list
      location.reload();
    } catch (error) {
      console.error("Failed to submit maintenance list:", error);
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["gunsmith", "admin", "super admin"]}>
      <div className="h-screen flex flex-col">
        <section className="flex-1 flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                <TextGenerateEffect words={words} />
              </h2>
            </div>
          </div>
          <div className="flex-1 flex flex-col space-y-4">
            <div className="rounded-md border flex-1 flex flex-col">
              <div className="relative w-full h-full overflow-auto">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  userRole &&
                  userUuid && (
                    <>
                      <DataTable
                        columns={columns}
                        data={data}
                        userRole={userRole}
                        userUuid={userUuid}
                        onStatusChange={handleStatusChange}
                        onNotesChange={handleNotesChange}
                        onUpdateFrequency={handleUpdateFrequency}
                      />
                    </>
                  )
                )}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Submit Maintenance List
            </button>
          </div>
        </section>
      </div>
    </RoleBasedWrapper>
  );
}
