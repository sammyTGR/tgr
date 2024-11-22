import { NextResponse } from 'next/server';
import { JsonServiceClient } from '@servicestack/client';
import { SearchInventoryRequest } from '../aim/dtos';

const baseUrl = process.env.AIM_API_URL || 'https://active-ewebservice.biz/aeServices30/api';

export async function POST(request: Request) {
    try {
        const client = new JsonServiceClient(baseUrl);
        const searchParams = await request.json();
        
        const searchRequest = new SearchInventoryRequest({
            ApiKey: process.env.API_KEY,
            AppId: process.env.APP_ID,
            IncludeDetails: true,
            IncludeSerials: true,
            IncludeMedia: true,
            IncludeAccessories: true,
            IncludePackages: true,
            IncludeIconImage: true,
            StartOffset: searchParams.StartOffset || 0,
            RecordCount: searchParams.RecordCount || 50,
            SearchStr: searchParams.SearchStr,
            ExactModel: searchParams.ExactModel || false
        });

        const response = await client.api(searchRequest);
        
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