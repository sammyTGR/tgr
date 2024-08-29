import axios from 'axios';
import { JsonServiceClient } from '@servicestack/client';
import {
  InventoryDetailRequest,
  InventoryDetailResponse,
  InventoryLookupRequest,
  InventoryLookupResponse
} from './dtos';

const API_KEY = process.env.SERVICESTACK_API_KEY!;
const APP_ID = 'TGRIntegrations01';
const BASE_URL = 'https://active-ewebservice.biz/aeServices30';

let newEndpointDomain = '';
let oAuthToken = '';
let securityToken = '';

async function authenticate() {
  try {
    // Step 1: Get the endpoint and OAuth token
    const endpointResponse = await axios.get('https://active-ewebservice.biz/aeServices30/api/GetEndPoint', {
      headers: {
        'APIKey': API_KEY,
        'AppId': APP_ID
      },
      timeout: 10000 // 10 seconds timeout
    });

    console.log('Endpoint response:', endpointResponse.data);

    // Extract NewEndpointDomain and OAuthToken
    newEndpointDomain = endpointResponse.data.NewEndpointDomain;
    oAuthToken = endpointResponse.data.OAuthToken;

    // Step 2: Get the security token
    console.log('Getting security token');
    const securityResponse = await axios.post(`${newEndpointDomain}/Api/Security`, null, {
      headers: {
        'APIKey': API_KEY,
        'OAuthToken': oAuthToken
      },
      params: {
        AppId: APP_ID,
        UserName: process.env.API_USERNAME!,
        Password: process.env.API_PASSWORD!
      },
      timeout: 10000 // 10 seconds timeout
    });

    console.log('Security response:', securityResponse.data);

    // Set the security token
    securityToken = securityResponse.data.Token; // Ensure this is set correctly
    if (!securityToken) {
      throw new Error('Security token is undefined');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
    }
    throw error;
  }
}

const client = new JsonServiceClient(BASE_URL);

// Function to get inventory detail
export async function getInventoryDetail(model: string): Promise<InventoryDetailResponse> {
  await authenticate();

  const request = new InventoryDetailRequest({
    Model: model,
  });

  try {
    const response = await axios.post(`${newEndpointDomain}/json/reply/InventoryDetailRequest`, request, {
      headers: {
        'APIKey': API_KEY,
        'OAuthToken': oAuthToken, // Ensure this is set correctly
        'AppId': APP_ID,
        'Token': securityToken // Use the retrieved security token
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory detail:', error);
    throw error;
  }
}

// Function to lookup inventory
export async function lookupInventory(item: string, locationCode: string): Promise<InventoryLookupResponse> {
  await authenticate();

  const request = new InventoryLookupRequest({
    Item: item,
    LocationCode: locationCode,
  });

  try {
    console.log('Looking up inventory:', request);
    console.log('Using endpoint:', newEndpointDomain);
    const response = await axios.post(`${newEndpointDomain}/json/reply/InventoryLookupRequest`, request, {
      headers: {
        'APIKey': API_KEY,
        'OAuthToken': oAuthToken,
        'AppId': APP_ID,
        'Token': securityToken
      }
    });
    console.log('Inventory lookup response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error looking up inventory:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
    }
    throw error;
  }
}

// You can add more functions for other API calls here