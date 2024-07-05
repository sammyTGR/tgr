// src/app/TGR/rentals/checklist/verification-form.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/utils/supabase/client";

interface VerificationFormProps {
  firearmId: number;
  userUuid: string;
  verificationDate: string;
  verificationTime: string;
  onVerificationComplete: (notes: string) => void; // Pass notes on completion
  isWithGunsmith: boolean; // Add this prop to conditionally render form
}

export function VerificationForm({
  firearmId,
  userUuid,
  verificationDate,
  verificationTime,
  onVerificationComplete,
  isWithGunsmith,
}: VerificationFormProps) {
  const [serialVerified, setSerialVerified] = useState(false);
  const [conditionVerified, setConditionVerified] = useState(false);
  const [magazineAttached, setMagazineAttached] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!serialVerified || !conditionVerified || !magazineAttached) {
      if (!notes) {
        setError(
          "Please enter a note explaining why the verification was not complete."
        );
        return;
      }
    } else {
      setError("");
    }

    const { error } = await supabase.from("firearm_verifications").insert({
      firearm_id: firearmId,
      verified_by: userUuid,
      verification_date: verificationDate,
      verification_time: verificationTime,
      serial_verified: serialVerified,
      condition_verified: conditionVerified,
      magazine_attached: magazineAttached,
      notes,
    });

    if (error) {
      console.error("Error saving verification:", error.message);
    } else {
      const updateData =
        verificationTime === "morning"
          ? { morning_checked: true }
          : { evening_checked: true };
      await supabase
        .from("firearms_maintenance")
        .update(updateData)
        .eq("id", firearmId);

      onVerificationComplete(notes); // Pass notes back to parent
    }
  };

  return (
    <div className="space-y-4">
      {isWithGunsmith ? (
        <p>This firearm is with the gunsmith and cannot be verified.</p>
      ) : (
        <>
          <div className="flex items-center">
            <Checkbox
              checked={serialVerified}
              onCheckedChange={(checked) => setSerialVerified(!!checked)}
              id="serial-verified"
            />
            <label htmlFor="serial-verified" className="ml-2">
              Serial Number Verified
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={conditionVerified}
              onCheckedChange={(checked) => setConditionVerified(!!checked)}
              id="condition-verified"
            />
            <label htmlFor="condition-verified" className="ml-2">
              Condition Verified
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              checked={magazineAttached}
              onCheckedChange={(checked) => setMagazineAttached(!!checked)}
              id="magazine-attached"
            />
            <label htmlFor="magazine-attached" className="ml-2">
              Magazine Attached
            </label>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes..."
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <Button variant="linkHover1" onClick={handleSubmit}>
            Submit Verification
          </Button>
        </>
      )}
    </div>
  );
}
