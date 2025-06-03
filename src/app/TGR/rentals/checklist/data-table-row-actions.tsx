'use client';
import { useState } from 'react';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/utils/supabase/client';
import { FirearmsMaintenanceData } from './columns';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VerificationForm } from './verification-form';
import EditFirearmForm from './EditFirearmForm';
import { Textarea } from '@/components/ui/textarea';

interface DataTableRowActionsProps {
  row: Row<FirearmsMaintenanceData>;
  userRole: string;
  userUuid: string;
  onNotesChange: (id: number, notes: string) => void;
  onVerificationComplete: () => void;
  onDeleteFirearm: (id: number) => void; // Add this prop
  onEditFirearm: (updatedFirearm: {
    id: number;
    firearm_type: string;
    firearm_name: string;
    maintenance_frequency: number | null;
  }) => void;
  onRequestInspection: (id: number, notes: string) => void;
}

export function DataTableRowActions({
  row,
  userRole,
  userUuid,
  onNotesChange,
  onVerificationComplete,
  onDeleteFirearm, // Add this prop
  onEditFirearm, // Add this prop
  onRequestInspection,
}: DataTableRowActionsProps) {
  const task = row.original;
  const [openVerification, setOpenVerification] = useState(false);
  const [data, setData] = useState<FirearmsMaintenanceData[]>([]);
  const [openEditFirearm, setOpenEditFirearm] = useState(false);
  const [openInspectionRequest, setOpenInspectionRequest] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const handleRequestInspection = () => {
    onRequestInspection(task.id, inspectionNotes);
    setOpenInspectionRequest(false);
    setInspectionNotes('');
  };

  const handleSetGunsmithStatus = async (status: string) => {
    try {
      if (status === 'Returned From Gunsmith') {
        const { error } = await supabase
          .from('firearms_maintenance')
          .update({ rental_notes: '', verified_status: '' })
          .eq('id', task.id);

        if (error) {
          throw error;
        }

        onNotesChange(task.id, ''); // Clear the note in the state
      } else if (status === 'With Gunsmith') {
        const { error } = await supabase
          .from('firearms_maintenance')
          .update({ rental_notes: 'With Gunsmith', verified_status: null })
          .eq('id', task.id);

        if (error) {
          throw error;
        }

        onNotesChange(task.id, 'With Gunsmith'); // Update the local state
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error setting gunsmith status:', error.message);
      } else {
        console.error('An unknown error occurred.');
      }
    }
  };

  const handleWarrantyStatus = async (status: string) => {
    try {
      if (status === 'Returned From Warranty') {
        const { error } = await supabase
          .from('firearms_maintenance')
          .update({ rental_notes: '', verified_status: '' })
          .eq('id', task.id);

        if (error) {
          throw error;
        }

        onNotesChange(task.id, ''); // Clear the note in the state
      } else if (status === 'Out For Warranty Repair') {
        const { error } = await supabase
          .from('firearms_maintenance')
          .update({ rental_notes: 'Out For Warranty Repair', verified_status: null })
          .eq('id', task.id);

        if (error) {
          throw error;
        }

        onNotesChange(task.id, 'Out For Warranty Repair'); // Update the local state
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error setting warranty status:', error.message);
      } else {
        console.error('An unknown error occurred.');
      }
    }
  };

  const handleEditFirearm = (updatedFirearm: {
    id: number;
    firearm_type: string;
    firearm_name: string;
    maintenance_frequency: number;
  }) => {
    onEditFirearm(updatedFirearm); // Call the parent handler
    setOpenEditFirearm(false);
  };

  const handleRentalReturned = async (firearmId: number) => {
    try {
      // Clear rental_notes and verified_status in the database
      await supabase
        .from('firearms_maintenance')
        .update({ rental_notes: '', verified_status: '' })
        .eq('id', firearmId);

      // Update the local state to reflect the removal of the "Currently Rented Out" note
      onNotesChange(firearmId, ''); // Update the local state
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error setting rental returned status:', error.message);
      } else {
        console.error('An unknown error occurred.');
      }
    }
  };

  const handleRentalOnRange = async (firearmId: number) => {
    try {
      // Set rental notes to "Currently Rented Out"
      await supabase
        .from('firearms_maintenance')
        .update({
          rental_notes: 'Currently Rented Out',
          verified_status: 'Currently Rented Out',
        })
        .eq('id', firearmId);

      onNotesChange(firearmId, 'Currently Rented Out'); // Update the local state
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error setting rental on range status:', error.message);
      } else {
        console.error('An unknown error occurred.');
      }
    }
  };

  const handleDeleteFirearm = async () => {
    try {
      await supabase.from('firearms_maintenance').delete().eq('id', task.id);

      onDeleteFirearm(task.id); // Call the parent handler
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error deleting firearm:', error.message);
      } else {
        console.error('An unknown error occurred.');
      }
    }
  };

  // const completeVerification = async (notes: string, firearmId: number) => {
  //   try {
  //     // Update the rental_notes field in the database to the given notes
  //     const { error } = await supabase
  //       .from("firearms_maintenance")
  //       .update({ rental_notes: notes })
  //       .eq("id", firearmId);

  //     if (error) {
  //       console.error("Error updating rental_notes:", error.message);
  //       return;
  //     }

  //     // Update the local state in the parent component
  //     onNotesChange(firearmId, notes);

  //     // Fetch updated data if necessary, or perform any additional actions
  //     await onVerificationComplete();

  //     // Close the verification dialog
  //     setOpenVerification(false);
  //   } catch (error) {
  //     console.error("Error in completeVerification:", error);
  //   }
  // };

  const completeVerification = (notes: string, firearmId: number) => {
    setOpenVerification(false);
    onNotesChange(firearmId, notes); // Update the notes
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onSelect={() => setOpenVerification(true)}>
            Verify Firearm
          </DropdownMenuItem>
          {['admin', 'super admin', 'dev'].includes(userRole) && (
            <>
              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    const { data: firearm, error: fetchError } = await supabase
                      .from('firearms_maintenance')
                      .select('rental_notes')
                      .eq('id', task.id)
                      .single();

                    if (fetchError) {
                      throw fetchError;
                    }

                    // Reset if rental_notes contains anything other than "With Gunsmith"
                    if (firearm?.rental_notes !== 'With Gunsmith') {
                      await supabase
                        .from('firearms_maintenance')
                        .update({ rental_notes: '', verified_status: '' })
                        .eq('id', task.id);

                      // Update the local state to reflect the reset
                      onNotesChange(task.id, '');
                    }

                    // Optionally, close the dialog or refresh data
                    setOpenVerification(false);
                  } catch (error) {
                    console.error('Error resetting verification:', error);
                  }
                }}
              >
                Reset Verification
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Rented Out</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => handleRentalOnRange(task.id)}>
                Rental On Range
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleRentalReturned(task.id)}>
                Rental Returned
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {/* <DropdownMenuSeparator /> */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Gunsmithing</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => handleSetGunsmithStatus('With Gunsmith')}>
                With Gunsmith
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSetGunsmithStatus('Returned From Gunsmith')}>
                Returned From Gunsmith
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setOpenInspectionRequest(true)}>
                Request Inspection
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Warranty Repairs</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => handleWarrantyStatus('Out For Warranty Repair')}>
                Out For Warranty Repair
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleWarrantyStatus('Returned From Warranty')}>
                Returned From Warranty Repair
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {['admin', 'super admin', 'dev'].includes(userRole) && (
            <>
              <DropdownMenuItem onSelect={() => setOpenEditFirearm(true)}>
                Edit Firearm
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleDeleteFirearm}>Delete Firearm</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={openVerification} onOpenChange={setOpenVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Firearm</DialogTitle>
            <DialogDescription>Please verify the firearm details.</DialogDescription>
          </DialogHeader>
          <VerificationForm
            firearmId={task.id}
            userUuid={userUuid}
            verificationDate={new Date().toISOString().split('T')[0]}
            verificationTime={new Date().getHours() < 14 ? 'morning' : 'evening'}
            onVerificationComplete={completeVerification}
            isWithGunsmith={
              task.notes === 'With Gunsmith' || task.notes === 'Out For Warranty Repair'
            }
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="linkHover2">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openEditFirearm} onOpenChange={setOpenEditFirearm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Firearm</DialogTitle>
            <DialogDescription>Please edit the firearm details.</DialogDescription>
          </DialogHeader>
          <EditFirearmForm
            firearm={{
              id: row.original.id,
              firearm_type: row.original.firearm_type,
              firearm_name: row.original.firearm_name,
              maintenance_frequency: row.original.maintenance_frequency ?? undefined,
            }}
            onEdit={handleEditFirearm}
            onCancel={() => setOpenEditFirearm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openInspectionRequest} onOpenChange={setOpenInspectionRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Inspection</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Explain what's going on with the firearm..."
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="linkHover2" onClick={() => setOpenInspectionRequest(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleRequestInspection}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
