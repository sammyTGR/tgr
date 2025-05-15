import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BASE_URL = 'https://cloud.fastbound.com';
const API_KEY = process.env.FASTBOUND_API_KEY!;
const ACCOUNT_NUMBER = process.env.FASTBOUND_ACCOUNT_NUMBER!;
const FASTBOUND_ACCOUNT_EMAIL = process.env.FASTBOUND_ACCOUNT_EMAIL!;

if (!API_KEY || !ACCOUNT_NUMBER) {
  throw new Error('FastBound API key or account number is not set');
}

// Add interface for header types
export interface HeadersType {
  Authorization: string;
  'X-AuditUser': string;
  Accept: string;
  'X-Requested-With': string;
  'Content-Type'?: string;
  [key: string]: string | undefined;
}

// Helper function to create FastBound headers
export function createFastBoundHeaders(additionalHeaders: Partial<HeadersType> = {}) {
  const baseHeaders: HeadersType = {
    Authorization: `Basic ${Buffer.from(`${API_KEY}:`).toString('base64')}`,
    'X-AuditUser': FASTBOUND_ACCOUNT_EMAIL || '',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...additionalHeaders,
  };

  if (!('Content-Type' in additionalHeaders)) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  return baseHeaders;
}

// Export constants for use in other routes
export const FASTBOUND_CONFIG = {
  BASE_URL,
  ACCOUNT_NUMBER,
  API_KEY,
  ACCOUNT_EMAIL: FASTBOUND_ACCOUNT_EMAIL,
};
