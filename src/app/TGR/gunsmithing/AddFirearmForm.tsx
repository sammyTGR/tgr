import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const AddFirearmForm = ({ onAdd }: { onAdd: (firearm: any) => void }) => {
  const [firearmName, setFirearmName] = useState("");
  const [firearmType, setFirearmType] = useState("handgun");
  const [maintenanceFrequency, setMaintenanceFrequency] = useState(30);
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    const newFirearm = {
      firearm_type: firearmType,
      firearm_name: firearmName,
      last_maintenance_date: new Date().toISOString().split("T")[0],
      maintenance_frequency: maintenanceFrequency,
      maintenance_notes: "",
      status: "New",
      assigned_to: null, // Update this as necessary
    };
    onAdd(newFirearm);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Add Firearm
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Firearm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Firearm Make Model Serial Number (All Capitals)"
              value={firearmName}
              onChange={(e) => setFirearmName(e.target.value)}
            />
            <Select value={firearmType} onValueChange={setFirearmType}>
              <SelectTrigger>
                <SelectValue placeholder="Select Firearm Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="handgun">Handgun</SelectItem>
                <SelectItem value="long gun">Long Gun</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Maintenance Frequency"
              value={maintenanceFrequency}
              onChange={(e) => setMaintenanceFrequency(Number(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>Add Firearm</Button>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddFirearmForm;
