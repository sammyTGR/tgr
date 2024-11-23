import { JsonServiceClient } from '@servicestack/client';
import { SearchInventoryRequest, SearchInventoryResponse } from './dtos';
import { getAuthenticatedClient } from '@/lib/auth/service';

export const searchInventory = async (searchParams: Partial<SearchInventoryRequest>) => {
  try {
    // Get authenticated client that has gone through all auth steps
    const client = await getAuthenticatedClient();
    
    const searchRequest = new SearchInventoryRequest({
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
  } catch (error) {
    console.error('Search inventory error:', error);
    throw error;
  }
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

