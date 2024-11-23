import { NextResponse } from 'next/server';
import { JsonServiceClient } from '@servicestack/client';
import { SearchInventoryRequest } from '../aim/dtos';

export async function POST(request: Request) {
    try {
        // Validate required environment variables
        if (!process.env.API_KEY || !process.env.APP_ID) {
            throw new Error('Missing required API credentials');
        }

        // Create client with exact base URL from documentation
        const client = new JsonServiceClient('https://active-ewebservice.biz/aeServices30/api');

        const searchParams = await request.json();

        // Create request using documented pattern
        const searchRequest = new SearchInventoryRequest({
            SearchStr: searchParams.SearchStr || '',
            IncludeSerials: true,
            IncludeMedia: true,
            IncludeAccessories: true,
            IncludePackages: true,
            IncludeDetails: true,
            IncludeIconImage: true,
            ExactModel: false,
            StartOffset: searchParams.StartOffset || 0,
            RecordCount: searchParams.RecordCount || 50,
            // Required credentials from documentation
            ApiKey: process.env.API_KEY,
            AppId: process.env.APP_ID,
        });

        console.log('Making API request with:', {
            baseUrl: client.baseUrl,
            hasApiKey: !!process.env.API_KEY,
            hasAppId: !!process.env.APP_ID,
            searchStr: searchRequest.SearchStr
        });

        // Make request using documented pattern
        const api = await client.api(searchRequest);

        if (api.response?.Status?.StatusCode === 'Error') {
            console.error('API Error:', api.response.Status);
            return NextResponse.json(api.response, { status: 500 });
        }

        return NextResponse.json(api.response);
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