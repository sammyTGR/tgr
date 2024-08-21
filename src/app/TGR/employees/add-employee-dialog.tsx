import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "./types"; // Make sure to import the Employee type

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: Omit<Employee, 'employee_id'>) => void;
}

export default function AddEmployeeDialog({ isOpen, onClose, onAdd }: AddEmployeeDialogProps) {
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'employee_id'>>({
    name: "",
    department: "",
    role: "",
    contact_info: "",
    lanid: "",
    rank: null,
    pay_rate: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ 
      ...prev, 
      [name]: name === 'rank' || name === 'pay_rate' ? parseFloat(value) || null : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newEmployee);
    setNewEmployee({
      name: "",
      department: "",
      role: "",
      contact_info: "",
      lanid: "",
      rank: null,
      pay_rate: null,
    });
    onClose(); // Close the dialog after submitting
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={newEmployee.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                name="department"
                value={newEmployee.department}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                name="role"
                value={newEmployee.role}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pay_rate" className="text-right">
                Pay Rate
              </Label>
              <Input
                id="pay_rate"
                name="pay_rate"
                type="number"
                step="0.01"
                value={newEmployee.pay_rate || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact_info" className="text-right">
                Contact Info
              </Label>
              <Input
                id="contact_info"
                name="contact_info"
                value={newEmployee.contact_info}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lanid" className="text-right">
                LANID
              </Label>
              <Input
                id="lanid"
                name="lanid"
                value={newEmployee.lanid}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rank" className="text-right">
                Rank
              </Label>
              <Input
                id="rank"
                name="rank"
                type="number"
                value={newEmployee.rank || ''}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Add Employee</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}