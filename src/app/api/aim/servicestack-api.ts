import { JsonServiceClient } from '@servicestack/client';
import { SearchInventoryRequest, SearchInventoryResponse } from './dtos';

// Define the endpoint discovery response type
interface EndpointResponse {
    NewEndpointDomain: string;
    NewEndpoint: string;
    OAuthToken: string;
}

export const searchInventory = async (searchParams: Partial<SearchInventoryRequest>) => {
    try {
        // Use the endpoint from your AIM client site
        const client = new JsonServiceClient('https://10846.active-e.net:7890/api');
        
        // Create request with proper authentication
        const request = new SearchInventoryRequest({
            ApiKey: process.env.API_KEY,
            AppId: process.env.APP_ID,
            ...searchParams
        });

        console.log('Making search request with:', {
            endpoint: client.baseUrl,
            requestType: request.getTypeName(),
            searchStr: searchParams.SearchStr,
            apiKey: process.env.API_KEY?.substring(0, 8) + '...' // Log only first 8 chars for security
        });

        const api = await client.api(request);

        if (api.response?.Status?.StatusCode === 'Error') {
            throw new Error(`API Error: ${api.response.Status.ErrorMessage} (Code: ${api.response.Status.ErrorCode})`);
        }

        return api.response as SearchInventoryResponse;

    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

// These can be implemented later when needed
export const getInventoryDetail = async (inventoryId: string) => {
    throw new Error('Not implemented');
};

export const lookupInventory = async (query: string) => {
    throw new Error('Not implemented');
};
