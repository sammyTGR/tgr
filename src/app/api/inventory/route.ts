import { NextResponse } from 'next/server';
import { getInventoryDetail, lookupInventory, searchInventory } from '../aim/servicestack-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const model = searchParams.get('model');
  const item = searchParams.get('item');
  const locationCode = searchParams.get('locationCode');
  const searchStr = searchParams.get('searchStr');

  console.log('Request URL:', request.url);
  console.log('Action:', action);
  console.log('Model:', model);
  console.log('Item:', item);
  console.log('Location Code:', locationCode);
  console.log('Search String:', searchStr);

  try {
    if (action === 'detail' && model) {
      console.log('Fetching inventory detail for model:', model);
      const result = await getInventoryDetail(model);
      return NextResponse.json(result);
    } else if (action === 'lookup' && item) {
      console.log('Looking up inventory for item:', item, 'and location:', locationCode || 'Not specified');
      const result = await lookupInventory(item, locationCode || undefined);
      return NextResponse.json(result);
    } else if (action === 'search' && searchStr) {
      console.log('Searching inventory for:', searchStr);
      const result = await searchInventory(searchStr);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error in inventory API:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'An error occurred', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}