'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import DOMPurify from 'isomorphic-dompurify'

// Move this outside the function to avoid creating new client on every call
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
)

export async function sendAndGetMessages(message: string) {
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
            is_agent: false
          }
        ])
        .select()
        .single(),
      supabase
        .from('messages')
        .select('id, content, is_agent, created_at')
        .order('created_at', { ascending: true })
        .limit(50) // Pagination to prevent large data transfers
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
    
    // console.log('Employees fetched:', data)
    return data
  } catch (error) {
    console.error('getEmployees error:', error)
    throw error
  }
}

