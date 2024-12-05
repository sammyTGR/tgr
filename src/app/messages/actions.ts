'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import DOMPurify from 'isomorphic-dompurify'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
)

export async function sendAndGetMessages(chatId: string, message: string) {
    const supabase = createServerComponentClient({ cookies })
    const sanitizedMessage = DOMPurify.sanitize(message.trim())
    
    if (!sanitizedMessage) throw new Error('Message cannot be empty')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const [sendResult, messagesResult] = await Promise.all([
      supabase
        .from('messages')
        .insert([
          {
            content: sanitizedMessage,
            user_id: user.id,
            is_agent: false,
            chat_id: chatId
          }
        ])
        .select()
        .single(),
      supabase
        .from('messages')
        .select('id, content, is_agent, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(50)
    ])
  
    if (sendResult.error) throw sendResult.error
    if (messagesResult.error) throw messagesResult.error
  
    return messagesResult.data
}

export async function getEmployees(search?: string) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let query = serviceClient
      .from('employees')
      .select('employee_id, name, contact_info, avatar_url')
      .eq('status', 'active')
    
    if (search) {
      const sanitizedSearch = DOMPurify.sanitize(search.trim())
      query = query.ilike('name', `%${sanitizedSearch}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('getEmployees error:', error)
    throw error
  }
}

export async function createChat(users: string[]) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert({ name: users.length > 2 ? 'Group Chat' : null })
    .select()
    .single()

  if (chatError) throw chatError

  const participants = [...users, user.id].map(userId => ({
    chat_id: chat.id,
    user_id: userId
  }))

  const { error: participantError } = await supabase
    .from('chat_participants')
    .insert(participants)

  if (participantError) throw participantError

  return chat.id
}

export async function getChatParticipants(chatId: string) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('chat_participants')
    .select('user_id')
    .eq('chat_id', chatId)

  if (error) throw error

  return data.map(participant => participant.user_id)
}

