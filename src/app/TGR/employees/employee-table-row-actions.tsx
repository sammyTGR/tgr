"use client"

import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pen, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Employee } from "./types"
import { toast } from "sonner"

interface EmployeeTableRowActionsProps<TData> {
  row: Row<TData>
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: number) => void
}

export function EmployeeTableRowActions<TData>({
  row,
  onEdit,
  onDelete,
}: EmployeeTableRowActionsProps<TData>) {
  const employee = row.original as Employee
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedEmployee, setEditedEmployee] = useState<Employee>(employee)
  const [isLoading, setIsLoading] = useState(false)



  const handleEdit = async () => {
    setIsLoading(true)
    try {
      await onEdit(editedEmployee)
      setIsEditDialogOpen(false)
      toast.success("Employee Updated", {
        description: "The employee information has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating employee:", error)
      toast.error("Update Failed", {
        description: "There was an error updating the employee information.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this employee?")) {
      setIsLoading(true)
      try {
        await onDelete(employee.employee_id)
        toast.success("Employee Deleted", {
          description: "The employee has been successfully removed.",
        })
      } catch (error) {
        console.error("Error deleting employee:", error)
        toast.error("Delete Failed", {
          description: "There was an error deleting the employee.",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pen className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(employee.employee_id)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editedEmployee.name}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={editedEmployee.department || ''}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, department: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                value={editedEmployee.role || ''}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, role: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact_info" className="text-right">
                Contact Info
              </Label>
              <Input
                id="contact_info"
                value={editedEmployee.contact_info || ''}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, contact_info: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lanid" className="text-right">
                LAN ID
              </Label>
              <Input
                id="lanid"
                value={editedEmployee.lanid || ''}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, lanid: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rank" className="text-right">
                Rank
              </Label>
              <Input
                id="rank"
                type="number"
                value={editedEmployee.rank || ''}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, rank: parseInt(e.target.value) || null })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pay_rate" className="text-right">
                Pay Rate
              </Label>
              <Input
                id="pay_rate"
                type="number"
                step="0.01"
                value={editedEmployee.pay_rate || ''}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, pay_rate: parseFloat(e.target.value) || null })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}