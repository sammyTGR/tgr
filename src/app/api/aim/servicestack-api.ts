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
import { JsonServiceClient, ApiResult } from '@servicestack/client';

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

// Updated interface based on API documentation
interface SearchInventoryParams {
  locFk?: number;
  mfgFk?: number;
  catFk?: number;
  subFk?: number;
  selFk?: number;
  cat?: number;
  sub?: number;
  selectionCode?: string;
  mfg?: string;
  includeSerials?: boolean;
  includeMedia?: boolean;
  includeAccessories?: boolean;
  includePackages?: boolean;
  includeDetails?: boolean;
  includeIconImage?: boolean;
  exactModel?: boolean;
  startOffset?: number;
  recordCount?: number;
  catIdList?: number[];
  subIdList?: number[];
  mfgIdList?: number[];
  selIdList?: number[];
  includeDeleted?: boolean;
  changedDate?: Date;
  minimumAvailableQuantity?: number;
  includePackageLineItems?: boolean;
}

const client = new JsonServiceClient('https://active-ewebservice.biz/aeServices30/api');

// Function to get inventory detail
export async function getInventoryDetail(model: string): Promise<InventoryDetailResponse> {
  const request = new InventoryDetailRequest({
    Model: model,
    ApiKey: process.env.API_KEY,
    AppId: process.env.APP_ID,
    SkipImages: false,
    IncludeSerialInfo: true,
  });

  try {
    const response = await client.api(request) as ApiResult<InventoryDetailResponse>;
    return response.response as InventoryDetailResponse;
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
  const request = new InventoryLookupRequest({
    ApiKey: process.env.API_KEY,
    AppId: process.env.APP_ID,
    Item: item,
    LocationCode: locationCode,
  });

  try {
    const result = await client.api(request) as ApiResult<InventoryLookupResponse>;
    return result.response as InventoryLookupResponse;
  } catch (error) {
    console.error('Error looking up inventory:', error);
    throw error;
  }
}

// Updated searchInventory function with proper error handling
export async function searchInventory(
  searchStr: string = "",
  params?: SearchInventoryParams
): Promise<SearchInventoryResponse> {
  try {
    const response = await fetch('/api/SearchInventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchStr,
        ...params
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search inventory error:', error);
    throw error;
  }
}

// You can add more functions for other API calls here
