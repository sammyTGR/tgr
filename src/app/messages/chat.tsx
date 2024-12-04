'use client'

import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Send } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {  sendAndGetMessages, getEmployees } from "./actions"
import { NewMessageDialog } from "./new-message-dialog"
import React from 'react'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  is_agent: boolean
  created_at: string
}

interface Employee {
  employee_id: number
  name: string
  contact_info: string
  avatar_url: string | null
}

export default function Chat() {
  const [input, setInput] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const supabase = createClientComponentClient()

  const { data: userData, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
    //   console.log('Current user:', user)
      return user
    }
  })

  const { data: currentEmployee, error: employeeError } = useQuery({
    queryKey: ['currentEmployee'],
    queryFn: async () => {
      if (!userData?.email) {
        // console.log('No user email found')
        return null
      }
      const employees = await getEmployees()
    //   console.log('Looking for email:', userData.email)
      
      const employee = employees.find((emp: Employee) => {
        // console.log('Comparing:', {
        //   userEmail: userData.email,
        //   empEmail: emp.contact_info,
        //   matches: emp.contact_info === userData.email
        // })
        return emp.contact_info === userData.email
      })
      
      if (!employee) {
        // console.log('No employee found with email:', userData.email)
        // console.log('Available emails:', employees.map(emp => emp.contact_info))
      } else {
        // console.log('Found employee:', employee)
      }
      
      return employee || null
    },
    enabled: !!userData?.email,
    retry: false,
    staleTime: 1000 * 60
  })

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, is_agent, created_at')
        .order('created_at', { ascending: true })
        .limit(50)
      return messages || []
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false
  })

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, refetch])

  const { mutate: sendMessage, isError, error } = useMutation({
    mutationFn: sendAndGetMessages,
    onSuccess: (newMessages) => {
      if (newMessages) {
        queryClient.setQueryData(['messages'], newMessages)
        setInput("")
        inputRef.current?.focus()
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
    }
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input)
  }

  const handleSelectUsers = (users: Employee[]) => {
    console.log('Selected users:', users)
    // Here you would typically:
    // 1. Create a new conversation
    // 2. Add selected users to the conversation
    // 3. Update the UI to show the new conversation
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto bg-zinc-950 text-zinc-50 border-zinc-800">
        <CardHeader className="flex flex-row items-center">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage
                src="https://utfs.io/f/9jzftpblGSv7zWule6FCYeqvSEFOu6crDAy19t5KBU2kQ0jZ"
                alt={currentEmployee?.name || "User"}
              />
              <AvatarFallback>
                {currentEmployee?.name
                  ? currentEmployee.name.split(' ').map((n: string) => n[0]).join('')
                  : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">
                {currentEmployee?.name || 'Loading...'}
              </p>
              <p className="text-sm text-zinc-400">
                {currentEmployee?.contact_info || 'Loading...'}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto rounded-full text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="sr-only">New message</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {(messages as Message[]).map((message) => (
            <div
              key={message.id}
              className={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${
                message.is_agent
                  ? 'bg-zinc-800 text-zinc-50' 
                  : 'bg-white text-zinc-950 ml-auto'
              }`}
            >
              {message.content}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex items-center w-full space-x-2">
            <Input
              ref={inputRef}
              id="message"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-400 focus-visible:ring-zinc-700"
              autoComplete="off"
            />
            <Button type="submit" size="icon" className="bg-zinc-50 text-zinc-950 hover:bg-zinc-300">
              <Send className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
      <NewMessageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectUsers={handleSelectUsers}
      />
      {userError && <div>Error loading user: {userError.message}</div>}
      {employeeError && <div>Error loading employee: {employeeError.message}</div>}
    </>
  )
}

