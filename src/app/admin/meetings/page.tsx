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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { debounce } from "lodash";
import {
  getCurrentEmployee,
  getTeamMembers,
  getEmployees,
  addTeamMember,
  updateTeamMemberNotes,
  removeEmployee,
  markNoteAsDiscussed,
  getDiscussedNotes,
  dismissNote,
  DiscussedNote,
  removeDiscussedNote,
} from "./actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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
  inventory_notes: NoteItem[] | null;
  store_notes: NoteItem[] | null;
  employees_notes: NoteItem[] | null;
  safety_notes: NoteItem[] | null;
  general_notes: NoteItem[] | null;
};

type NoteType =
  | "range_notes"
  | "inventory_notes"
  | "store_notes"
  | "employees_notes"
  | "safety_notes"
  | "general_notes";

const topics: NoteType[] = [
  "range_notes",
  "inventory_notes",
  "store_notes",
  "employees_notes",
  "safety_notes",
  "general_notes",
];
type TopicType = (typeof topics)[number];

const topicDisplayNames: Record<NoteType, string> = {
  range_notes: "Range",
  inventory_notes: "Inventory",
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

type DraftNote = {
  [noteId: number]: {
    [topic in NoteType]?: {
      [itemId: string]: string;
    };
  };
};

type DiscussedNoteItem = {
  id: number;
  content: string;
  employee_name: string;
};

type DiscussedNotes = {
  meeting_date: string;
  notes: {
    [topic: string]: DiscussedNoteItem[];
  };
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

  const draftQuery = useQuery({
    queryKey: ["noteDrafts"],
    queryFn: () => ({} as DraftNote),
    staleTime: Infinity,
  });

  const { data: currentEmployee } = useQuery<Employee | null>({
    queryKey: ["currentEmployee", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return await getCurrentEmployee(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["teamMembers"],
    queryFn: async () => await getTeamMembers(),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => await getEmployees(),
  });

  const { data: discussedNotes = [] } = useQuery<DiscussedNote[]>({
    queryKey: ["discussedNotes"],
    queryFn: async () => await getDiscussedNotes(),
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: (
      newNotes: Omit<TeamMember, "note_id" | "created_at" | "updated_at">
    ) => addTeamMember(newNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      if (popoverRef.current) {
        popoverRef.current.click();
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("Failed to add team member");
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: (member: TeamMember) => updateTeamMemberNotes(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      // toast.success("Notes saved successfully");
    },
    onError: (error) => {
      console.error("Error updating notes:", error);
      toast.error("Failed to save notes");
    },
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: (employeeId: number) => removeEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast.success("Employee and notes removed successfully");
    },
    onError: (error) => {
      console.error("Error removing employee:", error);
      toast.error("Failed to remove employee");
    },
  });

  const markAsDiscussedMutation = useMutation({
    mutationFn: ({
      content,
      topic,
      employeeId,
      employeeName,
    }: {
      content: string;
      topic: NoteType;
      employeeId: number;
      employeeName: string;
    }) =>
      markNoteAsDiscussed(
        content,
        topic,
        employeeId,
        employeeName,
        format(new Date(), "yyyy-MM-dd")
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["discussedNotes"] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });

      queryClient.setQueryData<TeamMember[]>(["teamMembers"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((member) => {
          if (member.employee_id === variables.employeeId) {
            const updatedNotes =
              member[variables.topic]?.filter(
                (note: NoteItem) => note.content !== variables.content
              ) || [];
            return { ...member, [variables.topic]: updatedNotes };
          }
          return member;
        });
      });
      toast.success("Note marked as discussed");
    },
    onError: (error) => {
      console.error("Error marking note as discussed:", error);
      toast.error("Failed to mark note as discussed");
    },
  });

  const dismissNoteMutation = useMutation({
    mutationFn: ({
      memberId,
      topic,
      noteId,
    }: {
      memberId: number;
      topic: NoteType;
      noteId: string;
    }) => dismissNote(memberId, topic, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.setQueryData<TeamMember[]>(["teamMembers"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((member) => {
          if (member.note_id === variables.memberId) {
            const updatedNotes = member[variables.topic]?.filter(
              (note: NoteItem) => note.id !== variables.noteId
            );
            return { ...member, [variables.topic]: updatedNotes };
          }
          return member;
        });
      });
      toast.success("Note dismissed");
    },
  });

  const removeDiscussedNoteMutation = useMutation({
    mutationFn: (noteId: number) => removeDiscussedNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussedNotes"] });
      toast.success("Note removed successfully");
    },
  });

  const handleRemoveEmployee = (employeeId: number) => {
    removeEmployeeMutation.mutate(employeeId);
  };

  const addYourself = () => {
    return Promise.resolve().then(() => {
      if (user && currentEmployee) {
        // Check if the user has already added themselves
        const existingEntry = teamMembers.find(
          (member) => member.employee_id === currentEmployee.employee_id
        );

        if (
          existingEntry &&
          currentEmployee.role !== "super admin" &&
          currentEmployee.role !== "dev"
        ) {
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
          inventory_notes: [{ id: Date.now().toString(), content: "" }],
          store_notes: [{ id: Date.now().toString(), content: "" }],
          employees_notes: [{ id: Date.now().toString(), content: "" }],
          safety_notes: [{ id: Date.now().toString(), content: "" }],
          general_notes: [{ id: Date.now().toString(), content: "" }],
        };

        // console.log("New notes data:", newNotes);
        addTeamMemberMutation.mutate(newNotes);
      } else {
        console.error(
          "Cannot add notes: user is not logged in or employee data is not available"
        );
        toast.error(
          "Unable to add you to the meeting. Please try again later."
        );
      }
    });
  };

  const updateLocalNote = (
    noteId: number,
    topic: NoteType,
    itemId: string,
    content: string
  ) => {
    const optimisticUpdate = {
      type: "updateNote",
      noteId,
      topic,
      itemId,
      content: DOMPurify.sanitize(content),
    };

    // Store previous data for rollback
    const previousData = queryClient.getQueryData<TeamMember[]>([
      "teamMembers",
    ]);

    // Apply optimistic update
    queryClient.setQueryData<TeamMember[]>(["teamMembers"], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((member) => {
        if (member.note_id === noteId) {
          const updatedNotes =
            member[topic]?.map((item) =>
              item.id === itemId
                ? { ...item, content: optimisticUpdate.content }
                : item
            ) || [];
          return { ...member, [topic]: updatedNotes };
        }
        return member;
      });
    });

    // Track optimistic update
    queryClient.setQueryData(["optimisticUpdates"], (old: any[] = []) => [
      ...old,
      optimisticUpdate,
    ]);

    // Return rollback function
    return () => {
      queryClient.setQueryData<TeamMember[]>(["teamMembers"], previousData);
      queryClient.setQueryData(["optimisticUpdates"], (updates: any[] = []) =>
        updates.filter((u) => u !== optimisticUpdate)
      );
    };
  };

  const addLocalItem = (noteId: number, topic: NoteType) => {
    const optimisticUpdate = {
      type: "addItem",
      noteId,
      topic,
      itemId: Date.now().toString(),
    };

    queryClient.setQueryData<TeamMember[]>(["teamMembers"], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((member) => {
        if (member.note_id === noteId) {
          const updatedNotes = [
            ...(member[topic] || []),
            { id: optimisticUpdate.itemId, content: "" },
          ];
          return { ...member, [topic]: updatedNotes };
        }
        return member;
      });
    });

    // Store the optimistic update
    const previousData = queryClient.getQueryData<TeamMember[]>([
      "teamMembers",
    ]);
    queryClient.setQueryData(["optimisticUpdates"], (old: any[] = []) => [
      ...old,
      optimisticUpdate,
    ]);

    // Revert if needed
    return () => {
      queryClient.setQueryData<TeamMember[]>(["teamMembers"], previousData);
      queryClient.setQueryData(["optimisticUpdates"], (updates: any[] = []) =>
        updates.filter((u) => u !== optimisticUpdate)
      );
    };
  };

  const removeLocalItem = (noteId: number, topic: NoteType, itemId: string) => {
    const debouncedRemove = debounce(() => {
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
    }); // 500ms delay

    debouncedRemove();
  };

  const saveChanges = (noteId: number) => {
    const member = teamMembers.find((m) => m.note_id === noteId);
    if (member) {
      updateNoteMutation.mutate(member, {
        onSuccess: () => {
          // console.log("Mutation successful, showing toast");
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
    return teamMembers.some(
      (member) => member.employee_id === currentEmployee?.employee_id
    );
  }, [teamMembers, currentEmployee]);

  const groupedDiscussedNotes = useMemo(() => {
    const grouped: Record<string, DiscussedNotes> = {};

    discussedNotes.forEach((note) => {
      if (!grouped[note.meeting_date]) {
        grouped[note.meeting_date] = {
          meeting_date: note.meeting_date,
          notes: {},
        };
      }

      if (!grouped[note.meeting_date].notes[note.topic]) {
        grouped[note.meeting_date].notes[note.topic] = [];
      }

      grouped[note.meeting_date].notes[note.topic].push({
        id: note.id,
        content: note.note_content,
        employee_name: note.employee_name,
      } as DiscussedNoteItem);
    });

    return grouped;
  }, [discussedNotes]);

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin", "dev"]}>
      <main className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <h1 className="text-2xl font-bold mb-4">Weekly Agenda Notes</h1>

        {!hasAddedSelf && (
          <div className="flex flex-col items-start gap-2">
            <Button
              variant="gooeyRight"
              onClick={addYourself}
              disabled={
                hasAddedSelf &&
                currentEmployee?.role !== "super admin" &&
                currentEmployee?.role !== "dev"
              }
            >
              Add Yourself
            </Button>
            <label>
              <span>
                If this is your first time, add yourself to the meeting by
                clicking the button above.
              </span>
            </label>
          </div>
        )}

        <Tabs defaultValue="weekly-notes" className="w-full">
          <div className="flex items-center space-x-2 mb-4">
            <TabsList>
              <TabsTrigger value="weekly-notes">Team Updates</TabsTrigger>
              <TabsTrigger value="edit-notes">Edit Your Notes</TabsTrigger>
              <TabsTrigger value="discussed-notes">
                Discussed Topics
              </TabsTrigger>
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
                                {member[topic]?.length ? (
                                  member[topic].map((item) => (
                                    <li
                                      key={item.id}
                                      className="flex items-start text-sm group relative"
                                    >
                                      <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                      <span>{item.content || ""}</span>
                                      {currentEmployee?.role === "dev" && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="opacity-0 group-hover:opacity-100 absolute right-0"
                                            >
                                              Actions
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                const employeeName =
                                                  employees.find(
                                                    (e) =>
                                                      e.employee_id ===
                                                      member.employee_id
                                                  )?.name || "Unknown";

                                                markAsDiscussedMutation.mutate({
                                                  content: item.content,
                                                  topic,
                                                  employeeId:
                                                    member.employee_id,
                                                  employeeName: employeeName,
                                                });
                                              }}
                                            >
                                              Mark as Discussed
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                dismissNoteMutation.mutate({
                                                  memberId: member.note_id,
                                                  topic,
                                                  noteId: item.id,
                                                })
                                              }
                                            >
                                              Dismiss
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </li>
                                  ))
                                ) : (
                                  <li>
                                    <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                  </li>
                                )}
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
                              <div className="mt-1">
                                {" "}
                                {/* Add this wrapper div */}
                                {(member[topic]?.length ?? 0) > 0 ? (
                                  // Render existing notes if they exist
                                  member[topic]?.map((item) => (
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
                                  ))
                                ) : (
                                  // Render a placeholder when no notes exist
                                  <div className="text-sm text-muted-foreground">
                                    No notes added yet
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    addLocalItem(member.note_id, topic)
                                  }
                                  className="mt-2"
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Add Item
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          {(currentEmployee?.role === "super admin" ||
                            currentEmployee?.role === "dev") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                  Remove Employee
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you absolutely sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the employee&apos;s notes
                                    and remove them from the team.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleRemoveEmployee(member.employee_id)
                                    }
                                  >
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

              <TabsContent value="discussed-notes">
                <div className="grid gap-6">
                  {Object.values(groupedDiscussedNotes)
                    .sort(
                      (a, b) =>
                        new Date(b.meeting_date).getTime() -
                        new Date(a.meeting_date).getTime()
                    )
                    .map((dateGroup) => (
                      <Card key={dateGroup.meeting_date}>
                        <CardHeader>
                          <CardTitle>
                            Meeting Notes -{" "}
                            {format(new Date(dateGroup.meeting_date), "PPP")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {topics.map((topic) => (
                            <div key={topic} className="mb-6">
                              <h3 className="font-semibold text-lg mb-2">
                                {topicDisplayNames[topic]}
                              </h3>
                              <ul className="space-y-2">
                                {dateGroup.notes[topic]?.map((note) => (
                                  <li
                                    key={note.id}
                                    className="flex items-start text-sm group relative" // Match Team Updates styling
                                  >
                                    <div className="flex items-start">
                                      <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                      <span>{note.content}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {note.employee_name}
                                    </span>
                                    {currentEmployee?.role === "dev" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 absolute right-0"
                                        onClick={() =>
                                          removeDiscussedNoteMutation.mutate(
                                            note.id
                                          )
                                        }
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </li>
                                )) || <li>No discussed notes</li>}
                              </ul>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
}
