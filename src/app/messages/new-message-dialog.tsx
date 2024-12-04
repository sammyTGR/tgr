'use client'

import * as React from "react"
import { Check, Search, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getEmployees } from "./actions"

interface Employee {
  employee_id: number
  name: string
  contact_info: string
  avatar_url: string | null
}

interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectUsers: (users: Employee[]) => void
}

export function NewMessageDialog({
  open,
  onOpenChange,
  onSelectUsers,
}: NewMessageDialogProps) {
  const [search, setSearch] = React.useState("")
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [selectedUsers, setSelectedUsers] = React.useState<Employee[]>([])

  React.useEffect(() => {
    const fetchEmployees = async () => {
      const data = await getEmployees(search)
      setEmployees(data)
    }
    fetchEmployees()
  }, [search])

  const toggleUser = (user: Employee) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.employee_id === user.employee_id)
      if (isSelected) {
        return prev.filter(u => u.employee_id !== user.employee_id)
      }
      return [...prev, user]
    })
  }

  const handleContinue = () => {
    onSelectUsers(selectedUsers)
    onOpenChange(false)
    setSelectedUsers([])
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 text-zinc-50 border-zinc-800">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Select users to start a new conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-zinc-700"
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {employees.map((employee) => (
                <button
                  key={employee.employee_id}
                  onClick={() => toggleUser(employee)}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    selectedUsers.some(u => u.employee_id === employee.employee_id)
                      ? 'bg-zinc-800'
                      : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <Avatar>
                    <AvatarImage 
                      src={employee.avatar_url || ''} 
                      alt={employee.name} 
                    />
                    <AvatarFallback>
                      {employee.name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium leading-none">{employee.name}</p>
                    <p className="text-sm text-zinc-400">{employee.contact_info}</p>
                  </div>
                  {selectedUsers.some(u => u.employee_id === employee.employee_id) && (
                    <Check className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={selectedUsers.length === 0}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-300"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

