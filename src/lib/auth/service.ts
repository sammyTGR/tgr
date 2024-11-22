import { JsonServiceClient } from '@servicestack/client';
import axios from 'axios';
import https from 'https';

export interface AuthResult {
    client: JsonServiceClient;
    domain: string;
    token: string;
}

export async function getAuthenticatedClient(): Promise<AuthResult> {
    const apiKey = process.env.API_KEY;
    const appId = process.env.APP_ID;
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    if (!apiKey || !appId || !username || !password) {
        throw new Error('Missing required environment variables');
    }

    try {
        // Use the documented base URL
        const baseUrl = 'https://active-ewebservice.biz/aeServices30/api';
        
        // Step 1: GET request to GetEndPoint
        console.log('Step 1: Getting endpoint...');
        const endpointResponse = await fetch(`${baseUrl}/GetEndPoint`, {
            method: 'GET',
            headers: {
                'APIKey': apiKey,
                'AppId': appId
            }
        });

        const endpointData = await endpointResponse.json();
        console.log('Endpoint response:', endpointData);

        // Step 2: POST to Security endpoint
        console.log('Step 2: Getting security token...');
        const securityResponse = await axios({
            method: 'POST',
            url: `${baseUrl}/Security`,
            headers: {
                'APIKey': apiKey,
                'OAuthToken': endpointData.OAuthToken,
                'Content-Type': 'application/json'
            },
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false // Warning: This bypasses SSL verification
            }),
            timeout: 30000
        });

        if (securityResponse.status !== 200) {
            console.error('Security endpoint error:', {
                status: securityResponse.status,
                statusText: securityResponse.statusText,
                response: securityResponse.data
            });
            throw new Error(`Security endpoint failed: ${securityResponse.status} ${securityResponse.statusText}`);
        }

        const securityData = securityResponse.data;
        console.log('Security response:', securityData);

        // Step 3: Create authenticated client
        const client = new JsonServiceClient(endpointData.NewEndpointDomain);
        client.headers = new Headers({
            'APIKey': apiKey,
            'OAuthToken': endpointData.OAuthToken,
            'AppId': appId,
            'Token': securityData.Token,
            'Content-Type': 'application/json'
        });

        return {
            client,
            domain: endpointData.NewEndpointDomain,
            token: securityData.Token
        };
    } catch (error) {
        console.error('Authentication error details:', error);
        throw error;
    }
}