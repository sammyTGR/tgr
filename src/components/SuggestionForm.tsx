import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

interface SuggestionFormProps {
  employeeName: string;
  employeeContactInfo: string;
}

const SuggestionForm: React.FC<SuggestionFormProps> = ({
  employeeName,
  employeeContactInfo,
}) => {
  const [suggestion, setSuggestion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!suggestion.trim()) {
      toast.error("Please enter a suggestion.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("employee_suggestions")
        .insert([
          { suggestion, created_by: employeeName, email: employeeContactInfo },
        ]);

      if (error) throw error;

      toast.success("Suggestion submitted successfully!");
      setSuggestion("");
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast.error("Failed to submit suggestion. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="submittedBy">Suggestion Submitted By:</Label>
        <Input id="submittedBy" value={employeeName} disabled />
      </div>
      <div>
        <Label htmlFor="suggestion">Your Suggestion:</Label>
        <Textarea
          id="suggestion"
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Enter your suggestion here..."
          rows={4}
        />
      </div>
      <Button type="submit" variant="linkHover1">
        Submit Suggestion
      </Button>
    </form>
  );
};

export default SuggestionForm;
