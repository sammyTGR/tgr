
import axios from "axios";
import {
  InventoryDetailRequest,
  InventoryDetailResponse,
  InventoryLookupRequest,
  InventoryLookupResponse,
  SearchInventoryRequest,
  SearchInventoryResponse,
  BaseResponse
} from "./dtos";
import dotenv from "dotenv";
import { JsonServiceClient } from '@servicestack/client';

const client = new JsonServiceClient('https://10846.active-e.net:7890');

dotenv.config();

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

const API_KEY = process.env.ApiKey!;
const OAUTH_TOKEN = process.env.OAuthToken!;
const APP_ID = process.env.AppId!;
const TOKEN = process.env.Token!;
const API_USERNAME = process.env.Username!;
const API_PASSWORD = process.env.Password!;
const BASE_URL = "https://10846.active-e.net:7890";

// Function to get inventory detail
export async function getInventoryDetail(model: string): Promise<InventoryDetailResponse> {
  const request = new InventoryDetailRequest({
    Model: model,
    ApiKey: API_KEY,
    OAuthToken: OAUTH_TOKEN,
    AppId: APP_ID,
    Token: TOKEN,
    DeviceId: undefined,
    SkipImages: false,
    IncludeSerialInfo: true,
  });

  try {
    const response = await client.post(request);
    return response;
  } catch (error) {
    console.error('Error fetching inventory detail:', error);
    throw error;
  }
}

// Function to lookup inventory
export async function lookupInventory(
  item: string,
  locationCode?: string
): Promise<InventoryLookupResponse> {
  try {
    const response = await axios.get(`${BASE_URL}/api/InventoryLookup`, {
      headers: {
        ApiKey: API_KEY,
        OAuthToken: OAUTH_TOKEN,
        AppId: APP_ID,
        Token: TOKEN,
        Accept: "application/json",
      },
      params: {
        Username: encodeURIComponent(API_USERNAME),
        Password: encodeURIComponent(API_PASSWORD),
        Item: item,
        LocationCode: locationCode,
      },
    });

    // console.log('Inventory lookup response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error looking up inventory:",
        error.response?.data || error.message
      );
    } else {
      console.error("Error looking up inventory:", error);
    }
    throw error;
  }
}

// Function to search inventory
export async function searchInventory(
  searchStr: string
): Promise<SearchInventoryResponse> {
  const request = new SearchInventoryRequest({
    SearchStr: searchStr,
    StartOffset: 0,
    RecordCount: 100,
  });

  let retries = 0;
  let delay = INITIAL_DELAY;

  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch('/api/proxy/searchInventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES) {
        console.error('Max retries reached. Unable to complete the request.');
        throw error;
      }
      console.log(`Retry attempt ${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw new Error('Unable to complete the request after multiple retries');
}

// You can add more functions for other API calls here
