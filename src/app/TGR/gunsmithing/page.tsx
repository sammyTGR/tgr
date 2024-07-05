"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { FirearmsMaintenanceData, columns } from "./columns";
import { DataTable } from "./data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { cycleFirearms } from "@/utils/cycleFirearms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "sonner";

const words = "Gunsmithing Maintenance";

export default function GunsmithingMaintenance() {
  const [data, setData] = useState<FirearmsMaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userUuid, setUserUuid] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFirearm, setNewFirearm] = useState({
    firearm_type: "handgun",
    firearm_name: "",
    last_maintenance_date: new Date().toISOString(),
    maintenance_frequency: 30,
    maintenance_notes: "",
    status: "New",
    assigned_to: null,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 30; // Set a fixed page size

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

  const fetchFirearmsMaintenanceData = useCallback(async (role: string) => {
    const { data, error } = await supabase
      .from("firearms_maintenance")
      .select("*");

    if (error) {
      console.error("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }

    if (role === "gunsmith") {
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
    }

    // For admin and super admin, return full data
    return data;
  }, []);

  const fetchPersistedData = useCallback(async (userUuid: string) => {
    const { data, error } = await supabase
      .from("persisted_firearms_list")
      .select("*")
      .eq("user_uuid", userUuid)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching persisted data:", error.message);
      throw new Error(error.message);
    }

    return data;
  }, []);

  const persistData = useCallback(
    async (userUuid: string, firearmsList: FirearmsMaintenanceData[]) => {
      const { error } = await supabase
        .from("persisted_firearms_list")
        .upsert({ user_uuid: userUuid, firearms_list: firearmsList });

      if (error) {
        console.error("Error persisting data:", error.message);
        throw new Error(error.message);
      }
    },
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const persistedData = await fetchPersistedData(userUuid || "");
      if (persistedData) {
        setData(persistedData.firearms_list);
      } else {
        const fetchedData = await fetchFirearmsMaintenanceData(userRole || "");
        setData(fetchedData);
        await persistData(userUuid || "", fetchedData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  }, [
    fetchFirearmsMaintenanceData,
    fetchPersistedData,
    persistData,
    userRole,
    userUuid,
  ]);

  useEffect(() => {
    if (userRole && userUuid) {
      fetchData();
    }
  }, [fetchData, userRole, userUuid]);

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

  const handleNotesChange = async (id: number, notes: string) => {
    try {
      const { error } = await supabase
        .from("firearms_maintenance")
        .update({
          maintenance_notes: notes,
          last_maintenance_date: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? {
                ...item,
                maintenance_notes: notes,
                last_maintenance_date: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating maintenance notes:", error);
    }
  };

  const handleUpdateFrequency = (id: number, frequency: number) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, maintenance_frequency: frequency } : item
      )
    );
  };

  const handleAddFirearm = async () => {
    try {
      const { data: newFirearmData, error } = await supabase
        .from("firearms_maintenance")
        .insert([newFirearm])
        .select("*");

      if (error) {
        throw error;
      }

      if (newFirearmData && newFirearmData.length > 0) {
        setData((prevData) => {
          const updatedData = [...prevData, newFirearmData[0]];
          persistData(userUuid || "", updatedData);

          // Calculate the new page index based on the total number of items
          const newPageIndex = Math.floor(updatedData.length / pageSize);

          // Update the pagination state
          setPageIndex(newPageIndex);

          return updatedData;
        });
      } else {
        throw new Error("No data returned from insert operation");
      }

      // Close the dialog after adding the firearm
      setIsDialogOpen(false);
      setNewFirearm({
        firearm_type: "handgun",
        firearm_name: "",
        last_maintenance_date: new Date().toISOString(),
        maintenance_frequency: 30,
        maintenance_notes: "",
        status: "New",
        assigned_to: null,
      });
    } catch (error) {
      console.error("Error adding firearm:", error);
    }
  };

  const handleFirearmInputChange = (e: {
    target: { name: any; value: any };
  }) => {
    const { name, value } = e.target;
    setNewFirearm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      const updatedData = data.filter((item) => item.id !== id);
      setData(updatedData);
      await persistData(userUuid || "", updatedData);
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
          setData((prevData) => {
            let updatedData = [...prevData];

            if (payload.eventType === "INSERT") {
              const exists = prevData.some(
                (item) => item.id === payload.new.id
              );
              if (!exists) {
                updatedData = [
                  payload.new as FirearmsMaintenanceData,
                  ...prevData,
                ];
              }
            } else if (payload.eventType === "UPDATE") {
              updatedData = prevData.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as FirearmsMaintenanceData)
                  : item
              );
            } else if (payload.eventType === "DELETE") {
              updatedData = prevData.filter(
                (item) => item.id !== payload.old.id
              );
            }

            persistData(userUuid || "", updatedData);
            return updatedData;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(FirearmsMaintenanceTableSubscription);
    };
  }, [persistData, userUuid]);

  const handleSubmit = async () => {
    // Check if all firearms have notes and status
    const incompleteFirearms = data.filter(
      (firearm) => !firearm.maintenance_notes || !firearm.status
    );

    if (incompleteFirearms.length > 0) {
      alert(
        "Please ensure all firearms have detailed notes and a status before submitting."
      );
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

      // Clear persisted list after submission
      await supabase
        .from("persisted_firearms_list")
        .delete()
        .eq("user_uuid", userUuid);

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

      // Show a toast notification
      toast.success("Maintenance list submitted successfully!");

      // Reload the page to show the new list
      location.reload();
    } catch (error) {
      console.error("Failed to submit maintenance list:", error);
      toast.error("Failed to submit maintenance list.");
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["gunsmith", "admin", "super admin"]}>
      <div className="h-screen flex flex-col">
        <Toaster position="top-right" />
        <section className="flex-1 flex flex-col space-y-4 p-4">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold">
                <TextGenerateEffect words={words} />
              </h2>
            </div>
            {["admin", "super admin"].includes(userRole || "") && (
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                Add Firearm
              </Button>
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
                        pageIndex={pageIndex} // Pass the pageIndex
                        setPageIndex={setPageIndex} // Pass the setPageIndex
                      />
                    </>
                  )
                )}
              </div>
            </div>
            <Button onClick={handleSubmit} variant="ringHover">
              Submit Maintenance List
            </Button>
          </div>
        </section>

        {isDialogOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white text-black dark:bg-black dark:text-white p-6 rounded shadow-md w-full max-w-lg">
              <h3 className="text-lg font-bold mb-4">Add New Firearm</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Firearm Name
                </label>
                <Input
                  type="text"
                  name="firearm_name"
                  value={newFirearm.firearm_name}
                  onChange={handleFirearmInputChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Firearm Type
                </label>
                <Select
                  onValueChange={(value) =>
                    handleFirearmInputChange({
                      target: { name: "firearm_type", value },
                    })
                  }
                >
                  <SelectTrigger className="w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <SelectValue placeholder="Select firearm type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="handgun">Handgun</SelectItem>
                    <SelectItem value="long gun">Long Gun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Maintenance Frequency (days)
                </label>
                <Input
                  type="number"
                  name="maintenance_frequency"
                  value={newFirearm.maintenance_frequency}
                  onChange={handleFirearmInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Maintenance Notes
                </label>
                <Textarea
                  name="maintenance_notes"
                  value={newFirearm.maintenance_notes}
                  onChange={handleFirearmInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleAddFirearm}>
                  Add Firearm
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedWrapper>
  );
}
