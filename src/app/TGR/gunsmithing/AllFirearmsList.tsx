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

interface AllFirearmsListProps {
  userRole: string | null;
}

const AllFirearmsList: React.FC<AllFirearmsListProps> = ({ userRole }) => {
  const [firearms, setFirearms] = useState<FirearmsMaintenanceData[]>([]);
  const [selectedFirearm, setSelectedFirearm] = useState<FirearmsMaintenanceData | null>(null);
  const [notes, setNotes] = useState('');

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

  const handleSaveNotes = async () => {
    if (!selectedFirearm) return;

    try {
      const { error } = await supabase
        .from('firearms_maintenance')
        .update({
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
                maintenance_notes: notes,
                last_maintenance_date: new Date().toISOString(),
              }
            : item
        )
      );

      setNotes('');
      setSelectedFirearm(null);
    } catch (error) {
      console.error('Error saving notes:', error);
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
          <label className="block text-sm font-medium">Maintenance Notes</label>
          <Textarea
            name="maintenance_notes"
            value={notes}
            onChange={handleNotesChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          />
          <Button onClick={handleSaveNotes} variant="linkHover1" className="mt-2">
            Save Notes
          </Button>
        </div>
      )}
    </CardContent>
    // </Card>
  );
};

export default AllFirearmsList;
