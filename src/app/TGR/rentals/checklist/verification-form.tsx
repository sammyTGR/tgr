import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner"; // Import the toast library

interface VerificationFormProps {
  firearmId: number;
  userUuid: string;
  verificationDate: string;
  verificationTime: string;
  onVerificationComplete: (notes: string, firearmId: number) => void;
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
  const [showNotes, setShowNotes] = useState(false); // State to control textarea visibility
  const [withGunsmith, setWithGunsmith] = useState(isWithGunsmith);
  const [rentalOnRange, setRentalOnRange] = useState(false);

  useEffect(() => {
    setWithGunsmith(isWithGunsmith);
    setRentalOnRange(false); // Initialize rentalOnRange to false
  }, [isWithGunsmith]);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default form submission behavior

    const allVerified = serialVerified && conditionVerified && magazineAttached;

    // Check if not all verified and no notes are provided
    if (!allVerified && !withGunsmith && !rentalOnRange && !notes) {
      setShowNotes(true); // Show the textarea if not all checkboxes are selected
      toast.error(
        "Please enter a note explaining why the verification was not complete."
      );
      return; // Exit early if condition is met
    }

    const noteText = allVerified
      ? "Verified"
      : withGunsmith
      ? "With Gunsmith"
      : rentalOnRange
      ? "Currently Rented Out"
      : notes;

    // Save verification data
    const { error: verificationError } = await supabase
      .from("firearm_verifications")
      .upsert({
        firearm_id: firearmId,
        verified_by: userUuid,
        verification_date: verificationDate,
        verification_time: verificationTime,
        serial_verified: serialVerified,
        condition_verified: conditionVerified,
        magazine_attached: magazineAttached,
        notes: noteText,
      });

    if (verificationError) {
      console.error("Error saving verification:", verificationError.message);
      return;
    }

    // Update firearms maintenance notes
    const { error: maintenanceError } = await supabase
      .from("firearms_maintenance")
      .update({ rental_notes: noteText })
      .eq("id", firearmId);

    if (maintenanceError) {
      console.error(
        "Error updating firearms maintenance:",
        maintenanceError.message
      );
      return;
    }

    onVerificationComplete(noteText, firearmId); // Close the dialog and update the state
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
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
        {/* <div className="space-y-4">
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
          <div className="flex items-center">
            <Checkbox
              checked={rentalOnRange}
              onCheckedChange={(checked) => setRentalOnRange(!!checked)}
              id="rental-on-range"
            />
            <label htmlFor="rental-on-range" className="ml-2">
              Rental On Range
            </label>
          </div>
        </div> */}
      </div>
      {showNotes && !withGunsmith && !rentalOnRange && (
        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain details about why the verification was not complete..."
          />
        </div>
      )}
      <Button variant="linkHover1" onClick={handleSubmit}>
        Submit Verification
      </Button>
    </div>
  );
}
