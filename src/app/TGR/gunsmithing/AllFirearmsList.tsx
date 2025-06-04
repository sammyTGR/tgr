import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { FirearmsMaintenanceData } from './columns';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import the Card components
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface AllFirearmsListProps {
  userRole: string | null;
}

const AllFirearmsList: React.FC<AllFirearmsListProps> = ({ userRole }) => {
  const [firearms, setFirearms] = useState<FirearmsMaintenanceData[]>([]);
  const [selectedFirearm, setSelectedFirearm] = useState<FirearmsMaintenanceData | null>(null);
  const [notes, setNotes] = useState('');
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isWarrantyRepair, setIsWarrantyRepair] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    const fetchAllFirearms = async () => {
      const { data, error } = await supabase.from('firearms_maintenance').select('*');
      if (error) {
        console.error('Error fetching all firearms:', error.message);
        return;
      }
      setFirearms(data);
    };

    fetchAllFirearms();
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleCheckOutForRepairs = async () => {
    if (!selectedFirearm) return;

    try {
      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
          rental_notes: 'With Gunsmith',
          verified_status: null,
          maintenance_notes: notes,
          last_maintenance_date: new Date().toISOString(),
        })
        .eq('id', selectedFirearm.id);

      if (error) {
        throw error;
      }

      setFirearms((prevData) =>
        prevData.map((item) =>
          item.id === selectedFirearm.id
            ? {
                ...item,
                rental_notes: 'With Gunsmith',
                verified_status: null,
                maintenance_notes: notes,
                last_maintenance_date: new Date().toISOString(),
              }
            : item
        )
      );

      setIsCheckedOut(true);
      setShowNotes(true);
      toast.success('Firearm checked out for repairs');
    } catch (error) {
      console.error('Error checking out firearm:', error);
      toast.error('Failed to check out firearm');
    }
  };

  const handleWarrantyRepair = async () => {
    if (!selectedFirearm) return;

    try {
      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
          rental_notes: 'Out For Warranty Repair',
          verified_status: null,
          maintenance_notes: notes,
          last_maintenance_date: new Date().toISOString(),
        })
        .eq('id', selectedFirearm.id);

      if (error) {
        throw error;
      }

      setFirearms((prevData) =>
        prevData.map((item) =>
          item.id === selectedFirearm.id
            ? {
                ...item,
                rental_notes: 'Out For Warranty Repair',
                verified_status: null,
                maintenance_notes: notes,
                last_maintenance_date: new Date().toISOString(),
              }
            : item
        )
      );

      setIsWarrantyRepair(true);
      setShowNotes(false);
      toast.success('Firearm sent for warranty repair');
    } catch (error) {
      console.error('Error sending firearm for warranty repair:', error);
      toast.error('Failed to send firearm for warranty repair');
    }
  };

  const handleReturnFromWarranty = async () => {
    if (!selectedFirearm) return;

    try {
      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
          rental_notes: 'Returned From Warranty Repair',
          verified_status: '',
          maintenance_notes: notes,
          last_maintenance_date: new Date().toISOString(),
        })
        .eq('id', selectedFirearm.id);

      if (error) {
        throw error;
      }

      setFirearms((prevData) =>
        prevData.map((item) =>
          item.id === selectedFirearm.id
            ? {
                ...item,
                rental_notes: 'Returned From Warranty Repair',
                verified_status: '',
                maintenance_notes: notes,
                last_maintenance_date: new Date().toISOString(),
              }
            : item
        )
      );

      setIsWarrantyRepair(false);
      setSelectedFirearm(null);
      toast.success('Firearm returned from warranty repair');
    } catch (error) {
      console.error('Error returning firearm from warranty repair:', error);
      toast.error('Failed to return firearm from warranty repair');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFirearm) return;

    try {
      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
          rental_notes: isCheckedOut
            ? 'Returned From Gunsmith'
            : isWarrantyRepair
              ? 'Returned From Warranty Repair'
              : '',
          verified_status: isCheckedOut || isWarrantyRepair ? '' : null,
          maintenance_notes: notes,
          last_maintenance_date: new Date().toISOString(),
        })
        .eq('id', selectedFirearm.id);

      if (error) {
        throw error;
      }

      setFirearms((prevData) =>
        prevData.map((item) =>
          item.id === selectedFirearm.id
            ? {
                ...item,
                rental_notes: isCheckedOut
                  ? 'Returned From Gunsmith'
                  : isWarrantyRepair
                    ? 'Returned From Warranty Repair'
                    : '',
                verified_status: isCheckedOut || isWarrantyRepair ? '' : null,
                maintenance_notes: notes,
                last_maintenance_date: new Date().toISOString(),
              }
            : item
        )
      );

      setNotes('');
      setSelectedFirearm(null);
      setIsCheckedOut(false);
      setIsWarrantyRepair(false);
      setShowNotes(false);
      toast.success(
        isCheckedOut
          ? 'Firearm checked back in'
          : isWarrantyRepair
            ? 'Firearm returned from warranty repair'
            : 'Notes saved successfully'
      );
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  return (
    // <Card>
    //   <CardHeader>
    //     <CardTitle>Select A Firearm</CardTitle>
    //   </CardHeader>
    <CardContent>
      <div className="mt-4">
        <Select
          value={selectedFirearm ? String(selectedFirearm.id) : ''}
          onValueChange={(value) => {
            const firearm = firearms.find((f) => f.id === Number(value));
            setSelectedFirearm(firearm || null);
            setNotes(firearm?.maintenance_notes || '');
            setIsCheckedOut(firearm?.rental_notes === 'With Gunsmith');
            setIsWarrantyRepair(firearm?.rental_notes === 'Out For Warranty Repair');
            setShowNotes(firearm?.rental_notes === 'With Gunsmith');
          }}
        >
          <SelectTrigger className="w-full border border-gray-300 rounded-md shadow-sm">
            <SelectValue placeholder="Select a firearm" />
          </SelectTrigger>
          <SelectContent>
            {firearms.map((firearm) => (
              <SelectItem key={firearm.id} value={String(firearm.id)}>
                {firearm.firearm_name} ({firearm.firearm_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedFirearm && (
        <div className="mb-4">
          {showNotes && (
            <>
              <label className="block text-sm font-medium">Maintenance Notes</label>
              <Textarea
                name="maintenance_notes"
                value={notes}
                onChange={handleNotesChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
              />
            </>
          )}
          <div className="flex gap-2 mt-2">
            {!isCheckedOut && !isWarrantyRepair && (
              <Button onClick={handleCheckOutForRepairs} variant="outline" effect="shineHover">
                Check Out Firearm For Repairs
              </Button>
            )}
            {isWarrantyRepair && (
              <Button onClick={handleReturnFromWarranty} variant="outline" effect="shineHover">
                Return From Warranty Repair
              </Button>
            )}
            {showNotes && (
              <>
                <Button onClick={handleSaveNotes} variant="outline" effect="shineHover">
                  {isCheckedOut
                    ? 'Save & Check Firearm Back In'
                    : isWarrantyRepair
                      ? 'Save & Return From Warranty Repair'
                      : 'Save Notes'}
                </Button>
                <Button onClick={handleWarrantyRepair} variant="outline" effect="ringHover">
                  Send For Warranty Repair
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </CardContent>
    // </Card>
  );
};

export default AllFirearmsList;
