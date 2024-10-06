"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Minus, X, Dot } from "lucide-react";
import { useMemo, useRef } from "react";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type NoteItem = {
  id: string;
  content: string;
};

type TeamMember = {
  note_id: number;
  employee_id: number;
  created_at: string;
  updated_at: string;
  range_notes: NoteItem[] | null;
  store_notes: NoteItem[] | null;
  employees_notes: NoteItem[] | null;
  safety_notes: NoteItem[] | null;
  general_notes: NoteItem[] | null;
};

type NoteType = keyof Omit<
  TeamMember,
  "note_id" | "employee_id" | "created_at" | "updated_at"
>;

const topics: NoteType[] = [
  "range_notes",
  "store_notes",
  "employees_notes",
  "safety_notes",
  "general_notes",
];
type TopicType = (typeof topics)[number];

const topicDisplayNames: Record<NoteType, string> = {
  range_notes: "Range",
  store_notes: "Store",
  employees_notes: "Employees",
  safety_notes: "Safety",
  general_notes: "General",
};

type Employee = {
  employee_id: number;
  name: string;
  role: string;
};

export default function TeamWeeklyNotes() {
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();
  const popoverRef = useRef<HTMLButtonElement>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: currentEmployee } = useQuery<Employee | null>({
    queryKey: ["currentEmployee"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name, role")
        .eq("user_uuid", user.id)
        .single();
      if (error) throw error;
      if (!data) throw new Error("Employee not found");
      return data as Employee;
    },
    enabled: !!user,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_weekly_notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, name, role");
      if (error) throw error;
      return data;
    },
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (
      newNotes: Omit<TeamMember, "note_id" | "created_at" | "updated_at">
    ) => {
      const { data, error } = await supabase
        .from("team_weekly_notes")
        .insert([newNotes])
        .single();
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      if (popoverRef.current) {
        popoverRef.current.click(); // Close the popover
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (member: TeamMember) => {
      const { data, error } = await supabase
        .from("team_weekly_notes")
        .update(member)
        .eq("note_id", member.note_id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const { error } = await supabase
        .from("team_weekly_notes")
        .delete()
        .eq("employee_id", employeeId);

      if (error) throw error;

      // Optionally, also remove the employee from the employees table
      // Uncomment the following lines if you want to remove the employee completely
      // const { error: employeeError } = await supabase
      //   .from("employees")
      //   .delete()
      //   .eq("employee_id", employeeId);
      // if (employeeError) throw employeeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast.success("Employee and notes removed successfully");
    },
    onError: (error) => {
      console.error("Error removing employee:", error);
      toast.error("Failed to remove employee");
    },
  });

  const handleRemoveEmployee = (employeeId: number) => {
    removeEmployeeMutation.mutate(employeeId);
  };

  const addYourself = async () => {
    if (user && currentEmployee) {
      // Check if the user has already added themselves
      const existingEntry = teamMembers.find(member => member.employee_id === currentEmployee.employee_id);

      if (existingEntry && currentEmployee.role !== 'super admin' && currentEmployee.role !== 'dev') {
        toast.error("You have already added yourself to this meeting.");
        return;
      }

      // Prepare new team weekly notes
      const newNotes: Omit<
        TeamMember,
        "note_id" | "created_at" | "updated_at"
      > = {
        employee_id: currentEmployee.employee_id,
        range_notes: [{ id: Date.now().toString(), content: "" }],
        store_notes: [{ id: Date.now().toString(), content: "" }],
        employees_notes: [{ id: Date.now().toString(), content: "" }],
        safety_notes: [{ id: Date.now().toString(), content: "" }],
        general_notes: [{ id: Date.now().toString(), content: "" }],
      };

      console.log("New notes data:", newNotes);
      addTeamMemberMutation.mutate(newNotes);
    } else {
      console.error("Cannot add notes: user is not logged in or employee data is not available");
      toast.error("Unable to add you to the meeting. Please try again later.");
    }
  };

  const updateLocalNote = (
    noteId: number,
    topic: NoteType,
    itemId: string,
    content: string
  ) => {
    queryClient.setQueryData<TeamMember[]>(["teamMembers"], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((member) => {
        if (member.note_id === noteId) {
          const updatedNotes =
            member[topic]?.map((item) =>
              item.id === itemId
                ? { ...item, content: DOMPurify.sanitize(content) }
                : item
            ) || [];
          return { ...member, [topic]: updatedNotes };
        }
        return member;
      });
    });
  };

  const addLocalItem = (noteId: number, topic: NoteType) => {
    queryClient.setQueryData<TeamMember[]>(["teamMembers"], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((member) => {
        if (member.note_id === noteId) {
          const updatedNotes = [
            ...(member[topic] || []),
            { id: Date.now().toString(), content: "" },
          ];
          return { ...member, [topic]: updatedNotes };
        }
        return member;
      });
    });
  };

  const removeLocalItem = (noteId: number, topic: NoteType, itemId: string) => {
    queryClient.setQueryData<TeamMember[]>(["teamMembers"], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((member) => {
        if (member.note_id === noteId) {
          const updatedNotes =
            member[topic]?.filter((item) => item.id !== itemId) || [];
          return { ...member, [topic]: updatedNotes };
        }
        return member;
      });
    });
  };

  const saveChanges = (noteId: number) => {
    const member = teamMembers.find((m) => m.note_id === noteId);
    if (member) {
      updateNoteMutation.mutate(member, {
        onSuccess: () => {
          console.log("Mutation successful, showing toast");
          toast.success("Notes saved successfully");
        },
      });
    }
  };

  const filteredTeamMembers = useMemo(() => {
    if (!currentEmployee) return [];
    if (
      currentEmployee.role === "super admin" ||
      currentEmployee.role === "dev"
    ) {
      return teamMembers;
    }
    return teamMembers.filter(
      (member) => member.employee_id === currentEmployee.employee_id
    );
  }, [teamMembers, currentEmployee]);

  const hasAddedSelf = useMemo(() => {
    return teamMembers.some(member => member.employee_id === currentEmployee?.employee_id);
  }, [teamMembers, currentEmployee]);

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin", "dev"]}>
      <main className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <h1 className="text-2xl font-bold mb-4">Weekly Agenda Notes</h1>

        {!hasAddedSelf && (
          <div className="flex flex-col items-start gap-2">
            <Button 
              variant="gooeyRight"
              onClick={addYourself}
              disabled={hasAddedSelf && 
                        currentEmployee?.role !== 'super admin' && 
                        currentEmployee?.role !== 'dev'}
            >
              Add Yourself
            </Button>
            <label>
              <span>If this is your first time, add yourself to the meeting by clicking the button above.</span>
            </label>
          </div>
        )}

        <Tabs defaultValue="weekly-notes" className="w-full">
          <div className="flex items-center space-x-2 mb-4">
            <TabsList>
              <TabsTrigger value="weekly-notes">Team Updates</TabsTrigger>
              <TabsTrigger value="edit-notes">Edit Your Notes</TabsTrigger>
            </TabsList>
          </div>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <TabsContent value="weekly-notes">
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {teamMembers.map((member) => {
                    const employee = employees.find(
                      (e) => e.employee_id === member.employee_id
                    );
                    return (
                      <Card key={member.note_id}>
                        <CardHeader>
                          <CardTitle>
                          <h1 className="text-xl font-semibold">
                            {employee?.name ||
                              `Employee ID: ${member.employee_id}`}
                              </h1>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="ml-6">
                          {topics.map((topic) => (
                            <div key={topic} className="mb-2">
                              <h3 className="font-semibold">
                                {topicDisplayNames[topic]}
                              </h3>
                              <ul className="list-none ml-2">
                                {member[topic]?.map((item) => (
                                  <li
                                    key={item.id}
                                    className="flex items-start text-sm"
                                  >
                                    <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                    <span>
                                      {item.content || ""}
                                    </span>
                                  </li>
                                )) || <li>No notes available.</li>}
                              </ul>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="edit-notes">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTeamMembers.map((member) => {
                    const employee = employees.find(
                      (e) => e.employee_id === member.employee_id
                    );
                    return (
                      <Card key={member.note_id} className="relative">
                        <CardHeader>
                          <CardTitle>
                          <h1 className="text-xl font-semibold">
                            {employee?.name ||
                              `Employee ID: ${member.employee_id}`}
                              </h1>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {topics.map((topic) => (
                            <div key={topic} className="mb-4">
                              <Label>{topicDisplayNames[topic]}</Label>
                              {member[topic]?.map((item) => (
                                <div
                                  key={item.id}
                                  className="mt-1 flex items-center gap-2"
                                >
                                  <Textarea
                                    value={item.content}
                                    onChange={(e) =>
                                      updateLocalNote(
                                        member.note_id,
                                        topic,
                                        item.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Enter ${topicDisplayNames[topic]} notes...`}
                                    className="flex-grow"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeLocalItem(
                                        member.note_id,
                                        topic,
                                        item.id
                                      )
                                    }
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                </div>
                              )) || <div>No notes available.</div>}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  addLocalItem(member.note_id, topic)
                                }
                                className="mt-1"
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Item
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          
                          {(currentEmployee?.role === "super admin" || currentEmployee?.role === "dev") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive">Remove Employee</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the employee&apos;s notes and remove them from the team.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveEmployee(member.employee_id)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => saveChanges(member.note_id)}
                          >
                            Save Changes
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

       
      </main>
    </RoleBasedWrapper>
  );
}