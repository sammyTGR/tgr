"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { Content } from "@tiptap/react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  guidelines: z.string().min(1, "Guidelines are required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    guidelines: string;
  };
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isSubmitting,
}: CategoryFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || "",
      guidelines: category?.guidelines || "",
    },
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      await onSubmit(data);
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    form.reset(); // Reset form when canceling
    onCancel(); // Call the onCancel prop to close the dialog
  };

  const handleEditorUpdate = (content: Content) => {
    form.setValue("guidelines", JSON.stringify(content));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter category name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guidelines"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Guidelines</FormLabel>
              <FormControl>
                <div className="min-h-[200px] border rounded-md">
                  <MinimalTiptapEditor
                    content={field.value}
                    onChange={(newContent) => {
                      field.onChange(newContent);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : category ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
