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

type BulletinPost = {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by: string;
  requires_acknowledgment: boolean;
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

  const hasAcknowledged = (postId: number) => {
    return acknowledgments.some(
      (ack) =>
        ack.post_id === postId &&
        ack.employee_id === currentEmployee?.employee_id
    );
  };

  const createBulletinMutation = useMutation({
    mutationFn: async (newBulletin: {
      title: string;
      content: string;
      category: string;
      requires_acknowledgment: boolean;
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

  const newBulletinQuery = useQuery<NewBulletin>({
    queryKey: ["newBulletin"],
    queryFn: () => ({
      title: "",
      content: "",
      category: "",
      requires_acknowledgment: false,
    }),
    staleTime: Infinity,
  });

  const updateNewBulletin = (updates: Partial<NewBulletin>) => {
    queryClient.setQueryData<NewBulletin>(["newBulletin"], (old) => ({
      title: old?.title || "",
      content: old?.content || "",
      category: old?.category || "",
      requires_acknowledgment: old?.requires_acknowledgment || false,
      ...updates,
    }));
  };

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

  const editBulletinMutation = useMutation({
    mutationFn: async (bulletin: BulletinPost) => {
      const { error } = await supabase
        .from("bulletin_posts")
        .update({
          title: bulletin.title,
          content: bulletin.content,
          category: bulletin.category,
          requires_acknowledgment: bulletin.requires_acknowledgment,
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
    }),
    staleTime: Infinity,
  });

  const form = useForm<AcknowledgmentFormValues>({
    resolver: zodResolver(acknowledgmentSchema),
    defaultValues: {
      summary: "",
    },
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
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Bulletin</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newBulletinQuery.data?.title}
                      onChange={(e) =>
                        updateNewBulletin({ title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newBulletinQuery.data?.category}
                      onValueChange={(value) =>
                        updateNewBulletin({ category: value })
                      }
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
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newBulletinQuery.data?.content}
                      onChange={(e) =>
                        updateNewBulletin({ content: e.target.value })
                      }
                      rows={5}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_acknowledgment"
                      checked={newBulletinQuery.data?.requires_acknowledgment}
                      onCheckedChange={(checked) =>
                        updateNewBulletin({ requires_acknowledgment: checked })
                      }
                    />
                    <Label htmlFor="requires_acknowledgment">
                      Requires Acknowledgment
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (newBulletinQuery.data) {
                        createBulletinMutation.mutate(newBulletinQuery.data, {
                          onSuccess: () => {
                            queryClient.setQueryData(
                              ["dialogStates"],
                              (old: any) => ({
                                ...old,
                                createBulletinOpen: false,
                              })
                            );
                            queryClient.setQueryData<NewBulletin>(
                              ["newBulletin"],
                              {
                                title: "",
                                content: "",
                                category: "",
                                requires_acknowledgment: false,
                              }
                            );
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
                              open={dialogStatesQuery.data?.editBulletinOpen}
                              onOpenChange={(open) => {
                                queryClient.setQueryData(
                                  ["dialogStates"],
                                  (old: any) => ({
                                    ...old,
                                    editBulletinOpen: open,
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
                              <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Bulletin</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
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
                                  <div className="grid gap-2">
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
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-content">
                                      Content
                                    </Label>
                                    <Textarea
                                      id="edit-content"
                                      defaultValue={post.content}
                                      onChange={(e) => {
                                        queryClient.setQueryData<BulletinPost | null>(
                                          ["editingBulletin"],
                                          (old) =>
                                            old
                                              ? {
                                                  ...old,
                                                  content: e.target.value,
                                                }
                                              : null
                                        );
                                      }}
                                      rows={5}
                                    />
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
                    <p className="whitespace-pre-wrap">{post.content}</p>
                  </CardContent>
                  {post.requires_acknowledgment &&
                    !hasAcknowledged(post.id) && (
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
                                  Please provide a brief summary of this
                                  bulletin to acknowledge that you have read and
                                  understood it.
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
