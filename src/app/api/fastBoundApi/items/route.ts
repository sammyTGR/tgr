import { headers } from 'next/headers';
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
    console.log("API route received params:", Object.fromEntries(searchParams));
    const take = parseInt(searchParams.get('take') || '10', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    const validParams = new URLSearchParams();
    validParams.set('take', take.toString());
    validParams.set('skip', skip.toString());

    // Add other necessary parameters
    ['search', 'itemNumber', 'serial', 'manufacturer', 'importer', 'model', 'type', 'caliber', 'location', 'condition', 'mpn', 'upc', 'sku', 'isTheftLoss', 'isDestroyed', 'doNotDispose', 'dispositionId', 'status', 'acquiredOnOrAfter', 'acquiredOnOrBefore', 'disposedOnOrAfter', 'disposedOnOrBefore', 'hasExternalId', 'acquisitionType'].forEach(param => {
      const value = searchParams.get(param);
      if (value !== null && value !== "") validParams.append(param, value);
    });

    const url = `${BASE_URL}/${ACCOUNT_NUMBER}/api/Items?${validParams.toString()}`;
    console.log("FastBound API URL:", url);

    const headers = {
      'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-AuditUser': AUDIT_USER || '',
    };

    const data = await fetchItems(url, headers);
    console.log("FastBound API response:", JSON.stringify(data, null, 2));

    return NextResponse.json({
      items: data.items || [],
      totalItems: data.records || 0,
      currentPage: Math.floor(skip / take) + 1,
      totalPages: Math.ceil((data.records || 0) / take),
      itemsPerPage: take,
      records: data.records || 0,
    });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}