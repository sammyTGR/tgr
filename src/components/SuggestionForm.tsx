import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

interface SuggestionFormProps {
  employeeName: string;
  employeeContactInfo: string;
}

const SuggestionForm: React.FC<SuggestionFormProps> = ({
  employeeName,
  employeeContactInfo,
}) => {
  const sendEmail = async (templateData: any) => {
    const { data: admins, error } = await supabase
      .from("employees")
      .select("contact_info, name")
      .in("name", ["Sammy", "Russ", "Slim Jim", "Michelle"]);

    if (error) throw error;

    const adminEmails = admins.map((admin) => admin.contact_info);

    const response = await fetch("/api/send_email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmails,
        subject: "New Suggestion Submitted",
        templateName: "AdminSuggestionNotification",
        templateData,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    return response.json();
  };

  const submitSuggestion = useMutation({
    mutationFn: async (suggestion: string) => {
      const { data, error } = await supabase
        .from("employee_suggestions")
        .insert([
          { suggestion, created_by: employeeName, email: employeeContactInfo },
        ]);

      if (error) throw error;

      await sendEmail({
        employeeName,
        suggestion,
      });

      return data;
    },
    onSuccess: () => {
      toast.success("Suggestion submitted successfully!");
      toast.success(
        "Thank you for your input. An admin will review your suggestion shortly."
      );
    },
    onError: (error: any) => {
      console.error("Error submitting suggestion:", error);
      toast.error("Failed to submit suggestion. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const suggestion = formData.get("suggestion") as string;

    if (!suggestion.trim()) {
      toast.error("Please enter a suggestion.");
      return;
    }

    submitSuggestion.mutate(suggestion);
    e.currentTarget.reset();
  };

  return (
    <div className="flex flex-col gap-4 space-y-4 p-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="submittedBy" className="text-sm font-medium">
            Suggestion Submitted By:
          </Label>
          <Input
            id="submittedBy"
            value={employeeName}
            disabled
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="suggestion" className="text-sm font-medium">
            Your Suggestion:
          </Label>
          <Textarea
            className="mt-2"
            id="suggestion"
            name="suggestion"
            placeholder="Enter your suggestion here..."
            rows={4}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={submitSuggestion.isPending}
        >
          {submitSuggestion.isPending ? "Submitting..." : "Submit Suggestion"}
        </Button>
      </form>
    </div>
  );
};

export default SuggestionForm;
