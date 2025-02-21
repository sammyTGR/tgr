"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Trash } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface AddPatchNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ChangeType = "added" | "changed" | "fixed" | "removed";

interface ChangeSection {
  type: ChangeType;
  items: string[];
}

export function AddPatchNoteDialog({
  open,
  onOpenChange,
}: AddPatchNoteDialogProps) {
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [changes, setChanges] = useState<ChangeSection[]>([
    { type: "added", items: [""] },
  ]);

  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();

  const addPatchNoteMutation = useMutation({
    mutationFn: async (patchNote: any) => {
      const { error } = await supabase.from("patch_notes").insert(patchNote);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patch-notes"] });
      resetForm();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setVersion("");
    setTitle("");
    setDescription("");
    setChanges([{ type: "added", items: [""] }]);
  };

  const addChangeSection = () => {
    setChanges([...changes, { type: "added", items: [""] }]);
  };

  const removeChangeSection = (index: number) => {
    setChanges(changes.filter((_, i) => i !== index));
  };

  const addChangeItem = (sectionIndex: number) => {
    const newChanges = [...changes];
    newChanges[sectionIndex].items.push("");
    setChanges(newChanges);
  };

  const removeChangeItem = (sectionIndex: number, itemIndex: number) => {
    const newChanges = [...changes];
    newChanges[sectionIndex].items = newChanges[sectionIndex].items.filter(
      (_, i) => i !== itemIndex
    );
    setChanges(newChanges);
  };

  const updateChangeType = (sectionIndex: number, type: ChangeType) => {
    const newChanges = [...changes];
    newChanges[sectionIndex].type = type;
    setChanges(newChanges);
  };

  const updateChangeItem = (
    sectionIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const newChanges = [...changes];
    newChanges[sectionIndex].items[itemIndex] = value;
    setChanges(newChanges);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filteredChanges = changes
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.trim() !== ""),
      }))
      .filter((section) => section.items.length > 0);

    addPatchNoteMutation.mutate({
      version,
      title,
      description,
      changes: filteredChanges,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patch Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Update Title"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the update"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Changes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChangeSection}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>

            {changes.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="space-y-2 p-4 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Select
                    value={section.type}
                    onValueChange={(value: ChangeType) =>
                      updateChangeType(sectionIndex, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="added">Added</SelectItem>
                      <SelectItem value="changed">Changed</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="removed">Removed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChangeSection(sectionIndex)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>

                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) =>
                        updateChangeItem(
                          sectionIndex,
                          itemIndex,
                          e.target.value
                        )
                      }
                      placeholder="Change description"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChangeItem(sectionIndex, itemIndex)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addChangeItem(sectionIndex)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addPatchNoteMutation.isPending}>
              {addPatchNoteMutation.isPending ? "Saving..." : "Save Patch Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
