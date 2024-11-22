import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/auth/service';
import { SearchInventoryRequest, SearchInventoryResponse } from '@/app/api/aim/dtos';
import { ApiResult } from '@servicestack/client';

export async function POST(request: Request) {
    try {
        const { client } = await getAuthenticatedClient();
        const searchParams = await request.json();
        
        const searchRequest = new SearchInventoryRequest({
            ...searchParams,
            ApiKey: process.env.API_KEY,
            AppId: process.env.APP_ID,
            IncludeDetails: true,
            IncludeSerials: true,
            IncludeMedia: true,
            IncludeAccessories: true,
            IncludePackages: true,
            IncludeIconImage: true,
            StartOffset: searchParams.StartOffset || 0,
            RecordCount: searchParams.RecordCount || 50
        });

        console.log('Search request:', JSON.stringify(searchRequest, null, 2));
        const response: ApiResult<SearchInventoryResponse> = await client.api(searchRequest);
        console.log('Search response:', JSON.stringify(response, null, 2));

        if (response.error) {
            console.error('API error:', response.error);
            return NextResponse.json({
                Status: {
                    StatusCode: 'Error',
                    ErrorMessage: response.error.message
                }
            }, { status: 500 });
        }

        return NextResponse.json(response.response);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ 
            Status: {
                StatusCode: 'Error',
                ErrorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
        }, { status: 500 });
    }
}