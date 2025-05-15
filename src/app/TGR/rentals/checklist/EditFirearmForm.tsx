import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

interface EditFirearmFormProps {
  firearm: {
    id: number;
    firearm_type: string;
    firearm_name: string;
    maintenance_frequency?: number;
  };
  onEdit: (updatedFirearm: {
    id: number;
    firearm_type: string;
    firearm_name: string;
    maintenance_frequency: number;
  }) => void;
  onCancel: () => void;
}

export default function EditFirearmForm({ firearm, onEdit, onCancel }: EditFirearmFormProps) {
  const [firearmType, setFirearmType] = useState(firearm.firearm_type);
  const [firearmName, setFirearmName] = useState(firearm.firearm_name);
  const [maintenanceFrequency, setMaintenanceFrequency] = useState(
    firearm.maintenance_frequency ?? 4
  );

  useEffect(() => {
    setFirearmType(firearm.firearm_type);
    setFirearmName(firearm.firearm_name);
    setMaintenanceFrequency(firearm.maintenance_frequency ?? 4);
  }, [firearm]);

  const handleEdit = () => {
    onEdit({
      id: firearm.id,
      firearm_type: firearmType,
      firearm_name: firearmName,
      maintenance_frequency: maintenanceFrequency,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label>Firearm Type</label>
        <Select value={firearmType} onValueChange={(value) => setFirearmType(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Firearm Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="handgun">Handgun</SelectItem>
            <SelectItem value="long gun">Long Gun</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label>Firearm Name</label>
        <Input value={firearmName} onChange={(e) => setFirearmName(e.target.value)} />
      </div>
      <div>
        <label>Maintenance Frequency (days)</label>
        <Input
          type="number"
          value={maintenanceFrequency}
          onChange={(e) => setMaintenanceFrequency(Number(e.target.value))}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="linkHover2" onClick={handleEdit}>
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}
