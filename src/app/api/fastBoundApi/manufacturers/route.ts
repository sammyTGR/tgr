import { NextResponse } from 'next/server';

const BASE_URL = process.env.FASTBOUND_API_BASE_URL || 'https://cloud.fastbound.com';
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER;
const API_KEY = process.env.FASTBOUND_API_KEY;
const AUDIT_USER = process.env.FASTBOUND_AUDIT_USER;

export async function GET() {
  try {
    if (!ACCOUNT_NUMBER || !API_KEY || !AUDIT_USER) {
      throw new Error('Missing required environment variables');
    }

    const url = `${BASE_URL}/${ACCOUNT_NUMBER}/api/Items`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'X-AuditUser': AUDIT_USER,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch items: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // Extract unique manufacturers from the items
    const manufacturers = Array.from(new Set(data.items.map((item: any) => item.manufacturer)));

    return NextResponse.json(manufacturers);
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
