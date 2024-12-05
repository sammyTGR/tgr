'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatItem {
  id: string
  name: string
  participants: string[]
  lastMessage: string
  isGroup: boolean
}

export function ChatSidebar({ onSelectChat }: { onSelectChat: (chatId: string) => void }) {
  const supabase = createClientComponentClient()
  const [chats, setChats] = useState<ChatItem[]>([])

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    }
  })

  useEffect(() => {
    if (!currentUser) return

    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          name,
          participants:chat_participants(user_id),
          messages:messages(content)
        `)
        .eq('chat_participants.user_id', currentUser.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching chats:', error)
        return
      }

      const formattedChats: ChatItem[] = data.map((chat) => ({
        id: chat.id,
        name: chat.name || (chat.participants.length > 2 ? 'Group Chat' : 'Direct Message'),
        participants: chat.participants.map((p: any) => p.user_id),
        lastMessage: chat.messages[0]?.content || 'No messages yet',
        isGroup: chat.participants.length > 2
      }))

      setChats(formattedChats)
    }

    fetchChats()

    const channel = supabase
      .channel('chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchChats)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, supabase])

  return (
    <div className="w-64 bg-muted border-r border-zinc-800 max-h-[calc(100vh-20rem)]">
      <h2 className="text-xl font-semibold p-4">Chats</h2>
      <ScrollArea className="h-[calc(100vh-20rem)]">
        {chats.map((chat) => (
          <button
            key={chat.id}
            className="w-full text-left p-4 hover:bg-zinc-800 transition-colors"
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={chat.isGroup ? '/group-avatar.png' : '/user-avatar.png'} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{chat.name}</p>
                {chat.isGroup && (
                  <p className="text-xs text-zinc-400">{chat.participants.length} members</p>
                )}
                <p className="text-sm text-zinc-400 truncate">{chat.lastMessage}</p>
              </div>
            </div>
          </button>
        ))}
      </ScrollArea>
    </div>
  )
}
