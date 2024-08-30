import axios from 'axios';
import {
  InventoryDetailRequest,
  InventoryDetailResponse,
  InventoryLookupRequest,
  InventoryLookupResponse,
  SearchInventoryRequest,
  SearchInventoryResponse
} from './dtos';

const API_KEY = process.env.ApiKey! || '';
const OAUTH_TOKEN = process.env.OAuthToken! || '';
const APP_ID = process.env.AppId! || '';
const TOKEN = process.env.Token! || '';
const API_USERNAME = process.env.Username! || '';
const API_PASSWORD = process.env.Password! || '';
const BASE_URL = 'https://10846.active-e.net:7890';

// Function to get inventory detail
export async function getInventoryDetail(model: string): Promise<InventoryDetailResponse> {
  const request = new InventoryDetailRequest({
    Model: model,
  });

  try {
    const response = await axios.post(`${BASE_URL}/json/reply/InventoryDetailRequest`, request, {
      headers: {
        'ApiKey': API_KEY,
        'OAuthToken': OAUTH_TOKEN,
        'AppId': APP_ID,
        'Token': TOKEN,
        // 'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory detail:', error);
    throw error;
  }
}

// Function to lookup inventory
export async function lookupInventory(item: string, locationCode?: string): Promise<InventoryLookupResponse> {
  try {
    const response = await axios.get(`${BASE_URL}/api/InventoryLookup`, {
      headers: {
        'ApiKey': API_KEY,
        'OAuthToken': OAUTH_TOKEN,
        'AppId': APP_ID,
        'Token': TOKEN,
        'Accept': 'application/json'
      },
      params: {
        Username: encodeURIComponent(API_USERNAME),
        Password: encodeURIComponent(API_PASSWORD),
        Item: item,
        LocationCode: locationCode
      }
    });

    console.log('Inventory lookup response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error looking up inventory:', error.response?.data || error.message);
    } else {
      console.error('Error looking up inventory:', error);
    }
    throw error;
  }
}

// Function to search inventory
export async function searchInventory(searchStr: string): Promise<SearchInventoryResponse> {
  try {
    const response = await axios.get(`${BASE_URL}/api/SearchInventory`, {
      headers: {
        'ApiKey': API_KEY,
        'OAuthToken': OAUTH_TOKEN,
        'AppId': APP_ID,
        'Token': TOKEN,
        'Accept': 'application/json'
      },
      params: {
        Username: encodeURIComponent(API_USERNAME),
        Password: encodeURIComponent(API_PASSWORD),
        SearchStr: searchStr,
        StartOffset: 0,
        RecordCount: 100 // You can adjust this value as needed
      }
    });

    console.log('Inventory search response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error searching inventory:', error.response?.data || error.message);
    } else {
      console.error('Error searching inventory:', error);
    }
    throw error;
  }
}

// You can add more functions for other API calls here