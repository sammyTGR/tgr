import { JsonServiceClient, ApiResult } from '@servicestack/client';
import { SearchInventoryRequest, SearchInventoryResponse } from './dtos';

const baseUrl = process.env.AIM_API_URL || 'https://active-ewebservice.biz/aeServices30/api';

export const searchInventory = async (searchParams: Partial<SearchInventoryRequest>) => {
    const client = new JsonServiceClient(baseUrl);
    
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
        ...searchParams
    });

    return client.api(searchRequest);
};

// If you need these functions, implement them following the same pattern
export const getInventoryDetail = async (inventoryId: string) => {
    // Implement according to API documentation
    throw new Error('Not implemented');
};

export const lookupInventory = async (query: string) => {
    // Implement according to API documentation
    throw new Error('Not implemented');
};

