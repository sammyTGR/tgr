"use client";

import { usePatchNotes } from "@/lib/hooks/usePatchNotes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { AddPatchNoteDialog } from "./add-patch-note-dialog";
import { useState } from "react";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

export default function PatchNotesPage() {
  const { data: patchNotes, isLoading } = usePatchNotes();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;

  const AdminSection = () => (
    <RoleBasedWrapper allowedRoles={["dev"]}>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Patch Note
      </Button>
    </RoleBasedWrapper>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Patch Notes</h1>
        <AdminSection />
      </div>

      <RoleBasedWrapper allowedRoles={["dev"]}>
        <AddPatchNoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </RoleBasedWrapper>

      <div className="space-y-6">
        {patchNotes?.map((note) => (
          <Card key={note.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {note.title}
                  <Badge variant="secondary" className="ml-2">
                    v{note.version}
                  </Badge>
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(note.release_date), "MMM dd, yyyy")}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{note.description}</p>
              <ScrollArea className="h-full">
                {note.changes.map((change, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-semibold capitalize mb-2">
                      {change.type}:
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {change.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
