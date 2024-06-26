import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddFirearmFormProps {
  onAdd: (firearm: {
    firearm_type: string;
    firearm_name: string;
    last_maintenance_date: string;
    maintenance_frequency: number;
    maintenance_notes: string;
    status: string;
    assigned_to: string | null;
  }) => void;
}

export default function AddFirearmForm({ onAdd }: AddFirearmFormProps) {
  const [firearmType, setFirearmType] = useState<string>("handgun");
  const [firearmName, setFirearmName] = useState<string>("");
  const [maintenanceFrequency, setMaintenanceFrequency] = useState<number>(30);

  const handleAdd = () => {
    const newFirearm = {
      firearm_type: firearmType,
      firearm_name: firearmName,
      last_maintenance_date: new Date().toISOString(),
      maintenance_frequency: maintenanceFrequency,
      maintenance_notes: "",
      status: "New",
      assigned_to: null,
    };
    onAdd(newFirearm);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Firearm</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Firearm</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label>Firearm Type</label>
            <Select
              value={firearmType}
              onValueChange={(value) => setFirearmType(value)}
            >
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
            <Input
              value={firearmName}
              onChange={(e) => setFirearmName(e.target.value)}
            />
          </div>
          <div>
            <label>Maintenance Frequency</label>
            <Input
              type="number"
              value={maintenanceFrequency}
              onChange={(e) => setMaintenanceFrequency(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>Add Firearm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
