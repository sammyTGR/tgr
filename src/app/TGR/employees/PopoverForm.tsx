import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from './types';

interface PopoverFormProps {
  employee: Employee;
  onSave: (updatedEmployee: Employee) => void;
}

export function PopoverForm({ employee, onSave }: PopoverFormProps) {
  const [editedEmployee, setEditedEmployee] = useState<Employee>(employee);
  const [open, setOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEmployee(prev => ({
      ...prev,
      [name]: name === 'rank' || name === 'pay_rate' ? parseFloat(value) || null : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedEmployee);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost">Edit</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Edit Employee</h4>
              <p className="text-sm text-muted-foreground">
                Make changes to the employee information here.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={editedEmployee.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                value={editedEmployee.department || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={editedEmployee.role || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_info">Contact Info</Label>
              <Input
                id="contact_info"
                name="contact_info"
                value={editedEmployee.contact_info || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lanid">LAN ID</Label>
              <Input
                id="lanid"
                name="lanid"
                value={editedEmployee.lanid || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rank">Rank</Label>
              <Input
                id="rank"
                name="rank"
                type="number"
                value={editedEmployee.rank || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pay_rate">Pay Rate</Label>
              <Input
                id="pay_rate"
                name="pay_rate"
                type="number"
                step="0.01"
                value={editedEmployee.pay_rate || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <Button className="mt-4" type="submit">Save changes</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}