import { IRequestInit, IReturn, JsonServiceClient } from '@servicestack/client';
import https from 'https';

interface GetEndPointResponse {
  NewEndpointDomain?: string;
  OAuthToken?: string;
  Status?: {
    StatusCode?: string;
    ErrorMessage?: string;
  };
}

interface SecurityResponse {
  Token?: string;
  Status?: {
    StatusCode?: string;
    ErrorMessage?: string;
  };
}

// Define Security request DTO according to ServiceStack pattern
class SecurityRequest implements IReturn<SecurityResponse> {
  AppId?: string;
  UserName?: string;
  Password?: string;

  constructor(init?: Partial<SecurityRequest>) {
    Object.assign(this, init);
  }

  getTypeName() {
    return 'Security';
  }
  createResponse() {
    return {} as SecurityResponse;
  }
}

interface AuthResult {
  client: JsonServiceClient;
  domain: string;
  token?: string;
  oAuthToken?: string;
}

export async function getAuthenticatedClient(retryCount = 0): Promise<AuthResult> {
  try {
    // console.log('Initializing authentication client...');

    // Create HTTPS agent that allows self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // WARNING: This bypasses SSL verification
      timeout: 30000, // 30 second timeout
    });

    const baseClient = new JsonServiceClient('https://active-ewebservice.biz/aeServices30/api');

    // Configure the client
    baseClient.bearerToken = process.env.API_KEY!;
    baseClient.headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ApiKey: process.env.API_KEY!,
      AppId: process.env.APP_ID!,
    });

    // Add the agent to the fetch options
    baseClient.requestFilter = (req: IRequestInit) => {
      (req as any).agent = httpsAgent;
    };

    // console.log('Getting endpoint...');
    const endpointResponse = await baseClient.get<GetEndPointResponse>('GetEndPoint');

    if (!endpointResponse?.NewEndpointDomain) {
      throw new Error('Failed to get endpoint domain');
    }

    const formattedEndpoint = endpointResponse.NewEndpointDomain.startsWith('http')
      ? endpointResponse.NewEndpointDomain
      : `https://${endpointResponse.NewEndpointDomain}`;

    // console.log('Endpoint received:', formattedEndpoint);

    // Create final authenticated client
    const client = new JsonServiceClient(`${formattedEndpoint}/api`);
    client.headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ApiKey: process.env.API_KEY!,
      AppId: process.env.APP_ID!,
      OAuthToken: endpointResponse.OAuthToken || '',
    });

    // Add the agent to the fetch options for the authenticated client
    client.requestFilter = (req: IRequestInit) => {
      (req as any).agent = httpsAgent;
    };

    return {
      client,
      domain: formattedEndpoint,
      oAuthToken: endpointResponse.OAuthToken,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    if (retryCount < 3) {
      // console.log(`Retrying authentication (attempt ${retryCount + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return getAuthenticatedClient(retryCount + 1);
    }
    throw error;
  }
}
