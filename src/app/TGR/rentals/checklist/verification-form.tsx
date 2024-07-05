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
  onVerificationComplete: () => void;
}

export function VerificationForm({
  firearmId,
  userUuid,
  verificationDate,
  verificationTime,
  onVerificationComplete,
}: VerificationFormProps) {
  const [serialVerified, setSerialVerified] = useState(false);
  const [conditionVerified, setConditionVerified] = useState(false);
  const [magazineAttached, setMagazineAttached] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
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
      // Mark the firearm as checked in the firearms_maintenance table
      await supabase
        .from("firearms_maintenance")
        .update({ checked: true })
        .eq("id", firearmId);

      onVerificationComplete();
    }
  };

  return (
    <div className="space-y-4">
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
      </div>
      <Button onClick={handleSubmit}>Submit Verification</Button>
    </div>
  );
}
