import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface VerificationFormProps {
  firearmId: number;
  userUuid: string;
  verificationDate: string;
  verificationTime: string;
  onVerificationComplete: (notes: string, firearmId: number) => void;
  isWithGunsmith: boolean;
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
  const [withGunsmith, setWithGunsmith] = useState(isWithGunsmith);
  const [rentalOnRange, setRentalOnRange] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false); // State to control Alert Dialog visibility

  useEffect(() => {
    setWithGunsmith(isWithGunsmith);
    setRentalOnRange(false);
  }, [isWithGunsmith]);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    const allVerified = serialVerified && conditionVerified && magazineAttached;

    // Check if not all verified and trigger the Alert Dialog
    if (!allVerified && !withGunsmith && !rentalOnRange) {
      setShowAlertDialog(true);
      return;
    }

    const noteText = allVerified
      ? 'Verified'
      : withGunsmith
        ? 'With Gunsmith'
        : rentalOnRange
          ? 'Currently Rented Out'
          : '';

    // Save verification data
    const { error: verificationError } = await supabase.from('firearm_verifications').upsert({
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
      console.error('Error saving verification:', verificationError.message);
      return;
    }

    // Update firearms maintenance notes and verified_status
    const { error: maintenanceError } = await supabase
      .from('firearms_maintenance')
      .update({
        rental_notes: noteText,
        verified_status: allVerified ? 'Verified' : null,
      })
      .eq('id', firearmId);

    if (maintenanceError) {
      console.error('Error updating firearms maintenance:', maintenanceError.message);
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
              Overall Condition Verified
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
          <p className="text-sm text-red-500">
            The overall condition is defined as ensuring the sights or optic are on, aligned and in
            working order, the frame is in the same condition, the slide/bolt is locked back, and
            the firearm is cleared.
          </p>
        </div>
      </div>

      <Button variant="linkHover1" onClick={handleSubmit}>
        Submit Verification
      </Button>

      <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <AlertDialogTrigger asChild>
          <Button className="hidden">Trigger</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firearm Not Verified</AlertDialogTitle>
            <AlertDialogDescription>
              Since this firearm doesn&apos;t pass verification, please bring it to management{' '}
              <span className="text-red-500">IMMEDIATELY</span> to report the damage, then mark the
              firearm as &quot;With Gunsmith&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAlertDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowAlertDialog(false)}>Got It!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
