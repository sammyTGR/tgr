import { NextResponse } from 'next/server';
import { getInventoryDetail, lookupInventory, searchInventory } from '../aim/servicestack-api';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const model = searchParams.get('model');
  const item = searchParams.get('item');
  const locationCode = searchParams.get('locationCode');
  const searchStr = searchParams.get('searchStr');

  // console.log('Request URL:', request.url);
  // console.log('Action:', action);
  // console.log('Model:', model);
  // console.log('Item:', item);
  // console.log('Location Code:', locationCode);
  // console.log('Search String:', searchStr);

  try {
    let result;
    if (action === 'detail' && model) {
      // console.log('Fetching inventory detail for model:', model);
      result = await getInventoryDetail(model);
    } else if (action === 'lookup' && item) {
      // console.log('Looking up inventory for item:', item, 'and location:', locationCode || 'Not specified');
      result = await lookupInventory(item, locationCode || undefined);
    } else if (action === 'search' && searchStr) {
      // console.log('Searching inventory for:', searchStr);
      result = await searchInventory(searchStr);
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in inventory API:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({ 
        error: 'An error occurred', 
        details: error.response?.data || error.message,
        status: error.response?.status
      }, { status: error.response?.status || 500 });
    } else if (error instanceof Error) {
      return NextResponse.json({ error: 'An error occurred', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}

export async function POST(request: Request) {
    const body = await request.json();
    const action = body.action; // Ensure you are extracting the action correctly

    try {
        if (action === 'search') {
            const result = await searchInventory(body.SearchStr);
            return NextResponse.json(result);
        } else {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }
    } catch (error: unknown) {
        console.error('Error in inventory API:', error);
        
        // Type guard to check if error is an instance of Error
        if (error instanceof Error) {
            return NextResponse.json({ error: 'An error occurred', details: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
        }
    }
}