import { NextResponse } from 'next/server';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://10846.active-e.net:7890';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // console.log('Incoming request body:', body);

        const { SearchStr } = body;

        const API_KEY = process.env.ApiKey;
        const OAUTH_TOKEN = process.env.OAuthToken;
        const APP_ID = process.env.AppId;
        const TOKEN = process.env.Token;
        const API_USERNAME = process.env.Username;
        const API_PASSWORD = process.env.Password;

        if (!API_KEY || !OAUTH_TOKEN || !APP_ID || !TOKEN || !API_USERNAME || !API_PASSWORD) {
            return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
        }

        const apiUrl = `${BASE_URL}/api/SearchInventory`;

        // console.log('Making request to external API:', apiUrl);

        const response = await axios.post(apiUrl, 
            { SearchStr },
            {
                params: {
                    Username: API_USERNAME,
                    Password: API_PASSWORD
                },
                headers: {
                    'ApiKey': API_KEY,
                    'OAuthToken': OAUTH_TOKEN,
                    'Token': TOKEN,
                    'AppId': APP_ID,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        // console.log('Response from external API:', response.data);

        if (response.data && response.data.Records) {
            const results = response.data.Records.map((item: any) => ({
                Description: item.Detail?.Description,
                Manufacturer: item.Detail?.Mfg,
                Model: item.Detail?.Model,
                CategoryDescription: item.Detail?.CategoryDescription,
                SubCategoryDescription: item.Detail?.SubCategoryDescription,
                Sku: item.Detail?.Sku,
            }));

            return NextResponse.json(results);
        } else {
            console.error('Unexpected response format:', response.data);
            return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in proxy:', error);
        if (axios.isAxiosError(error)) {
            console.error('Error response data:', error.response?.data);
            console.error('Error response status:', error.response?.status);
            return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
        }
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}