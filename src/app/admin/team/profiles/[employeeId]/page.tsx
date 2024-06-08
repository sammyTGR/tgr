"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Correct import
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";

interface Note {
  id: number;
  profile_employee_id: number; // Changed to number to match integer type
  employee_id: number; // Changed to number to match integer type
  note: string;
  type: string;
  created_at: string;
}

const EmployeeProfile = () => {
  const params = useParams()!;
  const employeeIdParam = params.employeeId; // Get the employeeId from the URL

  // Convert employeeId to integer
  const employeeId = Array.isArray(employeeIdParam) ? parseInt(employeeIdParam[0], 10) : parseInt(employeeIdParam, 10);

  console.log("Employee ID from URL:", employeeId); // Debug output

  const [activeTab, setActiveTab] = useState("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newAbsence, setNewAbsence] = useState("");
  const [newGrowth, setNewGrowth] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const { user } = useRole(); // Get user from RoleContext

  useEffect(() => {
    console.log("User:", user);
    if (user && employeeId) {
      fetchEmployeeData();
      fetchNotes();
      subscribeToNoteChanges();
    }
  }, [user, employeeId]);

  const fetchEmployeeData = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    if (error) {
      console.error("Error fetching employee data:", error.message);
    } else {
      console.log("Employee Data:", data); // Debug output
      setEmployee(data);
    }
  };

  const fetchNotes = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employee_profile_notes")
      .select("*")
      .eq("profile_employee_id", employeeId);

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      console.log("Notes Data:", data); // Debug output
      setNotes(data as Note[]);
    }
  };

  const subscribeToNoteChanges = () => {
    if (!employeeId) return;

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_profile_notes" },
        (payload) => {
          console.log("Change received!", payload);
          fetchNotes(); // Re-fetch notes on any change
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddNote = async (type: string) => {
    let noteContent = "";
    switch (type) {
      case "notes":
        noteContent = newNote;
        break;
      case "reviews":
        noteContent = newReview;
        break;
      case "growth":
        noteContent = newGrowth;
        break;
      case "absence":
        noteContent = newAbsence;
        break;
      default:
        return;
    }

    if (!employeeId || noteContent.trim() === "") return;

    const { data, error } = await supabase
      .from("employee_profile_notes")
      .insert([
        { 
          profile_employee_id: employeeId, 
          employee_id: parseInt(user.id, 10), // Assuming `user.id` contains the integer ID of the admin creating the note
          note: noteContent, 
          type 
        }
      ]);

    if (error) {
      console.error("Error adding note:", error);
    } else if (data) {
      // Clear the input field for the specific type
      switch (type) {
        case "notes":
          setNewNote("");
          break;
        case "reviews":
          setNewReview("");
          break;
        case "growth":
          setNewGrowth("");
          break;
        case "absence":
          setNewAbsence("");
          break;
      }
    }
  };

  const handleDeleteNote = async (id: number) => {
    const { error } = await supabase
      .from("employee_profile_notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting note:", error);
    } else {
      setNotes(notes.filter((note) => note.id !== id));
    }
  };

  const handleEditNote = async (id: number, updatedNote: string | null) => {
    if (updatedNote === null || updatedNote.trim() === "") return;

    const { error } = await supabase
      .from("employee_profile_notes")
      .update({ note: updatedNote })
      .eq("id", id);

    if (error) {
      console.error("Error updating note:", error);
    } else {
      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, note: updatedNote } : note
        )
      );
    }
  };

  if (!employee) return <div>Loading...</div>;

  return (
    <Card className="h-full max-w-4xl mx-auto my-12">
      <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Avatar>
            <img src={employee.avatar_url || "/placeholder.svg"} alt="Employee Avatar" />
            <AvatarFallback>{employee.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{employee.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {employee.position}
            </p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <Tabs
          defaultValue="notes"
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="absences">Absences</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="growth">Growth Tracking</TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <div className="p-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="new-note">Add a new note</Label>
                <Textarea
                  id="new-note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type your note here..."
                  className="min-h-[100px]"
                />
                <Button onClick={() => handleAddNote("notes")}>Add Note</Button>
              </div>
              <div className="grid gap-4">
                {notes
                  .filter((note) => note.type === "notes")
                  .map((note) => (
                    <div
                      key={note.id}
                      className="flex justify-between items-start"
                    >
                      <div>
                        <div className="text-sm font-medium">{note.note}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleEditNote(
                              note.id,
                              prompt("Edit note:", note.note) ?? note.note
                            )
                          }
                        >
                          <Pencil1Icon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="absences">
            <div className="p-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="new-absence">Add a new absence</Label>
                <Textarea
                  id="new-absence"
                  value={newAbsence}
                  onChange={(e) => setNewAbsence(e.target.value)}
                  placeholder="Enter date and reason for absence (e.g., 2023-12-01: Called out sick)"
                  className="min-h-[100px]"
                />
                <Button onClick={() => handleAddNote("absence")}>Add Absence</Button>
              </div>
              <div className="grid gap-4">
                {notes
                  .filter((note) => note.type === "absence")
                  .map((note) => (
                    <div key={note.id} className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">{note.note}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleEditNote(
                              note.id,
                              prompt("Edit absence:", note.note) ?? note.note
                            )
                          }
                        >
                          <Pencil1Icon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            <div className="p-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="new-review">Add a new review</Label>
                <Textarea
                  id="new-review"
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Type your review here..."
                  className="min-h-[100px]"
                />
                <Button onClick={() => handleAddNote("reviews")}>
                  Add Review
                </Button>
              </div>
              <div className="grid gap-4">
                {notes
                  .filter((note) => note.type === "reviews")
                  .map((note) => (
                    <div
                      key={note.id}
                      className="flex justify-between items-start"
                    >
                      <div>
                        <div className="text-sm font-medium">{note.note}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleEditNote(
                              note.id,
                              prompt("Edit note:", note.note) ?? note.note
                            )
                          }
                        >
                          <Pencil1Icon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="growth">
            <div className="p-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="new-growth">
                  Add a new growth tracking entry
                </Label>
                <Textarea
                  id="new-growth"
                  value={newGrowth}
                  onChange={(e) => setNewGrowth(e.target.value)}
                  placeholder="Type your growth tracking entry here..."
                  className="min-h-[100px]"
                />
                <Button onClick={() => handleAddNote("growth")}>
                  Add Entry
                </Button>
              </div>
              <div className="grid gap-4">
                {notes
                  .filter((note) => note.type === "growth")
                  .map((note) => (
                    <div
                      key={note.id}
                      className="flex justify-between items-start"
                    >
                      <div>
                        <div className="text-sm font-medium">{note.note}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleEditNote(
                              note.id,
                              prompt("Edit note:", note.note) ?? note.note
                            )
                          }
                        >
                          <Pencil1Icon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default EmployeeProfile;
