import { NextResponse } from 'next/server';
import { getInventoryDetail, lookupInventory } from '../aim/servicestack-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const model = searchParams.get('model');
  const item = searchParams.get('item');
  const locationCode = searchParams.get('locationCode');

  console.log('API Key in route:', process.env.SERVICESTACK_API_KEY); // Log the API key (remove in production)

  console.log('Request URL:', request.url);
  console.log('Action:', action);
  console.log('Model:', model);
  console.log('Item:', item);
  console.log('Location Code:', locationCode);

  try {
    if (action === 'detail' && model) {
      console.log('Fetching inventory detail for model:', model);
      const result = await getInventoryDetail(model);
      return NextResponse.json(result);
    } else if (action === 'lookup' && item && locationCode) {
      console.log('Looking up inventory for item:', item, 'and location:', locationCode);
      const result = await lookupInventory(item, locationCode);
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