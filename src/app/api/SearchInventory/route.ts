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

        // First request to get auth token and new endpoint
        console.log('Initial request:', JSON.stringify(searchRequest, null, 2));
        const initialResponse: ApiResult<SearchInventoryResponse> = await client.api(searchRequest);
        console.log('Initial response:', JSON.stringify(initialResponse, null, 2));

        if (!initialResponse?.response?.NewEndpoint || !initialResponse?.response?.OAuthToken) {
            throw new Error('Failed to get authentication token or endpoint');
        }

        // Make the second request with native fetch
        const searchRequest2 = {
            ...searchRequest,
            OAuthToken: initialResponse.response.OAuthToken
        };

        console.log('Search request:', JSON.stringify(searchRequest2, null, 2));
        
        const response = await fetch(initialResponse.response.NewEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${initialResponse.response.OAuthToken}`,
                'ApiKey': process.env.API_KEY!,
                'AppId': process.env.APP_ID!
            },
            body: JSON.stringify(searchRequest2),
            // Add this if you're getting SSL certificate errors
            next: { 
                revalidate: 0
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const searchResponse = await response.json();
        console.log('Search response:', JSON.stringify(searchResponse, null, 2));

        return NextResponse.json(searchResponse);
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