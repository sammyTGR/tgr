import { headers } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

const BASE_URL = 'https://cloud.fastbound.com'; // This is the correct base URL for FastBound
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER;
if (!ACCOUNT_NUMBER) {
  throw new Error('FASTBOUND_ACCOUNT_NUMBER is not set in environment variables');
};
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
  try {
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("FastBound API error response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        body: errorText
      });
      throw new Error(`FastBound API error: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching items from FastBound API:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '10', 10);

    const validParams = new URLSearchParams();
    validParams.set('take', take.toString());
    validParams.set('skip', skip.toString());
    validParams.set('accountNumber', ACCOUNT_NUMBER || '');

    // Add other necessary parameters
    ['search', 'itemNumber', 'serial', 'manufacturer', 'importer', 'model', 'type', 'caliber', 'location', 'condition', 'mpn', 'upc', 'sku', 'isTheftLoss', 'isDestroyed', 'doNotDispose', 'dispositionId', 'status', 'acquiredOnOrAfter', 'acquiredOnOrBefore', 'disposedOnOrAfter', 'disposedOnOrBefore', 'hasExternalId', 'acquisitionType'].forEach(param => {
      const value = searchParams.get(param);
      if (value !== null && value !== "") validParams.append(param, value);
    });

    const fbParams = validParams;

    const fbUrl = `${BASE_URL}/${ACCOUNT_NUMBER}/api/Items?${validParams.toString()}`;
    console.log("Requesting FastBound API with URL:", fbUrl);

    if (!API_KEY) {
      throw new Error('FASTBOUND_API_KEY is not set in environment variables');
    }

    const headers = {
      'Authorization': `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'X-AuditUser': AUDIT_USER || '',
    };

    console.log("Request headers:", headers);

    const data = await fetchItems(fbUrl, headers);
    console.log("FastBound API response:", JSON.stringify(data, null, 2));

    const totalItems = data.records || 0;
    const totalPages = Math.ceil(totalItems / take);
    const currentPage = Math.floor(skip / take) + 1;

    console.log("Pagination info:", {
      skip,
      take,
      currentPage,
      totalPages,
      totalItems,
    });

    return NextResponse.json({
      items: data.items || [],
      totalItems,
      currentPage,
      totalPages,
      itemsPerPage: take,
      records: totalItems,
      skip,
    });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}