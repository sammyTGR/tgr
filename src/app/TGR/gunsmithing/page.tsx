"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { FirearmsMaintenanceData, columns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { cycleFirearms } from "@/utils/cycleFirearms";
import { Button } from "@/components/ui/button";

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

  const handleStatusChange = async (id: number, status: string | null) => {
    try {
      const { error } = await supabase
        .from("firearms_maintenance")
        .update({ status })
        .eq("id", id);
  
      if (error) {
        throw error;
      }
  
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? { ...item, status: status !== null ? status : "" }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
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

  const handleAddFirearm = async (firearm: {
    firearm_type: string;
    firearm_name: string;
    last_maintenance_date: string;
    maintenance_frequency: number;
    maintenance_notes: string;
    status: string;
    assigned_to: string | null;
  }) => {
    try {
      const { data, error } = await supabase
        .from("firearms_maintenance")
        .insert([firearm]);

      if (error) {
        throw error;
      }

      setData((prevData) => [...prevData, data![0]]);
    } catch (error) {
      console.error("Error adding firearm:", error);
    }
  };

  const handleDeleteFirearm = async (id: number) => {
    try {
      const { error } = await supabase
        .from("firearms_maintenance")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting firearm:", error);
    }
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
          } else if (payload.eventType === "DELETE") {
            setData((currentData) =>
              currentData.filter((item) => item.id !== payload.old.id)
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
    // Check if all firearms have notes and status
    const incompleteFirearms = data.filter(
      (firearm) => !firearm.maintenance_notes || !firearm.status
    );
  
    if (incompleteFirearms.length > 0) {
      alert("Please ensure all firearms have detailed notes and a status before submitting.");
      return;
    }
  
    try {
      // Update the maintenance notes, status, and last maintenance date in the database
      for (const firearm of data) {
        await supabase
          .from("firearms_maintenance")
          .update({
            maintenance_notes: firearm.maintenance_notes,
            status: firearm.status,
            last_maintenance_date: new Date().toISOString(),
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
            {["admin", "super admin"].includes(userRole || "") && (
              <div>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleAddFirearm({
                      firearm_type: "handgun", // Example data
                      firearm_name: "New Firearm", // Example data
                      last_maintenance_date: new Date().toISOString(),
                      maintenance_frequency: 30,
                      maintenance_notes: "",
                      status: "New",
                      assigned_to: null,
                    })
                  }
                >
                  Add Firearm
                </Button>
              </div>
            )}
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
                        onDeleteFirearm={handleDeleteFirearm} // Pass this prop
                      />
                    </>
                  )
                )}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              variant="ringHover"
            >
              Submit Maintenance List
            </Button>
          </div>
        </section>
      </div>
    </RoleBasedWrapper>
  );
}
