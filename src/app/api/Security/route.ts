import { NextResponse } from 'next/server';
import { JsonServiceClient, IReturn } from '@servicestack/client';

// Request DTOs
class GetEndpointRequest implements IReturn<GetEndpointResponse> {
    apiKey?: string;
    appId?: string;

    constructor(init?: Partial<GetEndpointRequest>) {
        Object.assign(this, init);
    }

    createResponse() { return new GetEndpointResponse(); }
    getTypeName() { return 'GetEndpointRequest'; }
}

class SecurityRequest implements IReturn<SecurityResponse> {
    appId?: string;
    userName?: string;
    password?: string;

    constructor(init?: Partial<SecurityRequest>) {
        Object.assign(this, init);
    }

    createResponse() { return new SecurityResponse(); }
    getTypeName() { return 'SecurityRequest'; }
}

// Response DTOs
class GetEndpointResponse {
    NewEndpointDomain?: string;
    OAuthToken?: string;
    Status?: {
        StatusCode?: string;
        ErrorMessage?: string;
    };
}

class SecurityResponse {
    Token?: string;
    Status?: {
        StatusCode?: string;
        ErrorMessage?: string;
    };
}

export interface AuthResult {
    client: JsonServiceClient;
    domain: string;
    token: string;
}

async function getAuthenticatedClient(): Promise<AuthResult> {
    const apiKey = process.env.API_KEY;
    const appId = process.env.APP_ID;
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;

    if (!apiKey || !appId || !username || !password) {
        throw new Error('Missing required environment variables');
    }

    try {
        // Step 1: GET request to /GetEndPoint
        const initialClient = new JsonServiceClient('https://active-ewebservice.biz/aeServices30/api');
        initialClient.bearerToken = apiKey;
        initialClient.headers = new Headers({
            'AppId': appId
        });

        console.log('Step 1: Getting endpoint...');
        const endpointResponse = await initialClient.get<GetEndpointResponse>('/GetEndPoint');
        console.log('Endpoint response:', endpointResponse);

        if (!endpointResponse?.NewEndpointDomain || !endpointResponse?.OAuthToken) {
            console.error('Invalid endpoint response:', endpointResponse);
            throw new Error('Failed to get endpoint domain or OAuth token');
        }

        // Step 2: POST to NewEndpointDomain/Api/Security
        const securityClient = new JsonServiceClient(endpointResponse.NewEndpointDomain);
        securityClient.headers = new Headers({
            'APIKey': apiKey,
            'OAuthToken': endpointResponse.OAuthToken
        });

        console.log('Step 2: Getting security token...');
        const securityRequest = new SecurityRequest({
            appId,
            userName: username,
            password
        });
        const securityResponse = await securityClient.post(securityRequest);
        console.log('Security response:', securityResponse);

        if (!securityResponse?.Token) {
            console.error('Invalid security response:', securityResponse);
            throw new Error('Failed to get security token');
        }

        // Step 3: Create final authenticated client
        const authenticatedClient = new JsonServiceClient(endpointResponse.NewEndpointDomain);
        authenticatedClient.headers = new Headers({
            'APIKey': apiKey,
            'OAuthToken': endpointResponse.OAuthToken,
            'AppId': appId,
            'Token': securityResponse.Token
        });

        return {
            client: authenticatedClient,
            domain: endpointResponse.NewEndpointDomain,
            token: securityResponse.Token
        };
    } catch (error) {
        console.error('Authentication error details:', error);
        throw error;
    }
}

// Add Next.js route handlers
export async function GET() {
    try {
        const authResult = await getAuthenticatedClient();
        return NextResponse.json(authResult);
    } catch (error: any) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}

// If you need POST method as well
export async function POST() {
    try {
        const authResult = await getAuthenticatedClient();
        return NextResponse.json(authResult);
    } catch (error: any) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}

// Export the getAuthenticatedClient function for use in other files
export { getAuthenticatedClient };