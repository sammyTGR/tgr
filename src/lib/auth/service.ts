import { IReturn, JsonServiceClient } from '@servicestack/client';
import { GetEndpointRequest } from '@/app/api/aim/dtos';

interface AuthEndpoint {
  NewEndpointDomain: string;
  OAuthToken: string;
  Token?: string;
}

class SecurityRequest implements IReturn<AuthEndpoint> {
  AppId?: string;
  Username?: string;
  Password?: string;

  constructor(init?: Partial<SecurityRequest>) {
    Object.assign(this, init);
  }

  createResponse() { return {} as AuthEndpoint; }
  getTypeName() { return 'SecurityRequest'; }
  getMethod() { return 'POST'; }
}

export async function getAuthenticatedClient(): Promise<JsonServiceClient> {
  const apiKey = process.env.API_KEY;
  const appId = process.env.APP_ID;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  if (!apiKey || !appId) {
    throw new Error('Missing required environment variables');
  }

  try {
    // Step 1: Get Endpoint
    const initialClient = new JsonServiceClient('https://active-ewebservice.biz/aeServices30/api');
    initialClient.requestFilter = req => {
      req.headers = new Headers({
        'apikey': apiKey,
        'appid': appId,
      });
    };

    const endpointResponse = await initialClient.get<AuthEndpoint>('/GetEndPoint');

    // Step 2: Create new client with received endpoint
    const client = new JsonServiceClient(`${endpointResponse.NewEndpointDomain}/api`);

    // Step 3: Authenticate with Security endpoint if username/password provided
    if (username && password) {
      client.requestFilter = req => {
        req.headers = new Headers({
          'apikey': apiKey,
          'oauthtoken': endpointResponse.OAuthToken,
        });
      };

      const securityRequest = new SecurityRequest({
        AppId: appId,
        Username: username,
        Password: password
      });

      const securityResponse = await client.api(securityRequest);

      // Step 4: Set up final client with all authentication headers
      client.requestFilter = req => {
        req.headers = new Headers({
          'apikey': apiKey,
          'oauthtoken': endpointResponse.OAuthToken,
          'appid': appId,
          'token': securityResponse.response?.Token || ''
        } as HeadersInit);
      };
    }

    return client;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}