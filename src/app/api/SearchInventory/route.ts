import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/service';
import { SearchInventoryRequest } from '../aim/dtos';

export async function POST(request: Request) {
    try {
        const { client } = await getAuthenticatedClient();
        const searchParams = await request.json();

        const searchRequest = new SearchInventoryRequest({
            ...searchParams,
            ApiKey: process.env.API_KEY,
            AppId: process.env.APP_ID
        });

        const response = await client.api(searchRequest);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Search inventory error:', error);
        return NextResponse.json(
            { error: error.message || 'An error occurred during the search' }, 
            { status: 500 }
        );
    }
}