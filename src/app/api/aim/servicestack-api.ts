import { SearchInventoryRequest, SearchInventoryResponse } from './dtos';

export async function searchInventory(params: Partial<SearchInventoryRequest>): Promise<SearchInventoryResponse> {
    try {
        const response = await fetch('/api/SearchInventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...params,
                IncludeDetails: true,
                IncludeSerials: true,
                IncludeMedia: true,
                IncludeAccessories: true,
                IncludePackages: true,
                IncludeIconImage: true,
                StartOffset: params.StartOffset || 0,
                RecordCount: params.RecordCount || 50
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.Status?.ErrorMessage || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
}

