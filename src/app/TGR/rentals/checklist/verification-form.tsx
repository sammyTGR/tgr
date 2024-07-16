import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/utils/supabase/client";

interface VerificationFormProps {
  firearmId: number;
  userUuid: string;
  verificationDate: string;
  verificationTime: string;
  onVerificationComplete: (notes: string) => void;
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
  const [withGunsmith, setWithGunsmith] = useState(isWithGunsmith);

  useEffect(() => {
    setWithGunsmith(isWithGunsmith);
  }, [isWithGunsmith]);

  const handleSubmit = async () => {
    if (!serialVerified || !conditionVerified || !magazineAttached) {
      if (!notes && !withGunsmith) {
        alert(
          "Please enter a note explaining why the verification was not complete."
        );
        return;
      }
    }

    const { error } = await supabase.from("firearm_verifications").upsert({
      firearm_id: firearmId,
      verified_by: userUuid,
      verification_date: verificationDate,
      verification_time: verificationTime,
      serial_verified: serialVerified,
      condition_verified: conditionVerified,
      magazine_attached: magazineAttached,
      notes: withGunsmith ? "With Gunsmith" : notes,
    });

    if (error) {
      console.error("Error saving verification:", error.message);
    } else {
      await supabase
        .from("firearms_maintenance")
        .update({ with_gunsmith: withGunsmith })
        .eq("id", firearmId);

      onVerificationComplete(withGunsmith ? "With Gunsmith" : notes);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <Checkbox
              checked={withGunsmith}
              onCheckedChange={(checked) => setWithGunsmith(!!checked)}
              id="with-gunsmith"
            />
            <label htmlFor="with-gunsmith" className="ml-2">
              With Gunsmith
            </label>
          </div>
        </div>
      </div>
      {!withGunsmith && (
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
      )}
      <Button variant="linkHover1" onClick={handleSubmit}>
        Submit Verification
      </Button>
    </div>
  );
}
