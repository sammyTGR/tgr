import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/service';
import { SearchInventoryRequest, SearchInventoryResponse } from '@/app/api/aim/dtos';

export async function POST(request: Request) {
    try {
        const { client } = await getAuthenticatedClient();
        const searchParams = await request.json();
        
        const searchRequest = new SearchInventoryRequest({
            ...searchParams,
            IncludeDetails: true
        });

        const response = await client.api(searchRequest);
        return NextResponse.json(response.response as SearchInventoryResponse);
    } catch (error: unknown) {
        console.error('Search inventory error:', error);
        
        if (error instanceof Error) {
            return NextResponse.json({ 
                Status: {
                    StatusCode: 'Error',
                    ErrorMessage: error.message
                }
            } as SearchInventoryResponse, { status: 500 });
        }
        
        return NextResponse.json({ 
            Status: {
                StatusCode: 'Error',
                ErrorMessage: 'An unknown error occurred'
            }
        } as SearchInventoryResponse, { status: 500 });
    }
}