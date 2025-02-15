"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { formatInTimeZone } from "date-fns-tz";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { Content } from "@tiptap/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type BulletinPost = {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by: string;
  requires_acknowledgment: boolean;
  required_departments: string[];
};

type Acknowledgment = {
  id: number;
  post_id: number;
  employee_id: number;
  employee_name: string;
  summary: string;
  acknowledged_at: string;
};

type NewBulletin = {
  title: string;
  content: string;
  category: string;
  requires_acknowledgment: boolean;
};

// Add acknowledgment schema
const acknowledgmentSchema = z.object({
  summary: z.string().min(5, "Summary must be at least 5 characters long"),
});

type AcknowledgmentFormValues = z.infer<typeof acknowledgmentSchema>;

// Add this new type for form state
type BulletinFormState = {
  title: string;
  content: string;
  category: string;
  requires_acknowledgment: boolean;
  required_departments: string[];
};

// Add departments array at the top level of the component
const departments = [
  "All Departments",
  "Operations",
  "Sales",
  "Range",
  "Reloading",
];

export default function BulletinBoard() {
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();

  const acknowledgmentSummaryQuery = useQuery({
    queryKey: ["acknowledgmentSummary"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: currentEmployee } = useQuery({
    queryKey: ["currentEmployee", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_uuid", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bulletinPosts = [] } = useQuery({
    queryKey: ["bulletinPosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulletin_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BulletinPost[];
    },
  });

  const { data: acknowledgments = [] } = useQuery({
    queryKey: ["acknowledgments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulletin_acknowledgments")
        .select("*")
        .order("acknowledged_at", { ascending: false });
      if (error) throw error;
      return data as Acknowledgment[];
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({
      postId,
      summary,
    }: {
      postId: number;
      summary: string;
    }) => {
      const { error } = await supabase.from("bulletin_acknowledgments").insert({
        post_id: postId,
        employee_id: currentEmployee?.employee_id,
        employee_name: currentEmployee?.name,
        summary,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acknowledgments"] });
      queryClient.setQueryData(["acknowledgmentSummary"], "");
      toast.success("Bulletin acknowledged successfully");
    },
    onError: (error) => {
      console.error("Error acknowledging bulletin:", error);
      toast.error("Failed to acknowledge bulletin");
    },
  });

  const hasAcknowledged = (post: BulletinPost) => {
    // If no acknowledgment required, return true
    if (!post.requires_acknowledgment) return true;

    // Check if the employee has already acknowledged
    const hasAlreadyAcknowledged = acknowledgments.some(
      (ack) =>
        ack.post_id === post.id &&
        ack.employee_id === currentEmployee?.employee_id
    );

    // If already acknowledged, return true
    if (hasAlreadyAcknowledged) return true;

    // If post has required departments
    if (post.required_departments?.length > 0) {
      // Check if employee's department is in the required departments
      const isInRequiredDepartment = post.required_departments.includes(
        currentEmployee?.department || ""
      );

      // Return true (no need to acknowledge) if employee is NOT in required departments
      return !isInRequiredDepartment;
    }

    // If no required departments specified, acknowledgment is required
    return false;
  };

  const createBulletinMutation = useMutation({
    mutationFn: async (newBulletin: {
      title: string;
      content: string;
      category: string;
      requires_acknowledgment: boolean;
      required_departments: string[];
    }) => {
      const { error } = await supabase.from("bulletin_posts").insert({
        ...newBulletin,
        created_by: currentEmployee?.name || "Unknown",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletinPosts"] });
      toast.success("Bulletin created successfully");
    },
    onError: (error) => {
      console.error("Error creating bulletin:", error);
      toast.error("Failed to create bulletin");
    },
  });

  const deleteBulletinMutation = useMutation({
    mutationFn: async (postId: number) => {
      const { error } = await supabase
        .from("bulletin_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletinPosts"] });
      toast.success("Bulletin deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting bulletin:", error);
      toast.error("Failed to delete bulletin");
    },
  });

  // Add a new query for form state
  const bulletinFormQuery = useQuery<BulletinFormState>({
    queryKey: ["bulletinForm"],
    queryFn: () => ({
      title: "",
      content: "",
      category: "",
      requires_acknowledgment: false,
      required_departments: [],
    }),
    staleTime: Infinity,
  });

  const editBulletinMutation = useMutation({
    mutationFn: async (bulletin: BulletinPost) => {
      const { error } = await supabase
        .from("bulletin_posts")
        .update({
          title: bulletin.title,
          content: bulletin.content,
          category: bulletin.category,
          requires_acknowledgment: bulletin.requires_acknowledgment,
          required_departments: bulletin.required_departments,
        })
        .eq("id", bulletin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletinPosts"] });
      toast.success("Bulletin updated successfully");
    },
    onError: (error) => {
      console.error("Error updating bulletin:", error);
      toast.error("Failed to update bulletin");
    },
  });

  const editingBulletinQuery = useQuery<BulletinPost | null>({
    queryKey: ["editingBulletin"],
    queryFn: () => null,
    staleTime: Infinity,
  });

  const dialogStatesQuery = useQuery({
    queryKey: ["dialogStates"],
    queryFn: () => ({
      createBulletinOpen: false,
      editBulletinOpen: false,
      editingBulletinId: null as number | null,
    }),
    staleTime: Infinity,
  });

  const form = useForm<AcknowledgmentFormValues>({
    resolver: zodResolver(acknowledgmentSchema),
    defaultValues: {
      summary: "",
    },
  });

  // Add a new query for the editor content
  const editorContentQuery = useQuery({
    queryKey: ["editorContent"],
    queryFn: () => "",
    staleTime: Infinity,
  });

  return (
    <RoleBasedWrapper
      allowedRoles={[
        "user",
        "auditor",
        "gunsmith",
        "admin",
        "super admin",
        "dev",
      ]}
    >
      <main className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Crew Bulletin Board</h1>
          {(currentEmployee?.role === "admin" ||
            currentEmployee?.role === "super admin" ||
            currentEmployee?.role === "dev") && (
            <Dialog
              open={dialogStatesQuery.data?.createBulletinOpen}
              onOpenChange={(open) => {
                queryClient.setQueryData(["dialogStates"], (old: any) => ({
                  ...old,
                  createBulletinOpen: open,
                }));
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bulletin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Bulletin</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 overflow-y-auto">
                  <div className="grid gap-2 p-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      defaultValue={bulletinFormQuery.data?.title}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        queryClient.setQueryData(
                          ["bulletinForm"],
                          (old: BulletinFormState | undefined) => ({
                            ...old!,
                            title: newValue,
                          })
                        );
                      }}
                    />
                  </div>
                  <div className="grid gap-2 p-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={bulletinFormQuery.data?.category}
                      onValueChange={(value) => {
                        queryClient.setQueryData(
                          ["bulletinForm"],
                          (old: BulletinFormState | undefined) => ({
                            ...old!,
                            category: value,
                          })
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">
                          Announcement
                        </SelectItem>
                        <SelectItem value="policy">Policy Update</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 p-2">
                    <Label htmlFor="content">Content</Label>
                    <div className="min-h-[200px] max-h-[400px] border rounded-md overflow-y-auto">
                      <MinimalTiptapEditor
                        value={bulletinFormQuery.data?.content}
                        onChange={(newContent: Content) => {
                          queryClient.setQueryData(
                            ["bulletinForm"],
                            (old: BulletinFormState | undefined) => ({
                              ...old!,
                              content:
                                typeof newContent === "string"
                                  ? newContent
                                  : newContent?.toString() || "",
                            })
                          );
                        }}
                        className="w-full"
                        editorContentClassName="p-4 max-h-[380px] overflow-y-auto"
                        output="html"
                        placeholder="Enter bulletin content..."
                        editorClassName="focus:outline-none"
                        editable={true}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_acknowledgment"
                      checked={bulletinFormQuery.data?.requires_acknowledgment}
                      onCheckedChange={(checked) => {
                        queryClient.setQueryData(
                          ["bulletinForm"],
                          (old: BulletinFormState | undefined) => ({
                            ...old!,
                            requires_acknowledgment: checked,
                            // Set all departments explicitly when enabling acknowledgment
                            required_departments: checked
                              ? ["Operations", "Sales", "Range", "Reloading"]
                              : [],
                          })
                        );
                      }}
                    />
                    <Label htmlFor="requires_acknowledgment">
                      Requires Acknowledgment
                    </Label>
                  </div>

                  {bulletinFormQuery.data?.requires_acknowledgment && (
                    <div className="grid gap-2 p-2">
                      <Label htmlFor="required_departments">
                        Required Departments
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {bulletinFormQuery.data?.required_departments
                              ?.length > 0
                              ? `${bulletinFormQuery.data.required_departments.length} departments selected`
                              : "Select departments"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search departments..." />
                            <CommandEmpty>No department found.</CommandEmpty>
                            <CommandGroup>
                              {departments.map((department) => (
                                <CommandItem
                                  key={department}
                                  onSelect={() => {
                                    queryClient.setQueryData(
                                      ["bulletinForm"],
                                      (old: BulletinFormState | undefined) => {
                                        if (department === "All Departments") {
                                          return {
                                            ...old!,
                                            required_departments: [
                                              "Operations",
                                              "Sales",
                                              "Range",
                                              "Reloading",
                                            ],
                                          };
                                        }

                                        const current =
                                          old?.required_departments || [];
                                        const updated = current.includes(
                                          department
                                        )
                                          ? current.filter(
                                              (d) => d !== department
                                            )
                                          : [...current, department];

                                        return {
                                          ...old!,
                                          required_departments: updated,
                                        };
                                      }
                                    );
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      bulletinFormQuery.data?.required_departments?.includes(
                                        department
                                      )
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {department}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      const formData =
                        queryClient.getQueryData<BulletinFormState>([
                          "bulletinForm",
                        ]);
                      if (formData) {
                        createBulletinMutation.mutate(formData, {
                          onSuccess: () => {
                            queryClient.setQueryData(
                              ["dialogStates"],
                              (old: any) => ({
                                ...old,
                                createBulletinOpen: false,
                              })
                            );
                            // Reset form
                            queryClient.setQueryData(["bulletinForm"], {
                              title: "",
                              content: "",
                              category: "",
                              requires_acknowledgment: false,
                              required_departments: [],
                            });
                          },
                        });
                      }
                    }}
                  >
                    Create Bulletin
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="bulletins" className="w-full">
          <TabsList>
            <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
            {(currentEmployee?.role === "admin" ||
              currentEmployee?.role === "super admin" ||
              currentEmployee?.role === "dev") && (
              <TabsTrigger value="acknowledgments">Acknowledgments</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="bulletins">
            <div className="grid gap-6">
              {bulletinPosts.map((post) => (
                <Card key={post.id} className="relative group">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{post.title}</span>
                      <div className="flex items-center gap-2">
                        {(currentEmployee?.role === "admin" ||
                          currentEmployee?.role === "super admin" ||
                          currentEmployee?.role === "dev") && (
                          <>
                            <Dialog
                              open={
                                dialogStatesQuery.data?.editBulletinOpen &&
                                dialogStatesQuery.data?.editingBulletinId ===
                                  post.id
                              }
                              onOpenChange={(open) => {
                                queryClient.setQueryData(
                                  ["dialogStates"],
                                  (old: any) => ({
                                    ...old,
                                    editBulletinOpen: open,
                                    editingBulletinId: open ? post.id : null,
                                  })
                                );
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    queryClient.setQueryData<BulletinPost | null>(
                                      ["editingBulletin"],
                                      post
                                    );
                                  }}
                                >
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Bulletin</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4 overflow-y-auto">
                                  <div className="grid gap-2 p-2">
                                    <Label htmlFor="edit-title">Title</Label>
                                    <Input
                                      id="edit-title"
                                      defaultValue={post.title}
                                      onChange={(e) => {
                                        queryClient.setQueryData<BulletinPost | null>(
                                          ["editingBulletin"],
                                          (old) =>
                                            old
                                              ? {
                                                  ...old,
                                                  title: e.target.value,
                                                }
                                              : null
                                        );
                                      }}
                                    />
                                  </div>
                                  <div className="grid gap-2 p-2">
                                    <Label htmlFor="edit-category">
                                      Category
                                    </Label>
                                    <Select
                                      defaultValue={post.category}
                                      onValueChange={(value) => {
                                        queryClient.setQueryData<BulletinPost | null>(
                                          ["editingBulletin"],
                                          (old) =>
                                            old
                                              ? { ...old, category: value }
                                              : null
                                        );
                                      }}
                                    >
                                      <SelectTrigger id="edit-category">
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="announcement">
                                          Announcement
                                        </SelectItem>
                                        <SelectItem value="policy">
                                          Policy Update
                                        </SelectItem>
                                        <SelectItem value="training">
                                          Training
                                        </SelectItem>
                                        <SelectItem value="safety">
                                          Safety
                                        </SelectItem>
                                        <SelectItem value="general">
                                          General
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2 p-2">
                                    <Label htmlFor="edit-content">
                                      Content
                                    </Label>
                                    <div className="min-h-[200px] max-h-[400px] border rounded-md overflow-y-auto">
                                      <MinimalTiptapEditor
                                        value={
                                          editingBulletinQuery.data?.content
                                        }
                                        onChange={(newContent: Content) => {
                                          queryClient.setQueryData<BulletinPost | null>(
                                            ["editingBulletin"],
                                            (old) =>
                                              old
                                                ? {
                                                    ...old,
                                                    content:
                                                      typeof newContent ===
                                                      "string"
                                                        ? newContent
                                                        : newContent?.toString() ||
                                                          "",
                                                  }
                                                : null
                                          );
                                        }}
                                        className="w-full"
                                        editorContentClassName="p-4 max-h-[380px] overflow-y-auto"
                                        output="html"
                                        placeholder="Enter bulletin content..."
                                        editorClassName="focus:outline-none"
                                        editable={true}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="edit-requires-acknowledgment"
                                      defaultChecked={
                                        post.requires_acknowledgment
                                      }
                                      onCheckedChange={(checked) => {
                                        queryClient.setQueryData<BulletinPost | null>(
                                          ["editingBulletin"],
                                          (old) =>
                                            old
                                              ? {
                                                  ...old,
                                                  requires_acknowledgment:
                                                    checked,
                                                }
                                              : null
                                        );
                                      }}
                                    />
                                    <Label htmlFor="edit-requires-acknowledgment">
                                      Requires Acknowledgment
                                    </Label>
                                  </div>

                                  {editingBulletinQuery.data
                                    ?.requires_acknowledgment && (
                                    <div className="grid gap-2 p-2">
                                      <Label htmlFor="edit-required-departments">
                                        Required Departments
                                      </Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                          >
                                            {editingBulletinQuery.data
                                              ?.required_departments?.length > 0
                                              ? `${editingBulletinQuery.data.required_departments.length} departments selected`
                                              : "Select departments"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                          <Command>
                                            <CommandInput placeholder="Search departments..." />
                                            <CommandEmpty>
                                              No department found.
                                            </CommandEmpty>
                                            <CommandGroup>
                                              {departments.map((department) => (
                                                <CommandItem
                                                  key={department}
                                                  onSelect={() => {
                                                    queryClient.setQueryData<BulletinPost | null>(
                                                      ["editingBulletin"],
                                                      (old) => {
                                                        if (!old) return null;
                                                        if (
                                                          department ===
                                                          "All Departments"
                                                        ) {
                                                          return {
                                                            ...old,
                                                            required_departments:
                                                              [
                                                                "Operations",
                                                                "Sales",
                                                                "Range",
                                                                "Reloading",
                                                              ],
                                                          };
                                                        }

                                                        const current =
                                                          old.required_departments ||
                                                          [];
                                                        const updated =
                                                          current.includes(
                                                            department
                                                          )
                                                            ? current.filter(
                                                                (d) =>
                                                                  d !==
                                                                  department
                                                              )
                                                            : [
                                                                ...current,
                                                                department,
                                                              ];

                                                        return {
                                                          ...old,
                                                          required_departments:
                                                            updated,
                                                        };
                                                      }
                                                    );
                                                  }}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      editingBulletinQuery.data?.required_departments?.includes(
                                                        department
                                                      )
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                    )}
                                                  />
                                                  {department}
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() => {
                                      const editingBulletin =
                                        queryClient.getQueryData<BulletinPost>([
                                          "editingBulletin",
                                        ]);
                                      if (editingBulletin) {
                                        editBulletinMutation.mutate(
                                          editingBulletin,
                                          {
                                            onSuccess: () => {
                                              queryClient.setQueryData(
                                                ["dialogStates"],
                                                (old: any) => ({
                                                  ...old,
                                                  editBulletinOpen: false,
                                                  editingBulletinId: null,
                                                })
                                              );
                                            },
                                          }
                                        );
                                      }
                                    }}
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                >
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the bulletin and remove
                                    all associated acknowledgments.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteBulletinMutation.mutate(post.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatInTimeZone(
                            post.created_at,
                            "America/Los_Angeles",
                            "PPP"
                          )}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="inline-block bg-primary/10 text-primary rounded px-2 py-1 text-sm">
                        {post.category}
                      </span>
                    </div>
                    <div
                      className="prose dark:prose-invert max-w-none 
                        [&>ul]:list-disc [&>ol]:list-decimal 
                        [&>ul]:ml-6 [&>ol]:ml-6 
                        [&>ul]:my-4 [&>ol]:my-4
                        [&>ul>li>ul]:list-[circle] [&_ol]:list-decimal
                        [&>ul>li>ul]:ml-6 [&_ol]:ml-6 
                        [&>ul>li>ul]:my-2 [&_ol]:my-2
                        [&>ul>li>ul>li>ul]:list-[square]
                        [&_a]:text-blue-500 [&_a]:underline 
                        [&_a:hover]:text-blue-600
                        [&_strong]:font-bold
                        [&_em]:italic
                        [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 
                        [&_blockquote]:pl-4 [&_blockquote]:italic
                        [&_code]:bg-gray-100 [&_code]:p-1 [&_code]:rounded
                        dark:[&_code]:bg-gray-800
                        [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded
                        dark:[&_pre]:bg-gray-800
                        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4
                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3
                        [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </CardContent>
                  {post.requires_acknowledgment && !hasAcknowledged(post) && (
                    <CardFooter>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Acknowledge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Acknowledge Bulletin</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form
                              onSubmit={form.handleSubmit((data) => {
                                acknowledgeMutation.mutate({
                                  postId: post.id,
                                  summary: data.summary,
                                });
                              })}
                              className="space-y-4 py-4"
                            >
                              <p className="text-sm text-muted-foreground">
                                Please provide a brief summary of this bulletin
                                to acknowledge that you have read and understood
                                it. Typing &quot;Ok / Okay&quot; will NOT be
                                accepted as acknowledgment.
                              </p>
                              <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Enter your summary..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit">
                                Submit Acknowledgment
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="acknowledgments">
            <div className="grid gap-6">
              {bulletinPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {acknowledgments
                        .filter((ack) => ack.post_id === post.id)
                        .map((ack) => (
                          <div
                            key={ack.id}
                            className="border rounded-lg p-4 space-y-2"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {ack.employee_name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatInTimeZone(
                                  ack.acknowledged_at,
                                  "America/Los_Angeles",
                                  "PPP"
                                )}
                              </span>
                            </div>
                            <p className="text-sm">{ack.summary}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
}
