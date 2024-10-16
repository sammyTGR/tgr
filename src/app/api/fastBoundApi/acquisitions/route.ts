import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = 'https://cloud.fastbound.com'
const API_KEY = process.env.FASTBOUND_API_KEY
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER
const AUDIT_USER = process.env.FASTBOUND_AUDIT_USER

if (!API_KEY || !ACCOUNT_NUMBER) {
  throw new Error('FastBound API key or account number is not set')
}

export async function POST(request: Request) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No user found in Supabase session')
        return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
      }
  
      console.log('User found:', user.email)
  
    const { items } = await request.json();
    console.log("Received items:", items);

    const response = await fetch(`${BASE_URL}/${ACCOUNT_NUMBER}/api/Acquisitions/CreateAndCommit`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
        "Content-Type": "application/json",
        "X-AuditUser": AUDIT_USER!,
      },
      body: JSON.stringify({
        acquireDate: new Date().toISOString(),
        acquireType: 'Purchase', // You might want to make this dynamic
        items: items,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData }, { status: response.status })
    }

    const acquisitionData = await response.json()
    return NextResponse.json(acquisitionData)
  } catch (error) {
    console.error('Error creating acquisition:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}