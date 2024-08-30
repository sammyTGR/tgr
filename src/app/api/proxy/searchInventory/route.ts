import { NextResponse } from 'next/server';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://10846.active-e.net:7890';

export async function POST(request: Request) {
    const body = await request.json();
    console.log('Incoming request body:', body); // Log the incoming request body

    const { SearchStr } = body;

    // Extract QueryParams from the URL
    const url = new URL(request.url);
    const queryParams = url.searchParams.get('QueryParams');

    // Decode the QueryParams
    let API_USERNAME = '';
    let API_PASSWORD = '';

    if (queryParams) {
        const decodedParams = decodeURIComponent(queryParams);
        const paramsArray = decodedParams.split('&');
        API_USERNAME = paramsArray[0].split('=')[1];
        API_PASSWORD = paramsArray[1].split('=')[1];
    }

    console.log('API_USERNAME:', API_USERNAME);
    console.log('API_PASSWORD:', API_PASSWORD);

    // Check if Username and Password are defined
    if (!API_USERNAME || !API_PASSWORD) {
        return NextResponse.json({ error: 'Username and Password are required' }, { status: 400 });
    }

    // Construct the full URL for the external API call
    const apiUrl = `${BASE_URL}/api/SearchInventory?Username=${encodeURIComponent(API_USERNAME)}&Password=${encodeURIComponent(API_PASSWORD)}`;

    // Log the actual API URL being called
    console.log('Making request to external API:', apiUrl); // Log the full API URL without QueryParams

    try {
        // Make the POST request to the external API with headers
        const response = await axios.post(apiUrl, {
            SearchStr,

        }, {
            headers: {
                'ApiKey': process.env.ApiKey,
                'OAuthToken': process.env.OAuthToken,
                'Token': process.env.Token,
                'AppId': process.env.AppId,
                'Accept': 'application/json',
            },
            timeout: 15000, // Set timeout to 15 seconds
        });

        console.log('Response from external API:', response.data); // Log the response data

        // Check if the response is valid and contains Records
        if (response.data && response.data.Records) {
            // Extract the desired fields from the response
            const results = response.data.Records.map((item: any) => ({
                Description: item.Description,
                Manufacturer: item.Manufacturer,
                Model: item.Model,
                CategoryDescription: item.CategoryDescription,
                SubCategoryDescription: item.SubCategoryDescription,
                Sku: item.Sku,
            }));

            return NextResponse.json(results);
        } else {
            console.error('Unexpected response format:', response.data);
            return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in proxy:', error);
        if (axios.isAxiosError(error) && error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        }
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}