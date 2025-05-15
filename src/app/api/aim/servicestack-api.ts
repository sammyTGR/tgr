import { JsonServiceClient } from '@servicestack/client';
import { SearchInventoryRequest, SearchInventoryResponse } from './dtos';

interface EndpointResponse {
  NewEndpointDomain: string;
  NewEndpoint: string;
  OAuthToken: string;
}

interface SecurityResponse {
  Token: string;
}

async function getEndpoint(): Promise<EndpointResponse> {
  const response = await fetch('https://active-ewebservice.biz/aeServices30/api/GetEndPoint', {
    method: 'GET',
    headers: {
      APIKey: process.env.API_KEY || '',
      AppId: process.env.APP_ID || '',
    },
  });

  if (!response.ok) {
    throw new Error(`GetEndPoint failed: ${response.statusText}`);
  }

  return await response.json();
}

async function getSecurityToken(endpointDomain: string, oAuthToken: string): Promise<string> {
  const url = new URL(`${endpointDomain}/api/Security`);
  url.searchParams.append('AppId', process.env.APP_ID || '');
  url.searchParams.append('UserName', process.env.USERNAME || '');
  url.searchParams.append('Password', process.env.PASSWORD || '');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      APIKey: process.env.API_KEY || '',
      OAuthToken: oAuthToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Security token request failed: ${response.statusText}`);
  }

  const securityResponse: SecurityResponse = await response.json();
  return securityResponse.Token;
}

export const searchInventory = async (searchParams: Partial<SearchInventoryRequest>) => {
  try {
    console.log('Starting authentication flow...');

    // Step 1: Get endpoint and OAuth token
    const endpointResponse = await getEndpoint();
    console.log('Endpoint response received:', {
      domain: endpointResponse.NewEndpointDomain,
      hasOAuthToken: !!endpointResponse.OAuthToken,
    });

    // Step 2: Get security token
    const securityToken = await getSecurityToken(
      endpointResponse.NewEndpointDomain,
      endpointResponse.OAuthToken
    );
    console.log('Security token received');

    // Step 3: Make the actual inventory search request
    const client = new JsonServiceClient(endpointResponse.NewEndpointDomain);

    // Set all required headers
    client.headers = new Headers({
      APIKey: process.env.API_KEY!,
      OAuthToken: endpointResponse.OAuthToken,
      AppId: process.env.APP_ID!,
      Token: securityToken,
    });

    const request = new SearchInventoryRequest({
      ApiKey: process.env.API_KEY,
      AppId: process.env.APP_ID,
      ...searchParams,
    });

    console.log('Making search request with:', {
      endpoint: client.baseUrl,
      requestType: request.getTypeName(),
      searchStr: searchParams.SearchStr,
    });

    const api = await client.api(request);
    console.log('Raw API response received');

    if (!api || !api.response) {
      throw new Error('No response received from API');
    }

    const response = api.response as SearchInventoryResponse;

    // Create a sanitized version of the response
    const sanitizedResponse: SearchInventoryResponse = {
      Status: response?.Status
        ? {
            StatusCode: response.Status.StatusCode,
            ErrorCode: response.Status.ErrorCode,
            ErrorMessage: response.Status.ErrorMessage,
            ErrorDisplayText: response.Status.ErrorDisplayText,
            Login: response.Status.Login,
            DomainName: response.Status.DomainName,
            IpAddress: response.Status.IpAddress,
          }
        : undefined,
      Records:
        response?.Records?.map((record) => ({
          Pk: record.Pk,
          Description: record.Description,
          InventoryType: record.InventoryType,
          Manufacturer: record.Manufacturer,
          Model: record.Model,
          CategoryDescription: record.CategoryDescription,
          SubCategoryDescription: record.SubCategoryDescription,
          SelectionCode: record.SelectionCode,
          SelectionCodeDescription: record.SelectionCodeDescription,
          Sku: record.Sku,
          Mpn: record.Mpn,
          CustomerPrice: record.CustomerPrice,
          Discontinued: record.Discontinued,
        })) ?? [],
      TotalRecords: response?.TotalRecords,
      StartOffset: response?.StartOffset,
      RecordCount: response?.RecordCount,
      RemainingRecords: response?.RemainingRecords,
    };

    if (sanitizedResponse?.Status?.StatusCode === 'Error') {
      throw new Error(
        `API Error: ${sanitizedResponse.Status.ErrorMessage} (Code: ${sanitizedResponse.Status.ErrorCode})`
      );
    }

    return sanitizedResponse;
  } catch (error) {
    console.error('API error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      fullError: error,
    });
    throw error;
  }
};

// These can be implemented later when needed
export const getInventoryDetail = async (inventoryId: string) => {
  throw new Error('Not implemented');
};

export const lookupInventory = async (query: string) => {
  throw new Error('Not implemented');
};
