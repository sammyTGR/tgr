import { JsonServiceClient } from '@servicestack/client';

export interface AuthResult {
    client: JsonServiceClient;
}

export async function getAuthenticatedClient(): Promise<AuthResult> {
    const apiKey = process.env.API_KEY;
    const appId = process.env.APP_ID;

    if (!apiKey || !appId) {
        throw new Error('Missing required environment variables');
    }

    try {
        const client = new JsonServiceClient('https://active-ewebservice.biz/aeServices30/api');
        
        // Set the required headers and credentials
        client.bearerToken = apiKey;
        client.requestFilter = req => {
            req.headers = new Headers({
                'apikey': apiKey,
                'appid': appId,
                'content-type': 'application/json',
                'accept': 'application/json'
            });
        };

        return { client };
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}