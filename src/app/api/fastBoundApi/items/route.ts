import { NextResponse } from 'next/server';

const BASE_URL = 'https://cloud.fastbound.com'; // This is the correct base URL for FastBound
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER;
const API_KEY = process.env.FASTBOUND_API_KEY;
const AUDIT_USER = process.env.FASTBOUND_AUDIT_USER;

const rateLimiter = {
  lastRequestTime: 0,
  async limit() {
    const now = Date.now();
    if (now - this.lastRequestTime < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - (now - this.lastRequestTime)));
    }
    this.lastRequestTime = Date.now();
  }
};

export async function GET(request: Request) {
  try {
    if (!ACCOUNT_NUMBER || !API_KEY || !AUDIT_USER) {
      console.error('Missing environment variables:', { ACCOUNT_NUMBER, API_KEY: API_KEY ? 'Set' : 'Not set', AUDIT_USER });
      throw new Error('Missing required environment variables');
    }

    const { searchParams } = new URL(request.url);
    const isDropdownDataRequest = searchParams.get('dropdownData') === 'true';

    const validParams = new URLSearchParams();

    searchParams.forEach((value, key) => {
      if (value) {
        validParams.append(key, value);
      }
    });

    const url = `${BASE_URL}/${ACCOUNT_NUMBER}/api/Items?${validParams.toString()}`;
    console.log('Request URL:', url);

    const headers = {
      'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-AuditUser': AUDIT_USER,
    };
    console.log('Request headers:', headers);

    await rateLimiter.limit();

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastBound API error:', response.status, errorText);
      throw new Error(`Failed to fetch items: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (isDropdownDataRequest) {
      const manufacturers = Array.from(new Set(data.items.map((item: any) => item.manufacturer)));
      const locations = Array.from(new Set(data.items.map((item: any) => item.location)));
      const calibers = Array.from(new Set(data.items.map((item: any) => item.caliber)));
      return NextResponse.json({ manufacturers, locations, calibers });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
