import { NextResponse, NextRequest } from 'next/server';

const BASE_URL = 'https://cloud.fastbound.com'; // This is the correct base URL for FastBound
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER;
const API_KEY = process.env.FASTBOUND_API_KEY;
const AUDIT_USER = process.env.FASTBOUND_AUDIT_USER;

class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly resetInterval: number = 60000; // 1 minute in milliseconds

  async limit() {
    const now = Date.now();
    if (now - this.lastRequestTime >= this.resetInterval) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    if (this.requestCount >= 60) {
      const waitTime = this.resetInterval - (now - this.lastRequestTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }
}

const rateLimiter = new RateLimiter();

async function fetchItems(url: string, headers: HeadersInit) {
  await rateLimiter.limit();
  const response = await fetch(url, { method: 'GET', headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FastBound API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '50', 10);

    // console.log("Received request - Page:", page, "Items per page:", itemsPerPage);

    const validParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (value && !['page', 'itemsPerPage'].includes(key)) {
        validParams.append(key, value);
      }
    });
    validParams.append('page', page.toString());
    validParams.append('itemsPerPage', itemsPerPage.toString());

    const url = `${BASE_URL}/${ACCOUNT_NUMBER}/api/Items?${validParams.toString()}&page=${page}&itemsPerPage=${itemsPerPage}`;
    // console.log("FastBound API URL:", url);

    const headers = {
      'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-AuditUser': AUDIT_USER,
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      console.error("FastBound API error:", response.status, await response.text());
      throw new Error(`FastBound API error: ${response.status}`);
    }

    const data = await response.json();
    // console.log("FastBound API response:", JSON.stringify(data, null, 2));

    return NextResponse.json({
      items: data.items || [],
      totalItems: data.records || 0,
      currentPage: page,
      totalPages: Math.ceil((data.records || 0) / itemsPerPage),
      itemsPerPage: itemsPerPage,
      records: data.records || 0,
    });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
