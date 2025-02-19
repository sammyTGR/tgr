"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { useForm } from "react-hook-form";
import type { Content } from "@tiptap/react";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    guidelines: string;
  };
  onSubmit: (data: { name: string; guidelines: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CategoryFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      name: category?.name || "",
      guidelines: category?.guidelines || "",
    },
  });

  const onFormSubmit = async (data: { name: string; guidelines: string }) => {
    try {
      await onSubmit(data);
      onCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guidelines">Guidelines</Label>
        <div className="min-h-[300px] border rounded-md overflow-hidden">
          <MinimalTiptapEditor
            value={watch("guidelines")}
            onChange={(newContent: Content) => {
              setValue("guidelines", newContent?.toString() ?? "");
            }}
            className="w-full h-full"
            editorContentClassName="p-4"
            output="html"
            placeholder="Enter guidelines..."
            editorClassName="focus:outline-none min-h-[300px]"
            editable={!isSubmitting}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
