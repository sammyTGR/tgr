import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = 'https://cloud.fastbound.com'
const API_KEY = process.env.FASTBOUND_API_KEY!
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER!
const FASTBOUND_ACCOUNT_EMAIL = process.env.FASTBOUND_ACCOUNT_EMAIL!

if (!API_KEY || !ACCOUNT_NUMBER) {
  throw new Error('FastBound API key or account number is not set')
}

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = await fetch(`${BASE_URL}/${ACCOUNT_NUMBER}/api/Account`, {
      headers: new Headers({
        'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'X-AuditUser': FASTBOUND_ACCOUNT_EMAIL || '',
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const accountInfo = await response.json()
    return NextResponse.json(accountInfo)
  } catch (error) {
    console.error('Error fetching account info:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}