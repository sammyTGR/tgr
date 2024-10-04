"use client";
import { useCallback, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/utils/supabase/client";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { useRole } from "@/context/RoleContext";
import { DataTable } from "../../rangewalk/report/data-table";
import { columns } from "../../rangewalk/report/columns";
import { RangeWalkData } from "../../rangewalk/report/columns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import classNames from "classnames";
import { BarChartIcon } from "@radix-ui/react-icons";
import styles from "./table.module.css";
import RangewalkForm from "@/components/RangewalkForm";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { format, parseISO } from "date-fns";

export default function RangeWalkPage() {
  const { role } = useRole();
  const queryClient = useQueryClient();

  const { data: rangeWalkPopoverState } = useQuery({
    queryKey: ["rangeWalkPopoverState"],
    queryFn: () => false,
    staleTime: Infinity,
  });

  const { data: repairNotesPopoverState } = useQuery({
    queryKey: ["repairNotesPopoverState"],
    queryFn: () => false,
    staleTime: Infinity,
  });

  const { data: repairNotes } = useQuery({
    queryKey: ["repairNotes"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  const { data: selectedRangeWalkId } = useQuery({
    queryKey: ["selectedRangeWalkId"],
    queryFn: () => null as number | null,
    staleTime: Infinity,
  });

  const fetchUserRoleAndUuid = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error fetching user:", userError.message);
      return { userRole: null, userUuid: null };
    }

    const user = userData.user;
    const userUuid = user?.id || "";

    const { data: roleData, error: roleError } = await supabase
      .from("employees")
      .select("role")
      .eq("user_uuid", user?.id)
      .single();

    if (roleError || !roleData) {
      const { data: customerData, error: customerError } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user?.email)
        .single();

      if (customerError || !customerData) {
        console.error(
          "Error fetching role:",
          roleError?.message || customerError?.message
        );
        return { userRole: null, userUuid };
      }

      return { userRole: customerData.role, userUuid };
    } else {
      return { userRole: roleData.role, userUuid };
    }
  }, []);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUserRoleAndUuid,
  });

  const fetchRangeWalkData = async () => {
    const { data, error } = await supabase
      .from("range_walk_reports")
      .select("*")
      .order("date_of_walk", { ascending: false });

    if (error) {
      console.error("Error fetching range walk data:", error.message);
      throw error;
    }
    return data as RangeWalkData[];
  };

  const { data: rangeWalkData, isLoading: dataLoading } = useQuery({
    queryKey: ["rangeWalkData"],
    queryFn: fetchRangeWalkData,
  });

  // Add this useEffect to log the data when it changes
  useEffect(() => {
    if (rangeWalkData) {
      console.log("Fetched rangeWalkData:", rangeWalkData);
    }
  }, [rangeWalkData]);

  // Helper function to format dates consistently
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MM/dd/yyyy");
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
      return dateString; // Return original string if parsing fails
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: string | null;
    }) => {
      const { data, error } = await supabase
        .from("range_walk_reports")
        .update({ status: DOMPurify.sanitize(status || "") })
        .eq("id", id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rangeWalkData"] });
      queryClient.setQueryData(["popoverState"], false);
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({
      id,
      notes,
      userName,
    }: {
      id: number;
      notes: string;
      userName: string;
    }) => {
      const { data, error } = await supabase
        .from("range_walk_reports")
        .update({
          repair_notes: DOMPurify.sanitize(notes),
          repair_notes_user: DOMPurify.sanitize(userName),
        })
        .eq("id", id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rangeWalkData"] });
      queryClient.setQueryData(["popoverState"], false);
    },
  });

  const submitRepairNotesMutation = useMutation({
    mutationFn: async ({
      notes,
      userName,
      rangeWalkId,
    }: {
      notes: string;
      userName: string;
      rangeWalkId: number;
    }) => {
      const { data, error } = await supabase
        .from("range_walk_reports")
        .update({
          repair_notes: DOMPurify.sanitize(notes),
          repair_notes_user: DOMPurify.sanitize(userName),
        })
        .eq("id", rangeWalkId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rangeWalkData"] });
      queryClient.setQueryData(["repairNotesPopoverState"], false);
      queryClient.setQueryData(["repairNotes"], "");
      queryClient.setQueryData(["selectedRangeWalkId"], null);
    },
  });

  const handleStatusChange = (id: number, status: string | null) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleNotesChange = (id: number, notes: string, userName: string) => {
    updateNotesMutation.mutate({ id, notes, userName });
  };

  useQuery({
    queryKey: ["rangeWalkSubscription"],
    queryFn: () => {
      const subscription = supabase
        .channel("custom-all-range-walk-reports-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "range_walk_reports" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["rangeWalkData"] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const handleSubmitRepairNotes = async () => {
    if (!selectedRangeWalkId) {
      console.error("No range walk selected");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const { data: userDetails, error: userError } = await supabase
      .from("employees")
      .select("name")
      .eq("user_uuid", user?.id)
      .single();

    if (userError) {
      console.error("Error fetching user name:", userError.message);
      return;
    }

    const userName = userDetails?.name || user?.email || "Unknown";

    submitRepairNotesMutation.mutate({
      notes: repairNotes || "",
      userName,
      rangeWalkId: selectedRangeWalkId,
    });
  };

  const handleRangeWalkSubmitSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["rangeWalkData"] });
    queryClient.setQueryData(["rangeWalkPopoverState"], false);
  }, [queryClient]);

  const handleRangeWalkPopoverOpenChange = (open: boolean) => {
    queryClient.setQueryData(["rangeWalkPopoverState"], open);
  };

  const handleRepairNotesPopoverOpenChange = (open: boolean) => {
    queryClient.setQueryData(["repairNotesPopoverState"], open);
    if (!open) {
      queryClient.setQueryData(["selectedRangeWalkId"], null);
    }
  };

  const handleRepairNotesChange = (notes: string) => {
    queryClient.setQueryData(["repairNotes"], notes);
  };

  const handleSelectedRangeWalkChange = (id: string) => {
    queryClient.setQueryData(["selectedRangeWalkId"], Number(id));
  };

  return (
    <RoleBasedWrapper
      allowedRoles={["user", "auditor", "admin", "super admin"]}
    >
      <div className="section w-full overflow-hidden max-w-[calc(100vw-90px)] mx-auto">
        <h1 className="text-3xl font-bold ml-8 mt-14 mb-10">
          Range Walks & Repairs
        </h1>
        <div className="col-span-full overflow-hidden mt-14 ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
            {/* Range Walk Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">Range Walk</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Popover
                  open={rangeWalkPopoverState}
                  onOpenChange={handleRangeWalkPopoverOpenChange}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-left font-normal"
                    >
                      Submit Daily Range Walk
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <RangewalkForm
                      onSubmitSuccess={handleRangeWalkSubmitSuccess}
                      onClose={() => handleRangeWalkPopoverOpenChange(false)}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Repair Notes Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">
                  Repair Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Popover
                  open={repairNotesPopoverState}
                  onOpenChange={handleRepairNotesPopoverOpenChange}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-left font-normal"
                    >
                      Enter Repair Notes
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="space-y-4">
                      <Select onValueChange={handleSelectedRangeWalkChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a range walk" />
                        </SelectTrigger>
                        <SelectContent>
                          {rangeWalkData?.map((walk) => (
                            <SelectItem
                              key={walk.id}
                              value={walk.id.toString()}
                            >
                              {formatDate(walk.date_of_walk)} -{" "}
                              {walk.lanes_with_problems || "No problems"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRangeWalkId && (
                        <div className="text-sm">
                          <strong>Description:</strong>{" "}
                          {rangeWalkData?.find(
                            (walk) => walk.id === selectedRangeWalkId
                          )?.description || "No description provided"}
                        </div>
                      )}
                      <Textarea
                        placeholder="Enter repair notes..."
                        value={repairNotes || ""}
                        onChange={(e) =>
                          handleRepairNotesChange(e.target.value)
                        }
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={handleSubmitRepairNotes}
                          disabled={!selectedRangeWalkId}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleRepairNotesPopoverOpenChange(false)
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>

          <Card className="flex flex-col col-span-full mt-2 mb-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="h-6 w-6" />
                Range Report
              </CardTitle>
            </CardHeader>
            <div className="overflow-hidden">
              <ScrollArea
                className={classNames(
                  styles.noScroll,
                  "w-[calc(100vw-90px)] overflow-auto"
                )}
              >
                <CardContent className="flex flex-col overflow-auto">
                  {userLoading || dataLoading ? (
                    <p>Loading...</p>
                  ) : (
                    userData?.userRole &&
                    userData?.userUuid &&
                    rangeWalkData && (
                      <DataTable
                        columns={columns}
                        data={rangeWalkData}
                        userRole={userData.userRole}
                        userUuid={userData.userUuid}
                        onStatusChange={handleStatusChange}
                        onNotesChange={handleNotesChange}
                      />
                    )
                  )}
                </CardContent>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>
          </Card>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}
